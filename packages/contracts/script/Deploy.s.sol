// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std-1.15.0/src/Script.sol";
import {AbstractStreamChannel} from "../src/AbstractStreamChannel.sol";

/**
 * @notice Deployment script for AbstractStreamChannel.
 *
 * Usage (testnet):
 *   export ABSTRACT_TESTNET_RPC=https://api.testnet.abs.xyz
 *   export DEPLOYER_PRIVATE_KEY=0x...
 *   forge script script/Deploy.s.sol \
 *     --rpc-url abstract_testnet \
 *     --broadcast \
 *     --private-key $DEPLOYER_PRIVATE_KEY
 *
 * For zksolc (required for actual Abstract deployment):
 *   See README.md — requires foundry-zksync or hardhat-zksync toolchain.
 *
 * Verification (via abscan):
 *   forge verify-contract <ADDRESS> AbstractStreamChannel \
 *     --rpc-url abstract_testnet \
 *     --etherscan-api-key $ABSCAN_API_KEY
 */
contract DeployAbstractStreamChannel is Script {
    function run() external {

        console2.log("Deployer:", msg.sender);
        console2.log("Chain ID:", block.chainid);

        vm.startBroadcast();

        AbstractStreamChannel escrow = new AbstractStreamChannel{salt: bytes32(0)}();
        console2.log("AbstractStreamChannel deployed:", address(escrow));
        console2.log("VOUCHER_TYPEHASH:", vm.toString(escrow.VOUCHER_TYPEHASH()));
        console2.log("Domain Separator:", vm.toString(escrow.domainSeparator()));

        vm.stopBroadcast();
    }
}
