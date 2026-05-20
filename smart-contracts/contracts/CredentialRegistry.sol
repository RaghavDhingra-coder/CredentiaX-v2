// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CredentialRegistry {
    // Flat primitive mappings — no structs, no dynamic arrays
    mapping(bytes32 => bytes32)  public credHash;
    mapping(bytes32 => address)  public credIssuer;
    mapping(bytes32 => uint256)  public credIssuedAt;
    mapping(bytes32 => uint256)  public credExpiresAt;
    mapping(bytes32 => bool)     public credRevoked;

    address public owner;

    event CredentialIssued(bytes32 indexed credentialId, address indexed issuer, uint256 issuedAt);
    event CredentialRevoked(bytes32 indexed credentialId, address indexed revokedBy);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function issueCredential(
        bytes32 credentialId,
        bytes32 credentialHash,
        address subject,
        uint256 expiresAt
    ) external {
        require(credIssuedAt[credentialId] == 0, "Already exists");
        require(expiresAt > block.timestamp, "Expiry in past");

        credHash[credentialId]     = credentialHash;
        credIssuer[credentialId]   = msg.sender;
        credIssuedAt[credentialId] = block.timestamp;
        credExpiresAt[credentialId] = expiresAt;
        credRevoked[credentialId]  = false;

        emit CredentialIssued(credentialId, msg.sender, block.timestamp);
    }

    function revokeCredential(bytes32 credentialId) external {
        require(credIssuedAt[credentialId] != 0, "Does not exist");
        require(
            msg.sender == credIssuer[credentialId] || msg.sender == owner,
            "Not authorized"
        );
        require(!credRevoked[credentialId], "Already revoked");

        credRevoked[credentialId] = true;
        emit CredentialRevoked(credentialId, msg.sender);
    }

    // Returns (valid, statusCode): statusCode 0=valid 1=notFound 2=revoked 3=expired
    function verifyCredential(bytes32 credentialId) external view returns (bool valid, uint8 statusCode) {
        if (credIssuedAt[credentialId] == 0)          return (false, 1);
        if (credRevoked[credentialId])                return (false, 2);
        if (block.timestamp > credExpiresAt[credentialId]) return (false, 3);
        return (true, 0);
    }
}
