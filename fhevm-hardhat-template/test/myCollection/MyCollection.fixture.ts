import { ethers } from "hardhat";

import { getSigners } from "../signers";

export async function deployMyNFTFixture(): Promise {
  const signers = await getSigners();

  const contractFactory = await ethers.getContractFactory("contracts/MyCollection.sol");
  const contract = await contractFactory.connect(signers.alice).deploy();
  await contract.waitForDeployment();

  return contract;
}
