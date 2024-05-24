import { Contract, ethers } from "ethers";
import { Metadata } from "../components/create/Create";
import nftABI from "./RecordNFT.json";
import { createInstance, getPublicKeyCallParams, initFhevm } from "fhevmjs";

const contractAddress = "0x3B19180930B3229b7652849A2798a305d0a07911";
const provider = new ethers.BrowserProvider(window.ethereum);
const contract = new Contract(contractAddress, nftABI.output.abi, provider);

const mintNFT = async (uri: string, seed: number, metadata: Metadata[]) => {
  const signer = await provider.getSigner();
  await initFhevm();

  const network = await provider.getNetwork();
  const chainId = +network.chainId.toString();
  const ret = await provider.call(getPublicKeyCallParams());
  const decoded = ethers.AbiCoder.defaultAbiCoder().decode(["bytes"], ret);
  const chainPublicKey = decoded[0];

  const instance = await createInstance({ chainId, publicKey: chainPublicKey });
  const metadataArray = [
    {
      name: "Name1",
      value: ethers.encodeBytes32String("Value1"),
      encrypted: false,
    },
  ];

  const ctx = new Contract(contractAddress, nftABI.output.abi, signer);
  const encryptedKey = instance.encrypt64(seed);
  const tx = await ctx.mintNFT(
    uri,
    encryptedKey,
    // metadata.map((m) => {
    //   m.value = ethers.encodeBytes32String(String(m.value));
    //   return m;
    // })
    metadataArray
  );
  await tx.wait();

  const address = await signer.getAddress();
  const tokens = await contract.balanceOf(address);

  return Number(tokens) - 1;
};

const getNFTs = async () => {
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const tokens = await contract.balanceOf(address);
  return tokens;
};

const getNFT = async (id: number) => {
  try {
    await initFhevm();
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const ctx = new Contract(contractAddress, nftABI.output.abi, signer);
    const uri = await ctx.getTokenURI(id);
    console.log(uri);
    const network = await provider.getNetwork();
    const chainId = +network.chainId.toString();
    const ret = await provider.call(getPublicKeyCallParams());
    const decoded = ethers.AbiCoder.defaultAbiCoder().decode(["bytes"], ret);
    const chainPublicKey = decoded[0];

    const instance = await createInstance({
      chainId,
      publicKey: chainPublicKey,
    });
    const { publicKey, eip712 } = instance.generatePublicKey({
      verifyingContract: contractAddress,
    });

    const params = [await signer.getAddress(), JSON.stringify(eip712)];
    const signature: string = await window.ethereum.request({
      method: "eth_signTypedData_v4",
      params,
    });
    instance.setSignature(contractAddress, signature);

    const originalSeed = await ctx.getPrivateKeySimple(
      id,
      publicKey,
      signature
    );
    console.log(originalSeed);
    const seed = instance.decrypt(contractAddress, originalSeed);
    console.log(seed);
    console.log(uri);

    return { uri, seed, originalSeed };
  } catch (error) {
    console.log(error);
  }
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
