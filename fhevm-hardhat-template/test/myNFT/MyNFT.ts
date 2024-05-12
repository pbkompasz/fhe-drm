import { expect } from "chai";
import * as crypto from "crypto";
import * as thers from "ethers";
import { createInstance } from "fhevmjs";
import { ethers, network } from "hardhat";

import { createInstances } from "../instance";
import { getSigners, initSigners } from "../signers";
import { deployMyNFTFixture } from "./MyNFT.fixture";

const { randomBytes, getRandomValues } = require("crypto");

describe("MyNFT", function () {
  before(async function () {
    await initSigners();
    this.signers = await getSigners();
  });

  beforeEach(async function () {
    const contract = await deployMyNFTFixture();
    this.contractAddress = await contract.getAddress();
    this.erc721 = contract;
    this.instances = await createInstances(this.contractAddress, ethers, this.signers);
  });

  it("should read token name and symbol", async function () {
    const name = await this.erc721.name();
    expect(name, "MyNFT");
    const symbol = await this.erc721.symbol();
    expect(symbol, "MNFT");
  });

  // it("mint nft", async function () {
  //   const privateKey = 3;

  //   const token = this.instances.alice.getPublicKey(this.contractAddress)!;
  //   const numel = this.instances.alice.encrypt16(privateKey);
  //   const tx = await this.erc721.mintNFT("https://google.com", numel, []);
  //   await tx.wait();
  //   const encryptedPrivateKey = await this.erc721.getPk(0, token.publicKey, token.signature);
  //   const pk = this.instances.alice.decrypt(this.contractAddress, encryptedPrivateKey);
  //   console.log(pk);

  //   expect(pk).to.equal(privateKey);

  //   const tokens = await this.erc721.getAllTokens();

  //   expect(tokens.length).to.equal(1);
  // });

  // it("should only be able to read NFTs' private key", async function () {
  //   const encryptionKey = await crypto.subtle.generateKey(
  //     {
  //       name: "AES-GCM",
  //       length: 256,
  //     },
  //     true,
  //     ["encrypt", "decrypt"],
  //   );
  //   const raw = await crypto.subtle.exportKey("raw", encryptionKey);

  //   const privateKey = thers.encodeBase64(new Uint8Array(raw));

  //   const token = this.instances.alice.getPublicKey(this.contractAddress)!;
  //   const tx = await this.erc721.mintNFT("https://google.com", privateKey, []);
  //   await tx.wait();

  //   await this.erc721.connect(this.instances.bob);

  //   const bobToken = this.instances.bob.getPublicKey(this.contractAddress)!;
  //   // Bob cannot read Alice's NFT's private key
  //   await expect(await this.erc721.getPk(0, token.publicKey, token.signature)).to.ok;

  //   // const tx2 = await this.erc721.mintNFT("https://google.com", numel, []);
  //   // await tx2.wait();

  //   const encryptedPrivateKey = await this.erc721.getPk(0);
  //   const pk = thers.decodeBase64(encryptedPrivateKey);
  //   console.log(pk);

  //   expect(pk).to.equal(privateKey);

  //   // console.log(await this.erc721.ownerOf(0));
  //   // console.log(await this.erc721.ownerOf(1));
  // });

  it("should create and retrieve simple private key", async function () {
    // Define your numeric seed (example seed)
    const seed = 123456789;

    // Convert seed to 256-bit key and 128-bit IV
    const keyBuffer = new Uint8Array(32); // 256 bits (32 bytes)
    const ivBuffer = new Uint8Array(16); // 128 bits (16 bytes)
    const seedView = new DataView(new ArrayBuffer(4)); // 4 bytes for the seed
    seedView.setUint32(0, seed);

    // Copy seed bytes to key and IV buffers
    for (let i = 0; i < 4; i++) {
      keyBuffer[i] = seedView.getUint8(i);
      ivBuffer[i] = seedView.getUint8(i);
    }

    // Perform encryption
    const key = await crypto.subtle.importKey("raw", keyBuffer, { name: "AES-CBC" }, false, ["encrypt"]);
    console.log(key);
  });

  it("should create and retrieve complex private key", async function () {
    // Define your numeric seed (example seed)
    const encryptionKey = await crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"],
    );
    const raw = await crypto.subtle.exportKey("raw", encryptionKey);
    console.log(raw);

    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const network = await provider.getNetwork();
    const chainId = +network.chainId.toString();
    const decoded = ethers.AbiCoder.defaultAbiCoder().decode(["bytes"], ret);
    const chainPublicKey = decoded[0];

    const instance = await createInstance({ chainId, publicKey: chainPublicKey });

    const view = new DataView(raw);

    // Define an array to store the integers
    const integers = [];

    // Read 8 signed 32-bit integers from the buffer
    for (let i = 0; i < 8; i++) {
      // Calculate the byte offset for the integer
      const byteOffset = i * 4;

      // Read the integer from the buffer using DataView's getInt32 method
      const int = view.getInt32(byteOffset, true); // true for little endian, false for big endian

      const encrypted = instance.encrypt32(int);

      // Push the integer to the array
      integers.push(int);
    }

    console.log(integers);
  });
});
