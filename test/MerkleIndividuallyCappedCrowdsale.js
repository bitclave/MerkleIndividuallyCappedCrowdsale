// @flow
'use strict'

const BigNumber = web3.BigNumber;
const expect = require('chai').expect;
const should = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(web3.BigNumber))
    .should();

import ether from './helpers/ether';
import {advanceBlock} from './helpers/advanceToBlock';
import {increaseTimeTo, duration} from './helpers/increaseTime';
import latestTime from './helpers/latestTime';
import EVMRevert from './helpers/EVMRevert';
import MerkleTree from './helpers/merkleTree.js';

const MerkleProof = artifacts.require('zeppelin-solidity/contracts/MerkleProof');
const MintableToken = artifacts.require('zeppelin-solidity/contracts/token/ERC20/MintableToken');
const MerkleIndividuallyCappedCrowdsale = artifacts.require('MerkleIndividuallyCappedCrowdsaleImpl');

function padLeft(s, n, str){
    return Array(n - String(s).length + 1).join(str || '0') + s;
}

contract('MerkleIndividuallyCappedCrowdsale', function ([_, wallet1, wallet2, wallet3, wallet4, wallet5, wallet6]) {

    before(async function() {
        MerkleIndividuallyCappedCrowdsale.link('MerkleProof', (await MerkleProof.new()).address);
    })

    it('should work correctly', async function() {
        const caps = {
            [wallet1]: 100,
            [wallet2]: 200,
            [wallet3]: 300,
            [wallet4]: 400,
            [wallet5]: 500,
            [wallet6]: 600,
        };

        const elements = Object.keys(caps).map(key =>
            new Buffer(key.substr(2) + padLeft(caps[key].toString(16), 64, 0), 'hex') // 20 + 32 bytes
        );

        const merkleTree = new MerkleTree(elements);
        const root = merkleTree.getHexRoot();
        const leaf = web3.sha3(elements[0]);
        const proof = merkleTree.getHexProof(elements[0]);

        //console.log(caps);
        //console.log('\elements =\n', elements);
        //console.log('\nmerkleTree =\n', merkleTree);
        //console.log('\nroot =', root);
        //console.log('\nleaf =', leaf);
        //console.log('\nproof =', proof);

        const token = await MintableToken.new();
        const crowdsale = await MerkleIndividuallyCappedCrowdsale.new(1, _, token.address);
        await crowdsale.setCapsMerkleRoot(root);
        await token.mint(crowdsale.address, 1000000);

        // Original method
        await crowdsale.buyTokens(wallet1, {value: 40}).should.be.rejectedWith(EVMRevert);

        // Wrong proofs
        await crowdsale.buyTokens(wallet1, 100, merkleTree.getHexProof(elements[1]), {value: 40}).should.be.rejectedWith(EVMRevert);
        await crowdsale.buyTokens(wallet2, 200, merkleTree.getHexProof(elements[2]), {value: 40}).should.be.rejectedWith(EVMRevert);
        await crowdsale.buyTokens(wallet3, 300, merkleTree.getHexProof(elements[3]), {value: 40}).should.be.rejectedWith(EVMRevert);
        await crowdsale.buyTokens(wallet4, 400, merkleTree.getHexProof(elements[4]), {value: 40}).should.be.rejectedWith(EVMRevert);
        await crowdsale.buyTokens(wallet5, 500, merkleTree.getHexProof(elements[0]), {value: 40}).should.be.rejectedWith(EVMRevert);

        // Wrong caps
        await crowdsale.buyTokens(wallet1, 200, merkleTree.getHexProof(elements[0]), {value: 40}).should.be.rejectedWith(EVMRevert);
        await crowdsale.buyTokens(wallet2, 100, merkleTree.getHexProof(elements[1]), {value: 40}).should.be.rejectedWith(EVMRevert);
        await crowdsale.buyTokens(wallet3, 500, merkleTree.getHexProof(elements[2]), {value: 40}).should.be.rejectedWith(EVMRevert);
        await crowdsale.buyTokens(wallet4, 300, merkleTree.getHexProof(elements[3]), {value: 40}).should.be.rejectedWith(EVMRevert);
        await crowdsale.buyTokens(wallet5, 400, merkleTree.getHexProof(elements[4]), {value: 40}).should.be.rejectedWith(EVMRevert);

        // Wrong wallets
        await crowdsale.buyTokens(wallet2, 100, merkleTree.getHexProof(elements[0]), {value: 40}).should.be.rejectedWith(EVMRevert);
        await crowdsale.buyTokens(wallet1, 200, merkleTree.getHexProof(elements[1]), {value: 40}).should.be.rejectedWith(EVMRevert);
        await crowdsale.buyTokens(wallet5, 300, merkleTree.getHexProof(elements[2]), {value: 40}).should.be.rejectedWith(EVMRevert);
        await crowdsale.buyTokens(wallet3, 400, merkleTree.getHexProof(elements[3]), {value: 40}).should.be.rejectedWith(EVMRevert);
        await crowdsale.buyTokens(wallet4, 400, merkleTree.getHexProof(elements[4]), {value: 40}).should.be.rejectedWith(EVMRevert);

        // Wallet1
        await crowdsale.buyTokens(wallet1, 100, merkleTree.getHexProof(elements[0]), {value: 101}).should.be.rejectedWith(EVMRevert);
        await crowdsale.buyTokens(wallet1, 100, merkleTree.getHexProof(elements[0]), {value: 40}).should.be.fulfilled;
        await crowdsale.buyTokens(wallet1, 100, merkleTree.getHexProof(elements[0]), {value: 61}).should.be.rejectedWith(EVMRevert);
        await crowdsale.buyTokens(wallet1, 100, merkleTree.getHexProof(elements[0]), {value: 60}).should.be.fulfilled;
        await crowdsale.buyTokens(wallet1, 100, merkleTree.getHexProof(elements[0]), {value: 1}).should.be.rejectedWith(EVMRevert);

        // Wallet2
        await crowdsale.buyTokens(wallet2, 200, merkleTree.getHexProof(elements[1]), {value: 201}).should.be.rejectedWith(EVMRevert);
        await crowdsale.buyTokens(wallet2, 200, merkleTree.getHexProof(elements[1]), {value: 40}).should.be.fulfilled;
        await crowdsale.buyTokens(wallet2, 200, merkleTree.getHexProof(elements[1]), {value: 161}).should.be.rejectedWith(EVMRevert);
        await crowdsale.buyTokens(wallet2, 200, merkleTree.getHexProof(elements[1]), {value: 160}).should.be.fulfilled;
        await crowdsale.buyTokens(wallet2, 200, merkleTree.getHexProof(elements[1]), {value: 1}).should.be.rejectedWith(EVMRevert);

        // Wallet3
        await crowdsale.buyTokens(wallet3, 300, merkleTree.getHexProof(elements[2]), {value: 301}).should.be.rejectedWith(EVMRevert);
        await crowdsale.buyTokens(wallet3, 300, merkleTree.getHexProof(elements[2]), {value: 40}).should.be.fulfilled;
        await crowdsale.buyTokens(wallet3, 300, merkleTree.getHexProof(elements[2]), {value: 261}).should.be.rejectedWith(EVMRevert);
        await crowdsale.buyTokens(wallet3, 300, merkleTree.getHexProof(elements[2]), {value: 260}).should.be.fulfilled;
        await crowdsale.buyTokens(wallet3, 300, merkleTree.getHexProof(elements[2]), {value: 1}).should.be.rejectedWith(EVMRevert);

        // Wallet4
        await crowdsale.buyTokens(wallet4, 400, merkleTree.getHexProof(elements[3]), {value: 401}).should.be.rejectedWith(EVMRevert);
        await crowdsale.buyTokens(wallet4, 400, merkleTree.getHexProof(elements[3]), {value: 40}).should.be.fulfilled;
        await crowdsale.buyTokens(wallet4, 400, merkleTree.getHexProof(elements[3]), {value: 361}).should.be.rejectedWith(EVMRevert);
        await crowdsale.buyTokens(wallet4, 400, merkleTree.getHexProof(elements[3]), {value: 360}).should.be.fulfilled;
        await crowdsale.buyTokens(wallet4, 400, merkleTree.getHexProof(elements[3]), {value: 1}).should.be.rejectedWith(EVMRevert);

        // Wallet5
        await crowdsale.buyTokens(wallet5, 500, merkleTree.getHexProof(elements[4]), {value: 501}).should.be.rejectedWith(EVMRevert);
        await crowdsale.buyTokens(wallet5, 500, merkleTree.getHexProof(elements[4]), {value: 40}).should.be.fulfilled;
        await crowdsale.buyTokens(wallet5, 500, merkleTree.getHexProof(elements[4]), {value: 461}).should.be.rejectedWith(EVMRevert);
        await crowdsale.buyTokens(wallet5, 500, merkleTree.getHexProof(elements[4]), {value: 460}).should.be.fulfilled;
        await crowdsale.buyTokens(wallet5, 500, merkleTree.getHexProof(elements[4]), {value: 1}).should.be.rejectedWith(EVMRevert);
    })

    /*
    //
    // const root = tree[tree.length - 1][0];
    //
    function buildMerkleTree(elements) {
        elements.sort();

        let tree = [];
        tree[0] = elements;
        for (let r = 1; 2**(r-1) < elements.length; r++) {
            tree[r] = [];
            for (let i = 0; i < tree[r-1].length; i+=2**r) {
                const j = i + 2**(r-1);
                if (j >= tree[r-1].length) {
                    tree[r][i] = tree[r-1][i];
                } else
                if (tree[r-1][i] < tree[r-1][j]) {
                    tree[r][i] = web3.sha3(tree[r-1][i].substr(2) + tree[r-1][j].substr(2), { encoding: 'hex' });
                } else {
                    tree[r][i] = web3.sha3(tree[r-1][j].substr(2) + tree[r-1][i].substr(2), { encoding: 'hex' });
                }
            }
        }

        return tree;
    }
*/

})
