// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {ZkvAttestationContract} from "../src/Counter.sol";

contract ZkvVerifierContractScript is Script {
    ZkvAttestationContract public zkvAttestationContract;

    function run() public {
        vm.startBroadcast();

        address zkvContract = vm.envAddress("ETH_ZKVERIFY_CONTRACT_ADDRESS");
        bytes32 vkHash = vm.envBytes32("VK_HASH");
        address nftAuctionContract = vm.envAddress("NFT_AUCTION_CONTRACT_ADDRESS");
        zkvAttestationContract = new ZkvAttestationContract(zkvContract, vkHash, nftAuctionContract);

        vm.stopBroadcast();
    }
}