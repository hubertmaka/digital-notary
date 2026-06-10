# Digital Notary Project Plan

## Goal

Build a Proof of Existence system for land registry audit where:

- SHA-256 document hashes and metadata are stored on Ethereum
- Document content can be stored in IPFS
- Public verification is available for third parties

## Scope

- Registry-level audit trail
- Role-based access control (admin and notary)
- On-chain registration and revocation of entries
- Public read-only verification and registry history

## Access Model

- `ADMIN`: grants/removes notary permissions and transfers admin role
- `NOTARY`: registers and revokes document entries
- Public users: verify documents and read registry history

## Architecture

- Frontend: React + Vite + Tailwind + ethers.js
- Wallet: MetaMask
- Smart Contract: Solidity
- Network: Local Hardhat or Sepolia
- Storage: IPFS (Pinata integration)

## Main Components

- `contracts/DigitalNotary.sol`
- `scripts/deploy.js`
- `frontend/src/App.jsx`
- `frontend/src/hooks/useWallet.js`
- `frontend/src/components/*`

## Milestones

1. Contract implementation
2. Deployment flow (local and Sepolia)
3. Frontend integration with MetaMask
4. IPFS upload and CID handling
5. Public verification and registry audit flow

## Operational Notes

- Local chain requires `EXPECTED_CHAIN_ID = 31337n`
- Sepolia requires `EXPECTED_CHAIN_ID = 11155111n`
- Contract address must be set in `frontend/src/config.js` after each deployment
