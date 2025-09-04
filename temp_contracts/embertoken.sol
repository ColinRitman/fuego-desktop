// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title embertoken
 * @dev This is the ERC20 token contract for Embers (HEAT).
 * The owner has the ability to mint new tokens.
 */
contract embertoken is ERC20, Ownable {
    /**
     * @dev Sets the values for {name} and {symbol}.
     * The `initialOwner` will be the deployer of the contract.
     */
    constructor(address initialOwner) ERC20("Embers", "HEAT") Ownable(initialOwner) {}

    /**
     * @dev Creates `amount` new tokens and assigns them to `to`.
     * Can only be called by the owner.
     *
     * Emits a {Transfer} event with `from` set to the zero address.
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
} 