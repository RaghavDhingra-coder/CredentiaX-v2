// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title CredentialRegistry
 * @notice Stores credential metadata as keccak256 field hashes.
 *         Verification compares on-chain hashes against extracted document fields —
 *         format changes (PDF→image, screenshot) do NOT invalidate a credential,
 *         but editing name/USN/course/grade/date WILL cause a hash mismatch.
 *
 * Design: flat primitive mappings (no structs, no dynamic-array returns) for
 *         compatibility with Hardhat's JS-based EVM simulator.
 */
contract CredentialRegistry {

    // ── Core identity ────────────────────────────────────────────────────────
    mapping(bytes32 => address)  public credIssuer;
    mapping(bytes32 => uint256)  public credIssuedAt;
    mapping(bytes32 => uint256)  public credExpiresAt;
    mapping(bytes32 => bool)     public credRevoked;

    // ── PDF hash (kept as reference, not primary verification) ───────────────
    mapping(bytes32 => bytes32)  public credHash;

    // ── Metadata field hashes (keccak256 of normalize(field)) ───────────────
    // Same normalization MUST be applied on both issuance and verification.
    mapping(bytes32 => bytes32)  public certNameHash;    // student name
    mapping(bytes32 => bytes32)  public certUsnHash;     // USN / roll number
    mapping(bytes32 => bytes32)  public certCourseHash;  // course / degree
    mapping(bytes32 => bytes32)  public certGradeHash;   // CGPA / marks
    mapping(bytes32 => bytes32)  public certDateHash;    // issue date

    address public owner;

    // ── Events ───────────────────────────────────────────────────────────────
    event CredentialIssued(
        bytes32 indexed credentialId,
        address indexed issuer,
        uint256 issuedAt
    );
    event CredentialRevoked(
        bytes32 indexed credentialId,
        address indexed revokedBy
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Issue a credential and store all metadata hashes on-chain.
     * @param credentialId   bytes32 encoding of the human-readable cert ID
     * @param credentialHash SHA-256 of the issued PDF (reference, not primary)
     * @param nameHash       keccak256(normalize(studentName))
     * @param usnHash        keccak256(normalize(usn))
     * @param courseHash     keccak256(normalize(course))
     * @param gradeHash      keccak256(normalize(cgpa))
     * @param dateHash       keccak256(normalize(issueDate))
     * @param subject        Holder wallet address (address(0) if unlinked)
     * @param expiresAt      Unix timestamp — must be in the future
     */
    function issueCredential(
        bytes32 credentialId,
        bytes32 credentialHash,
        bytes32 nameHash,
        bytes32 usnHash,
        bytes32 courseHash,
        bytes32 gradeHash,
        bytes32 dateHash,
        address subject,
        uint256 expiresAt
    ) external {
        require(credIssuedAt[credentialId] == 0, "Already exists");
        require(expiresAt > block.timestamp, "Expiry in past");

        credHash[credentialId]       = credentialHash;
        certNameHash[credentialId]   = nameHash;
        certUsnHash[credentialId]    = usnHash;
        certCourseHash[credentialId] = courseHash;
        certGradeHash[credentialId]  = gradeHash;
        certDateHash[credentialId]   = dateHash;
        credIssuer[credentialId]     = msg.sender;
        credIssuedAt[credentialId]   = block.timestamp;
        credExpiresAt[credentialId]  = expiresAt;
        credRevoked[credentialId]    = false;

        emit CredentialIssued(credentialId, msg.sender, block.timestamp);
    }

    /**
     * @notice Revoke a previously issued credential.
     */
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

    /**
     * @notice Quick on-chain validity check.
     * @return valid       true if credential exists, not revoked, not expired
     * @return statusCode  0=valid 1=notFound 2=revoked 3=expired
     */
    function verifyCredential(bytes32 credentialId)
        external view
        returns (bool valid, uint8 statusCode)
    {
        if (credIssuedAt[credentialId] == 0)                 return (false, 1);
        if (credRevoked[credentialId])                       return (false, 2);
        if (block.timestamp > credExpiresAt[credentialId])   return (false, 3);
        return (true, 0);
    }
}
