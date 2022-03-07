//importing the library and files 
import {ethers, upgrades} from "hardhat";
import {Incrementor} from "../../../typechain-types";
import {DE_BRIDGE_GATE_ADDRESS} from "./constants";
import { getImplementationAddress } from '@openzeppelin/upgrades-core';
import { constantMessage } from "../sendScripts/constantMessage";

    /**
     * @dev Geting the Incrementor.
     * @param DebridgeAddress To map with the Nework URl.
     */ 
async function main() {
    const IncrementorFactory = await ethers.getContractFactory("Incrementor");
    const incrementor = await upgrades.deployProxy(IncrementorFactory, [DE_BRIDGE_GATE_ADDRESS]) as Incrementor;
    await incrementor.deployed();
    console.log(constantMessage.IncrementorProxy, incrementor.address);
    console.log(constantMessage.IncrementorScript, await getImplementationAddress(ethers.provider, incrementor.address));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });