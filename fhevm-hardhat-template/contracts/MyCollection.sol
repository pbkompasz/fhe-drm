// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "fhevm/lib/TFHE.sol";
import "fhevm/abstracts/Reencrypt.sol";

interface RecordNFT {
    function ownerOf(uint256) external returns (address);
    function searchEncryptedMetadataEquals(
        uint64 tokenId,
        string memory name,
        euint64 value
    ) external view returns (bool);
    struct TokenData {
        uint256 id;
        string tokenURI;
        euint64 tokenPrivateKey;
        euint32[8] privateKeyComplex;
        // mapping(bytes32 => string) metadata;
        mapping(string => string) metadata;
        // mapping(bytes32 => euint64) privateMetadata;
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
        NFT[] nfts;
    }

    RecordNFT private recordNFTInstance;
    Collection[] private _collections;
    uint8 private _collectionCount;

    constructor(address _someContractAddress) {
        recordNFTInstance = RecordNFT(_someContractAddress);
        _collectionCount = 0;
    }

    function createCollection(string memory name, uint8 maxRole) public {
        Collection storage newCollection = _collections.push();
        newCollection.owner = msg.sender;
        newCollection.name = name;
        newCollection.maxRole = maxRole;

        _collectionCount++;
    }

    // Add an NFT into a collecction
    function addNFT(uint64 collectionId, uint64 tokenId, uint8 requiredRole) public {
        require(msg.sender == recordNFTInstance.ownerOf(tokenId), "You can only transfer your records");
        require(collectionId < _collectionCount, "No such collection");
        require(msg.sender == _collections[collectionId].owner, "Not the owner");
        NFT storage newNft = _collections[collectionId].nfts.push();
        newNft.tokenId = tokenId;
        newNft.role = requiredRole;
    }

    function addNFTSeed(uint64 collectionId, uint64 tokenId, bytes memory seed) public {
        require(msg.sender == recordNFTInstance.ownerOf(tokenId), "You can only transfer your records");
        require(collectionId < _collectionCount, "No such collection");
        require(msg.sender == _collections[collectionId].owner, "Not the owner");
        for (uint i = 0; i <= _collections[collectionId].nfts.length; i++) {
            uint64 id = _collections[collectionId].nfts[i].tokenId;
            if (id == tokenId) {
                _collections[collectionId].nfts[i].seed = TFHE.asEuint64(seed);
                return;
            }
        }
    }

    function addUser(uint64 collectionId, address userToAdd, uint8 role) private {
        require(msg.sender == _collections[collectionId].owner, "Only owner can assign role");
        require(role < _collections[collectionId].maxRole, "Role cannot be higher then max");
        _collections[collectionId].users[userToAdd] = role;
    }

    // Has access to NFTs with ranks lower or equal
    function assignRole(uint64 collectionId, uint64 tokenId, uint8 newRole) private {
        require(msg.sender == _collections[collectionId].owner, "Only owner can assign role");
        require(newRole < _collections[collectionId].maxRole, "Role cannot be higher then max");
        NFT storage newNft = _collections[collectionId].nfts.push();
        newNft.tokenId = tokenId;
        newNft.role = newRole;
    }

    function filterNFT(
        uint64 collectionId,
        string memory name,
        bytes memory value
    ) external view returns (uint64[] memory) {
        uint64[] memory ids = new uint64[](_collections[collectionId].nfts.length);
        for (uint i = 0; i <= _collections[collectionId].nfts.length; i++) {
            uint64 id = _collections[collectionId].nfts[i].tokenId;
            bool res = recordNFTInstance.searchEncryptedMetadataEquals(id, name, TFHE.asEuint64(value));
            if (res) {
                ids[i] = id;
            }
        }
        return ids;
    }

    // Check if user has the required role and return the private key if true
    function viewNFT(
        uint64 collectionId,
        uint64 tokenId,
        bytes32 publicKey,
        bytes calldata signature
    ) public view virtual onlySignedPublicKey(publicKey, signature) returns (bytes memory) {
        NFT memory nft;
        for (uint i = 0; i <= _collections[collectionId].nfts.length; i++) {
            if (tokenId == _collections[collectionId].nfts[i].tokenId) {
                nft = _collections[collectionId].nfts[i];
            }
        }
        require(_collections[collectionId].users[msg.sender] >= nft.role, "Has no access");

        return TFHE.reencrypt(nft.seed, publicKey, 0);
    }

    function createDemoCollection() internal {}
}
