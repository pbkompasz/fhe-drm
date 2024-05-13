// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

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
        uint256 id;
        string tokenURI;
        euint64 tokenPrivateKey;
        euint32[8] privateKeyComplex;
        // mapping(bytes32 => string) metadata;
        mapping(string => string) metadata;
        // mapping(bytes32 => euint64) privateMetadata;
        mapping(string => euint64) privateMetadata;
    }

    TokenData[] private _tokens;

    constructor() ERC721("RecordNFT", "RNFT") {
        tokenCounter = 0;
    }

    function mintNFT(
        string memory _tokenURI,
        bytes calldata encryptedKey,
        MetadataInput[] memory metadataArray
    ) external {
        // TODO Encrypt using public key of sender
        uint256 tokenId = tokenCounter;
        _safeMint(msg.sender, tokenId);

        TokenData storage newToken = _tokens.push();
        newToken.tokenURI = _tokenURI;
        newToken.tokenPrivateKey = TFHE.asEuint64(encryptedKey);
        newToken.id = tokenId;

        for (uint i = 0; i < metadataArray.length; i++) {
            // bytes32 metadataKey = keccak256(abi.encodePacked(metadataArray[i].name));
            string memory metadataKey = metadataArray[i].name;
            bytes memory value = metadataArray[i].value;
            if (metadataArray[i].encrypted) {
                newToken.privateMetadata[metadataKey] = TFHE.asEuint64(value);
            } else {
                newToken.metadata[metadataKey] = string(value);
            }
        }
        tokenCounter++;
    }

    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal virtual {
        _tokens[tokenId].tokenURI = _tokenURI;
    }

    // Assign the whole array
    function _setPrivateKeyComplex(uint256 tokenId, bytes[8] memory _tokenPrivateKey) internal virtual {
        for (uint i = 0; i < 8; i++) {
            _tokens[tokenId].privateKeyComplex[i] = TFHE.asEuint32(_tokenPrivateKey[i]);
        }
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

    function getAllTokens() external view returns (uint256[] memory) {
        uint256[] memory ids = new uint256[](tokenCounter);
        for (uint256 i = 0; i < ids.length; i++) {
            ids[i] = _tokens[i].id;
        }
        return ids;
    }

    function getTokenURI(uint64 tokenId) public view virtual returns (string memory) {
        for (uint256 i = 0; i < _tokens.length; i++) {
            if (_tokens[i].id == tokenId) {
                return _tokens[i].tokenURI;
            }
        }
    }

    function searchEncryptedMetadataEquals(
        uint64 tokenId,
        string memory name,
        euint64 value
    ) external view returns (bool) {
        return TFHE.decrypt(TFHE.eq(value, _tokens[tokenId].privateMetadata[name]));
    }
}
