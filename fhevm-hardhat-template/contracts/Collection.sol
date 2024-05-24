// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "fhevm/lib/TFHE.sol";
import "fhevm/abstracts/Reencrypt.sol";

interface RecordNFT {
    function ownerOf(uint256) external returns (address);
    function searchEncryptedMetadataEquals(
        uint64 tokenId,
        string memory name,
        euint64 value
    ) external view returns (bool);
    function getPrivateKeySimple(
        uint256 tokenId,
        bytes32 publicKey,
        bytes calldata signature
    ) external view returns (bytes memory);
    function isPrivateKeyCorrect(uint64 tokenId, bytes memory seed) external returns (bool);
    struct TokenData {
        string tokenURI;
        euint64 tokenPrivateKey;
        euint32[8] privateKeyComplex;
        mapping(string => string) metadata;
        mapping(string => euint64) privateMetadata;
    }
}

contract MyCollection is Reencrypt {
    struct User {
        address add;
        uint8 role;
    }

    struct NFT {
        uint8 role;
        uint64 tokenId;
        euint64 seed;
    }

    struct Collection {
        address owner;
        string name;
        uint8 maxRole;
        mapping(address => uint8) users;
        mapping(uint256 => NFT) nfts;
        uint256[] collectionNfts;
    }

    RecordNFT private recordNFTInstance;
    mapping(uint256 => Collection) private _collections;
    mapping(address => uint256[]) private userCollections;
    uint64 public collectionCounter;

    constructor(address _someContractAddress) {
        recordNFTInstance = RecordNFT(_someContractAddress);
        collectionCounter = 0;
    }

    function createCollection(string memory name, uint8 maxRole) public {
        Collection storage newCollection = _collections[collectionCounter];
        newCollection.owner = msg.sender;
        newCollection.name = name;
        newCollection.maxRole = maxRole;

        // Keep track of the ids for each user
        userCollections[msg.sender].push(collectionCounter);

        collectionCounter++;
    }

    // Add an NFT into a collection
    function addNFT(uint64 collectionId, uint64 tokenId, uint8 requiredRole, bytes32 publicKey,
        bytes calldata signature) public returns (bool) {
        require(msg.sender == recordNFTInstance.ownerOf(tokenId), "You can only transfer your records");
        require(collectionId < collectionCounter, "No such collection");
        require(msg.sender == _collections[collectionId].owner, "Not the owner");
        require(requiredRole < _collections[collectionId].maxRole, "Required role exceeds max role");
        uint256 nftId = _collections[collectionId].collectionNfts.length;
        NFT storage newNft = _collections[collectionId].nfts[nftId];
        _collections[collectionId].collectionNfts.push(nftId);
        newNft.tokenId = tokenId;
        newNft.role = requiredRole;
        // Might not work due to decrypt not being implemented on chain
        (bool success, bytes memory seed) = address(recordNFTInstance).delegatecall(
            abi.encodeWithSignature("getPrivateKeySimple(uint256,bytes32,bytes)", tokenId, publicKey, signature)
        );
        if (success) {
            newNft.seed = TFHE.asEuint64(seed);
        }
        return success;
    }

    function addNFTSeed(uint64 collectionId, uint64 tokenId, bytes memory seed) public {
        require(msg.sender == recordNFTInstance.ownerOf(tokenId), "You can only transfer your records");
        require(collectionId < collectionCounter, "No such collection");
        require(msg.sender == _collections[collectionId].owner, "Not the owner");
        require(recordNFTInstance.isPrivateKeyCorrect(tokenId, seed), "Seed mismatch");
        _collections[collectionId].nfts[tokenId].seed = TFHE.asEuint64(seed);
    }

    // Add user to a collection
    function addUser(uint64 collectionId, address userToAdd, uint8 role) private {
        require(msg.sender == _collections[collectionId].owner, "Only owner can assign role");
        require(role < _collections[collectionId].maxRole, "Role cannot be higher then max");
        _collections[collectionId].users[userToAdd] = role;
    }

    // Filter collection's NFTs based on metadata
    function filterNFT(
        uint64 collectionId,
        string memory name,
        bytes memory value
    ) external view returns (bool[] memory) {
        uint256 nftsCount = _collections[collectionId].collectionNfts.length;
        bool[] memory filteredNfts = new bool[](nftsCount);
        for (uint i = 0; i <= nftsCount; i++) {
            uint64 id = _collections[collectionId].nfts[i].tokenId;
            bool res = recordNFTInstance.searchEncryptedMetadataEquals(id, name, TFHE.asEuint64(value));
            filteredNfts[i] = res;
        }
        return filteredNfts;
    }

    function getNFTs(uint64 collectionId) external view returns (uint256[] memory) {
        return _collections[collectionId].collectionNfts;
    }

    // Check if user has the required role and return the private key if true
    function viewNFTSeed(
        uint64 collectionId,
        uint64 tokenId,
        bytes32 publicKey,
        bytes calldata signature
    ) public view virtual onlySignedPublicKey(publicKey, signature) returns (bytes memory) {
        NFT memory nft = _collections[collectionId].nfts[tokenId];
        require(_collections[collectionId].users[msg.sender] >= nft.role, "Has no access");

        return TFHE.reencrypt(nft.seed, publicKey, 0);
    }

}
