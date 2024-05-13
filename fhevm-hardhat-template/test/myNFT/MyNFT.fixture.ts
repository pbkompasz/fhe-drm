import { ethers } from "hardhat";

import { getSigners } from "../signers";
import { BaseContract } from "ethers";

export async function deployMyNFTFixture(): Promise<BaseContract> {
  const signers = await getSigners();

  const contractFactory = await ethers.getContractFactory("contracts/RecordNFT.sol:RecordNFT");
  const contract = await contractFactory.connect(signers.alice).deploy();
  await contract.waitForDeployment();

  return contract;
}
