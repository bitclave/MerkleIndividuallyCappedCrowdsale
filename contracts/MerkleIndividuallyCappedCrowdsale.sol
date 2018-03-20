pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/MerkleProof.sol";


contract MerkleIndividuallyCappedCrowdsale is Crowdsale, Ownable {
    using MerkleProof for bytes;

    mapping(address => uint256) public contributions;
    bytes32 public capsMerkleRoot;

    function setCapsMerkleRoot(bytes32 _capsMerkleRoot) public onlyOwner {
        capsMerkleRoot = _capsMerkleRoot;
    }

    function buyTokens(address _beneficiary) public payable {
        revert();
    }

    function buyTokens(address _beneficiary, uint256 _individualCap, bytes _proof) public payable {
        require(contributions[_beneficiary] + msg.value <= _individualCap);
        bytes32 leaf = keccak256(_beneficiary, _individualCap);
        require(_proof.verifyProof(capsMerkleRoot, leaf));
        
        contributions[_beneficiary] += msg.value;
        super.buyTokens(_beneficiary);
    }

}