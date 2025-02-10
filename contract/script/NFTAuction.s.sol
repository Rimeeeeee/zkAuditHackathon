// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {NFTAuction} from "../src/Counter.sol";

contract NFTAuctionScript is Script {
    NFTAuction public nftAuction;

    function run() public {
        vm.startBroadcast();
        nftAuction = new NFTAuction();
        vm.stopBroadcast();
    }
}