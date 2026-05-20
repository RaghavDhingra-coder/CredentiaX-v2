// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title CredentialRegistry
 * @notice On-chain registry for issuing and verifying decentralized credentials.
 */
contract CredentialRegistry {
    struct Credential {
        bytes32 credentialHash;
        address issuer;
        address subject;
        uint256 issuedAt;
        uint256 expiresAt;
        bool revoked;
    }

    // credentialId => Credential
    mapping(bytes32 => Credential) private credentials;
    // subject address => list of credentialIds
    mapping(address => bytes32[]) private subjectCredentials;

    // Authorized issuers
    mapping(address => bool) public authorizedIssuers;
    address public owner;

    event CredentialIssued(
        bytes32 indexed credentialId,
        address indexed issuer,
        address indexed subject,
        uint256 issuedAt,
        uint256 expiresAt
    );
    event CredentialRevoked(bytes32 indexed credentialId, address indexed revokedBy);
    event IssuerAuthorized(address indexed issuer);
    event IssuerRevoked(address indexed issuer);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyAuthorizedIssuer() {
        require(authorizedIssuers[msg.sender], "Not an authorized issuer");
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedIssuers[msg.sender] = true;
    }

    function authorizeIssuer(address issuer) external onlyOwner {
        authorizedIssuers[issuer] = true;
        emit IssuerAuthorized(issuer);
    }

    function revokeIssuer(address issuer) external onlyOwner {
        authorizedIssuers[issuer] = false;
        emit IssuerRevoked(issuer);
    }

    function issueCredential(
        bytes32 credentialId,
        bytes32 credentialHash,
        address subject,
        uint256 expiresAt
    ) external onlyAuthorizedIssuer {
        require(credentials[credentialId].issuedAt == 0, "Credential already exists");
        require(subject != address(0), "Invalid subject address");
        require(expiresAt > block.timestamp, "Expiry must be in the future");

        credentials[credentialId] = Credential({
            credentialHash: credentialHash,
            issuer: msg.sender,
            subject: subject,
            issuedAt: block.timestamp,
            expiresAt: expiresAt,
            revoked: false
        });

        subjectCredentials[subject].push(credentialId);

        emit CredentialIssued(credentialId, msg.sender, subject, block.timestamp, expiresAt);
    }

    function revokeCredential(bytes32 credentialId) external {
        Credential storage cred = credentials[credentialId];
        require(cred.issuedAt != 0, "Credential does not exist");
        require(
            msg.sender == cred.issuer || msg.sender == owner,
            "Not authorized to revoke"
        );
        require(!cred.revoked, "Already revoked");

        cred.revoked = true;
        emit CredentialRevoked(credentialId, msg.sender);
    }

    function verifyCredential(bytes32 credentialId) external view returns (bool valid, string memory reason) {
        Credential storage cred = credentials[credentialId];

        if (cred.issuedAt == 0) return (false, "Credential does not exist");
        if (cred.revoked) return (false, "Credential has been revoked");
        if (block.timestamp > cred.expiresAt) return (false, "Credential has expired");

        return (true, "Valid");
    }

    function getCredential(bytes32 credentialId) external view returns (Credential memory) {
        require(credentials[credentialId].issuedAt != 0, "Credential does not exist");
        return credentials[credentialId];
    }

    function getSubjectCredentials(address subject) external view returns (bytes32[] memory) {
        return subjectCredentials[subject];
    }
}
