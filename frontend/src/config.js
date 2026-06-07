export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Contract address

export const EXPECTED_CHAIN_ID = 31337n; // Hardhat local network chain ID

export const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

export const CONTRACT_ABI = [
  "function admin() view returns (address)",
  "function isNotary(address) view returns (bool)",
  "function totalDocuments() view returns (uint256)",
  "function verifyDocument(bytes32 documentHash) view returns (bool exists, bool revoked, uint256 timestamp, address notary, string ipfsCid, string registryNumber, string description, string revokeReason)",
  "function getRegistryHistory(string registryNumber) view returns (bytes32[])",
  "function getRegistryDocumentCount(string registryNumber) view returns (uint256)",
  "function registerDocument(bytes32 documentHash, string ipfsCid, string registryNumber, string description)",
  "function revokeDocument(bytes32 documentHash, string reason)",
  "function addNotary(address account)",
  "function removeNotary(address account)",
  "function transferAdmin(address newAdmin)",
  "function acceptAdmin()",
  "event DocumentRegistered(bytes32 indexed documentHash, string indexed registryNumber, address indexed notary, string ipfsCid, uint256 timestamp)",
  "event DocumentRevoked(bytes32 indexed documentHash, address indexed notary, string reason, uint256 timestamp)",
  "event NotaryAdded(address indexed notary, address indexed admin)",
  "event NotaryRemoved(address indexed notary, address indexed admin)",
];
