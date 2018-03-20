pragma solidity ^0.4.11;

import "../../contracts/MerkleIndividuallyCappedCrowdsale.sol";
import "zeppelin-solidity/contracts/token/ERC20/MintableToken.sol";


contract MerkleIndividuallyCappedCrowdsaleImpl is MerkleIndividuallyCappedCrowdsale {

    function MerkleIndividuallyCappedCrowdsaleImpl(uint256 _rate, address _wallet, ERC20 _token)
        Crowdsale(_rate, _wallet, _token) public
    {
    }

}