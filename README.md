# MerkleIndividuallyCappedCrowdsale

[![Build Status](https://travis-ci.org/bitclave/MerkleIndividuallyCappedCrowdsale.svg?branch=master)](https://travis-ci.org/bitclave/MerkleIndividuallyCappedCrowdsale)
[![Coverage Status](https://coveralls.io/repos/github/bitclave/MerkleIndividuallyCappedCrowdsale/badge.svg)](https://coveralls.io/github/bitclave/MerkleIndividuallyCappedCrowdsale)

BitClave implementation of MerkleIndividuallyCappedCrowdsale contract as alternative version of OpenZeppelin IndividuallyCappedCrowdsale contract

# Installation

1. Install [truffle](http://truffleframework.com) globally with `npm install -g truffle`
2. Install [ganache-cli](https://github.com/trufflesuite/ganache-cli) globally with `npm install -g ganache-cli`
3. Install local packages with `npm install`
4. Run ganache in separate terminal `scripts/rpc.sh`
5. Run tests with `npm test`

On macOS you also need to install watchman: `brew install watchman`

# Usage

First of collect all personal caps records like this (addresses and weis):
```
{ '0xf17f52151ebef6c7334fad080c5704d77216b732': 10000000000000000000,
  '0xc5fdf4076b8f3a5357c5e395ab970b5b54098fef': 20000000000000000000,
  '0x821aea9a577a9b44299b9c15c88cf3087f3b5544': 30000000000000000000,
  '0x0d1d4e623d10f9fba5db95830f7d3839406c6af2': 40000000000000000000,
  '0x2932b7a2355d6fecc4b5c0b6bd44cc31df247a2e': 50000000000000000000,
  '0x2191ef87e392377ec08e7c08eb105ef5448eced5': 60000000000000000000 }
```

Encode addresses to 20 bytes and caps to 32 bytes:
```
[ '0xf17f52151ebef6c7334fad080c5704d77216b7320000000000000000000000000000000000000000000000008ac7230489e80000',
  '0xc5fdf4076b8f3a5357c5e395ab970b5b54098fef000000000000000000000000000000000000000000000001158e460913d00000',
  '0x821aea9a577a9b44299b9c15c88cf3087f3b5544000000000000000000000000000000000000000000000001a055690d9db80000',
  '0x0d1d4e623d10f9fba5db95830f7d3839406c6af20000000000000000000000000000000000000000000000022b1c8c1227a00000',
  '0x2932b7a2355d6fecc4b5c0b6bd44cc31df247a2e000000000000000000000000000000000000000000000002b5e3af16b1880000',
  '0x2191ef87e392377ec08e7c08eb105ef5448eced500000000000000000000000000000000000000000000000340aad21b3b700000' ]
```

Compute `keccak256`(modern `sha3`) hash of every element:
```
[ '0x548e22c5a9a20739b962798b09c802cb114e6e3e05a88f2b5d646a8e986ec73f',    [sha3(1)]
  '0x48e24e3451356d11c3b438c7aeb4c8fb840cffa905a7900ce9383c36ba6e9cfa',    [sha3(2)]
  '0x2a20814e541bcc998766167a1c197cd5f077cfbbba34c927588ced9d090e591d',    [sha3(3)]
  '0x147c148a719adb1f94976d74fc8ff3de294b2d4e57ffd189deb07a6aa8d75da8',    [sha3(4)]
  '0xb9b8a7973a1b4cc42ab9629bd3790e25452d1735bc443eb0b6edf227f8ee9fa8',    [sha3(5)]
  '0x2f1600e6ca0a781608009b8102af6394bea1c220ce2797bfafb0145a6410248d' ]   [sha3(6)]
```

Sort hashes alphabetically:
```
[ '0x147c148a719adb1f94976d74fc8ff3de294b2d4e57ffd189deb07a6aa8d75da8',    [sha3(4)]
  '0x2a20814e541bcc998766167a1c197cd5f077cfbbba34c927588ced9d090e591d',    [sha3(3)]
  '0x2f1600e6ca0a781608009b8102af6394bea1c220ce2797bfafb0145a6410248d',    [sha3(6)]
  '0x48e24e3451356d11c3b438c7aeb4c8fb840cffa905a7900ce9383c36ba6e9cfa',    [sha3(2)]
  '0x548e22c5a9a20739b962798b09c802cb114e6e3e05a88f2b5d646a8e986ec73f',    [sha3(1)]
  '0xb9b8a7973a1b4cc42ab9629bd3790e25452d1735bc443eb0b6edf227f8ee9fa8' ]   [sha3(5)]
```

Compute hash of each pair of hashes concatenation (1 and 2, 3 and 4, 5 and 6):
```
[ '0x2fbe7c4e6bd592efa384a081448dc4e02e85848ab5b97975a6450cdafcda3d97',    [a = sha3(sha3(1),sha3(2))]
  '0x8190b9b779efa3e0222df527801ef720cd11aad2dcd9a695586c7e55fae1eed3',    [b = sha3(sha3(3),sha3(4))]
  '0x4827497e9d868c653480f28a9f45a66747643ab8211d636d61ebe4ba44bb89b4' ]   [c = sha3(sha3(5),sha3(6))]
```

Compute hash of each pair of hashes concatenation from prev step:
```
[ '0x297c015ccea140f94f1ebe91557f0e2970a7f0a4432eb15882a49ee226f02865',    [x = sha3(a,b)]
  '0x4827497e9d868c653480f28a9f45a66747643ab8211d636d61ebe4ba44bb89b4' ]   [c]
```

Compute hash of each pair of hashes concatenation from prev step:
```
[ '0xd99a76256566a864cd0ce1894893be9fb118582357a1ff900991b43eff9e8ace' ]    [Z = sha3(x,c)]
```

Until you got single result:
```
'0xd99a76256566a864cd0ce1894893be9fb118582357a1ff900991b43eff9e8ace'
```

Store this value in smart contract as Merkle Tree Root:
```
contract.setCapsMerkleRoot('0xd99a76256566a864cd0ce1894893be9fb118582357a1ff900991b43eff9e8ace')
```

Then make investors to pass individual caps and Merkle Tree Proofs to smart contract during crowdsale:
```
           [Z]
         /     \
      [x]       \
    /     \      \
  [a]     [b]     [c]
 /   \   /   \   /   \
[4] [3] [6] [2] [1] [5]
```

Here is Merkle Tree Proof for investor [2]:
```
0x
2f1600e6ca0a781608009b8102af6394bea1c220ce2797bfafb0145a6410248d    [6]
2fbe7c4e6bd592efa384a081448dc4e02e85848ab5b97975a6450cdafcda3d97    [a]
4827497e9d868c653480f28a9f45a66747643ab8211d636d61ebe4ba44bb89b4    [c]
```
