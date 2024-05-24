// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "fhevm/abstracts/Reencrypt.sol";
import "fhevm/lib/TFHE.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract RecordNFT is ERC721, Reencrypt {
    uint256 public tokenCounter;

    struct MetadataInput {
        string name;
        bytes value;
        bool encrypted;
    }

    struct TokenData {
        string tokenURI;
        euint64 tokenPrivateKey;
        mapping(string => string) metadata;
        mapping(string => euint64) privateMetadata;
        Metadata[] tokenMetadata;
    }

    struct Metadata {
        string name;
        bool encrypted;
    }

    mapping(uint256 => TokenData) private _tokens;
    mapping(address => uint256[]) public userTokens;

    constructor() ERC721("RecordNFT", "RNFT") {
        tokenCounter = 0;
    }

    function mintNFT(
        string memory tokenURI,
        bytes calldata encryptedKey,
        MetadataInput[] memory metadataArray //,
    ) external // bool useComplexKey
    {
        uint256 tokenId = tokenCounter;
        _safeMint(msg.sender, tokenId);

        TokenData storage token = _tokens[tokenCounter];
        token.tokenURI = tokenURI;
        token.tokenPrivateKey = TFHE.asEuint64(encryptedKey);

        // Keep track of the ids for each user
        userTokens[msg.sender].push(tokenId);

        for (uint i = 0; i < metadataArray.length; i++) {
            string memory metadataKey = metadataArray[i].name;
            bytes memory value = metadataArray[i].value;
            bool encrypted = metadataArray[i].encrypted;
            if (encrypted) {
                token.privateMetadata[metadataKey] = TFHE.asEuint64(value);
            } else {
                token.metadata[metadataKey] = string(value);
            }
            token.tokenMetadata.push(Metadata(metadataKey, encrypted));
        }

        tokenCounter++;
    }

    // just the seed as a number for now
    function getPrivateKeySimple(
        uint256 tokenId,
        bytes32 publicKey,
        bytes calldata signature
    ) public view virtual onlySignedPublicKey(publicKey, signature) returns (bytes memory) {
        require(msg.sender == ownerOf(tokenId), "Caller is not the owner of the token");
        return TFHE.reencrypt(_tokens[tokenId].tokenPrivateKey, publicKey, 0);
    }

    // originally a ArrayBuffer(32) as an array of 32-bit bytes
    function getPrivateKeyComplex(
        uint256 tokenId,
        bytes32 publicKey,
        bytes calldata signature
    ) public view virtual onlySignedPublicKey(publicKey, signature) returns (bytes[8] memory) {
        require(msg.sender == ownerOf(tokenId), "Caller is not the owner of the token");
        bytes[8] memory keys;
        for (uint i = 0; i < 8; i++) {
            keys[i] = TFHE.reencrypt(_tokens[tokenId].privateKeyComplex[i], publicKey, 0);
        }
        return keys;
    }

    // Assign the whole array
    function _setPrivateKeyComplex(uint256 tokenId, bytes[8] memory tokenPrivateKey) internal virtual {
        for (uint i = 0; i < 8; i++) {
            _tokens[tokenId].privateKeyComplex[i] = TFHE.asEuint32(tokenPrivateKey[i]);
        }
    }

    function isPrivateKeyCorrect(uint64 tokenId, bytes memory seed) external view returns (bool) {
        return TFHE.decrypt(TFHE.eq(TFHE.asEuint64(seed), _tokens[tokenId].tokenPrivateKey));
    }

    function getTokenURI(uint64 tokenId) public view virtual returns (string memory) {
        require(ownerOf(tokenId) == msg.sender, "No access");
        return _tokens[tokenId].tokenURI;
    }

    function searchEncryptedMetadataEquals(
        uint64 tokenId,
        string memory name,
        euint64 value
    ) external view returns (bool) {
        return TFHE.decrypt(TFHE.eq(value, _tokens[tokenId].privateMetadata[name]));
    }

    function getMetadatas(uint64 tokenId) public view returns (Metadata[] memory) {
        return _tokens[tokenId].tokenMetadata;
    }

    function getMetadata(uint64 tokenId, string memory name) public view returns (string memory) {
        return _tokens[tokenId].metadata[name];
    }

    function getMetadataEncrypted(
        uint64 tokenId,
        string memory name,
        bytes32 publicKey,
        bytes calldata signature
    ) public view virtual onlySignedPublicKey(publicKey, signature) returns (bytes memory) {
        require(msg.sender == ownerOf(tokenId), "Caller is not the owner of the token");
        return TFHE.reencrypt(_tokens[tokenId].privateMetadata[name], publicKey, 0);
    }
}
