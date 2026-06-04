// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract DigitalNotary {
    struct Document {
        bytes32 documentHash;
        string ipfsCid;
        string registryNumber;
        string description;
        address notary;
        uint256 timestamp;
        bool exists;
        bool revoked;
        string revokeReason;
    }

    address public admin;
    address public pendingAdmin;

    mapping(address => bool) public isNotary;
    mapping(bytes32 => Document) private documents;
    mapping(string => bytes32[]) private registryHistory;

    uint256 public totalDocuments;

    event DocumentRegistered(
        bytes32 indexed documentHash,
        string indexed registryNumber,
        address indexed notary,
        string ipfsCid,
        uint256 timestamp
    );

    event DocumentRevoked(
        bytes32 indexed documentHash,
        address indexed notary,
        string reason,
        uint256 timestamp
    );

    event NotaryAdded(address indexed notary, address indexed admin);
    event NotaryRemoved(address indexed notary, address indexed admin);
    event AdminTransferStarted(address indexed currentAdmin, address indexed pendingAdmin);
    event AdminTransferred(address indexed previousAdmin, address indexed newAdmin);

    error NotAdmin();
    error NotNotary();
    error NotPendingAdmin();
    error ZeroAddress();
    error ZeroHash();
    error DocumentAlreadyRegistered(bytes32 documentHash);
    error DocumentNotFound(bytes32 documentHash);
    error DocumentAlreadyRevoked(bytes32 documentHash);
    error AlreadyNotary(address account);
    error NotANotary(address account);
    error EmptyRegistryNumber();

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    modifier onlyNotary() {
        if (!isNotary[msg.sender]) revert NotNotary();
        _;
    }

    constructor(address initialAdmin) {
        if (initialAdmin == address(0)) revert ZeroAddress();
        admin = initialAdmin;
        emit AdminTransferred(address(0), initialAdmin);
    }

    function addNotary(address account) external onlyAdmin {
        if (account == address(0)) revert ZeroAddress();
        if (isNotary[account]) revert AlreadyNotary(account);
        isNotary[account] = true;
        emit NotaryAdded(account, msg.sender);
    }

    function removeNotary(address account) external onlyAdmin {
        if (!isNotary[account]) revert NotANotary(account);
        isNotary[account] = false;
        emit NotaryRemoved(account, msg.sender);
    }

    function transferAdmin(address newAdmin) external onlyAdmin {
        if (newAdmin == address(0)) revert ZeroAddress();
        pendingAdmin = newAdmin;
        emit AdminTransferStarted(admin, newAdmin);
    }

    function acceptAdmin() external {
        if (msg.sender != pendingAdmin) revert NotPendingAdmin();
        address previous = admin;
        admin = pendingAdmin;
        pendingAdmin = address(0);
        emit AdminTransferred(previous, admin);
    }

    function registerDocument(
        bytes32 documentHash,
        string calldata ipfsCid,
        string calldata registryNumber,
        string calldata description
    ) external onlyNotary {
        if (documentHash == bytes32(0)) revert ZeroHash();
        if (bytes(registryNumber).length == 0) revert EmptyRegistryNumber();
        if (documents[documentHash].exists) revert DocumentAlreadyRegistered(documentHash);

        documents[documentHash] = Document({
            documentHash: documentHash,
            ipfsCid: ipfsCid,
            registryNumber: registryNumber,
            description: description,
            notary: msg.sender,
            timestamp: block.timestamp,
            exists: true,
            revoked: false,
            revokeReason: ""
        });

        registryHistory[registryNumber].push(documentHash);
        totalDocuments++;

        emit DocumentRegistered(documentHash, registryNumber, msg.sender, ipfsCid, block.timestamp);
    }

    function revokeDocument(bytes32 documentHash, string calldata reason) external onlyNotary {
        Document storage doc = documents[documentHash];
        if (!doc.exists) revert DocumentNotFound(documentHash);
        if (doc.revoked) revert DocumentAlreadyRevoked(documentHash);

        doc.revoked = true;
        doc.revokeReason = reason;

        emit DocumentRevoked(documentHash, msg.sender, reason, block.timestamp);
    }

    function verifyDocument(bytes32 documentHash)
        external
        view
        returns (
            bool exists,
            bool revoked,
            uint256 timestamp,
            address notary,
            string memory ipfsCid,
            string memory registryNumber,
            string memory description,
            string memory revokeReason
        )
    {
        Document storage doc = documents[documentHash];
        return (
            doc.exists,
            doc.revoked,
            doc.timestamp,
            doc.notary,
            doc.ipfsCid,
            doc.registryNumber,
            doc.description,
            doc.revokeReason
        );
    }

    function getRegistryHistory(string calldata registryNumber)
        external
        view
        returns (bytes32[] memory)
    {
        return registryHistory[registryNumber];
    }

    function getRegistryDocumentCount(string calldata registryNumber)
        external
        view
        returns (uint256)
    {
        return registryHistory[registryNumber].length;
    }
}
