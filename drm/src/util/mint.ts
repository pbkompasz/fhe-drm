import { Contract, ethers } from "ethers";
import { Metadata } from "../components/create/Create";
import nftABI from "./RecordNFT.json";
import { createInstance, getPublicKeyCallParams, initFhevm } from "fhevmjs";

const contractAddress = "0x8Fdb26641d14a80FCCBE87BF455338Dd9C539a50";

const mintNFT = async (uri: string, seed: number, metadata: Metadata[]) => {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const signer = await provider.getSigner();
  await initFhevm();

  const network = await provider.getNetwork();
  const chainId = +network.chainId.toString();
  const ret = await provider.call(getPublicKeyCallParams());
  const decoded = ethers.AbiCoder.defaultAbiCoder().decode(["bytes"], ret);
  const chainPublicKey = decoded[0];

  const ctr = new ethers.Contract(contractAddress, nftABI.abi, signer);

  const instance = await createInstance({ chainId, publicKey: chainPublicKey });
  const metadataArray = [
    {
      name: "Name1",
      value: ethers.encodeBytes32String("Value1"),
      encrypted: false,
    },
    {
      name: "Name2",
      value: ethers.encodeBytes32String("Value2"),
      encrypted: true,
    },
  ];

  const encryptedKey = instance.encrypt64(seed);
  console.log(encryptedKey);
  const tx = await ctr.mintNFT(uri, metadataArray);
  await tx.wait();

  return 1;
};

const getNFTs = async () => {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const contract = new Contract(contractAddress, nftABI.abi, provider);
  const tokens = await contract.getAllTokens();
  return tokens;
};

const getNFT = async (id: number) => {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const contract = new Contract(contractAddress, nftABI.abi, provider);

  const network = await provider.getNetwork();
  const chainId = +network.chainId.toString();
  const ret = await provider.call(getPublicKeyCallParams());
  const decoded = ethers.AbiCoder.defaultAbiCoder().decode(["bytes"], ret);
  const chainPublicKey = decoded[0];

  const instance = await createInstance({ chainId, publicKey: chainPublicKey });
  const publicKey = instance.getPublicKey(contractAddress);

  const uri = await contract.getFunction("getTokenURI").call(0);
  const seed = await contract.getPrivateKeySimple(id, publicKey, publicKey?.signature);

  return {uri, seed};
};

const createCollection = async (
  collectionId: string,
  uri: string | number
) => {};

const updateCollection = async (
  collectionId: string,
  uri: string | number
) => {};

export { mintNFT, createCollection, updateCollection, getNFTs, getNFT };
