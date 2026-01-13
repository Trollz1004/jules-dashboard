// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
/*
contract YouAndINotAIAdapter {
    address public treasury;
    uint256 public percentBps; // 500 = 5%
    event SplitExecuted(address indexed payer, uint256 gross, uint256 treasuryAmount);
    constructor(address _treasury, uint256 _percentBps) {
        treasury = _treasury;
        percentBps = _percentBps;
    }
    function split(address payer) external payable {
        uint256 gross = msg.value;
        uint256 treasuryAmount = (gross * percentBps) / 10000;
        (bool ok,) = treasury.call{value: treasuryAmount}("");
        require(ok, "treasury_transfer_failed");
        emit SplitExecuted(payer, gross, treasuryAmount);
    }
}
*/
