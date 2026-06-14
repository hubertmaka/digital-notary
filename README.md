# Digital Notary (Proof of Existence)

Digital Notary is a blockchain application for land registry audit.
It stores only document hashes and metadata on-chain, while document content can be stored in IPFS.

## Project Structure

```text
blockchain-proj/
├── contracts/DigitalNotary.sol
├── scripts/deploy.js
├── hardhat.config.js
├── .env.example
├── package.json
├── frontend/
│   ├── package.json
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── config.js
│       ├── hooks/useWallet.js
│       ├── lib/utils.js
│       └── components/
└── docs/
```

## Setup From Scratch (Local)

### 1. Install dependencies

```bash
npm install
npm --prefix frontend install
```

### 2. Start local blockchain

```bash
npm run node
```

Keep this terminal running.

### 3. Deploy contract to local network

Open a second terminal:

```bash
npm run deploy:local
```

Copy the deployed contract address.

### 4. Configure frontend

Edit [frontend/src/config.js](frontend/src/config.js):

- Set `CONTRACT_ADDRESS` to the local deployment address
- Set `EXPECTED_CHAIN_ID = 31337n`

### 5. Configure MetaMask

- Add network manually:
  - RPC URL: `http://127.0.0.1:8545`
  - Chain ID: `31337`
  - Symbol: `ETH`
- Import `Account #0` private key from the `npm run node` terminal output

### 6. Start frontend

```bash
npm run frontend
```

Open `http://localhost:5173`.

## Local Usage Flow

1. Connect MetaMask
2. Register a document (select file, registry number; with JWT the app auto-uploads JSON to Pinata during registration)
3. Verify document by file/hash
4. Audit registry history by registry number
5. Manage notary role and revoke entries (admin/notary roles)

## Pinata / IPFS Setup (JSON payload)

The app uploads JSON payloads to IPFS via Pinata in this format:

```json
{
  "registryNumber": "WA4M/00123456/7",
  "documentBase64": "<base64-of-document>"
}
```

### 1. Create Pinata API key (JWT)

1. Log in to Pinata and create a JWT key.
2. Allow pinning endpoints (`pinJSONToIPFS` at minimum).

### 2. Configure frontend JWT (recommended for local dev)

Create `frontend/.env.local`:

```bash
VITE_PINATA_JWT=your_pinata_jwt_here
```

Restart Vite after editing env values.

### 3. Register flow in UI

1. Select a file (hash is computed locally).
2. Enter registry number.
3. Optional: click `Upload JSON now (optional)` to pre-upload and preview CID.
4. Click `Register Document On-chain`.
5. If JWT is present and CID is empty, the app automatically uploads JSON first and then sends the transaction.

The JSON uploaded to Pinata is created by the app automatically:

```json
{
  "registryNumber": "<value from form>",
  "documentBase64": "<base64 of selected file>"
}
```

### 4. API endpoints used

- `POST https://api.pinata.cloud/pinning/pinJSONToIPFS` for JSON payload upload
- `Authorization: Bearer <JWT>` header

Note: keeping JWT in a browser app is acceptable for local testing, but for production use a backend proxy that stores secrets server-side.

## MetaMask Configuration (step by step)

### A) Local Hardhat network (development)

1. Start node:

```bash
npm run node
```

2. In MetaMask click `Add network` and set:

- Network Name: `Hardhat Local`
- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`
- Currency Symbol: `ETH`

3. Import account from Hardhat output:

- In terminal output from `npm run node`, copy private key for `Account #0`.
- In MetaMask use `Import account` and paste that private key.

4. Deploy contract locally:

```bash
npm run deploy:local
```

5. Copy contract address and set it in `frontend/src/config.js` (`CONTRACT_ADDRESS`).

6. Ensure `EXPECTED_CHAIN_ID = 31337n` in `frontend/src/config.js`.

7. Run frontend and connect wallet:

```bash
npm run frontend
```

When connecting, the app will request account access and (if needed) chain switch.

### B) Sepolia (testnet)

1. In MetaMask choose/add `Sepolia` network.
2. Fund account with Sepolia ETH from faucet.
3. Deploy contract with `npm run deploy:sepolia`.
4. Set in `frontend/src/config.js`:

- `CONTRACT_ADDRESS = <deployed sepolia address>`
- `EXPECTED_CHAIN_ID = 11155111n`

5. Connect MetaMask in the app; if chain is wrong, switch to Sepolia.

### Common issues

- Wrong network error: switch MetaMask chain to value from `EXPECTED_CHAIN_ID`.
- Connected but no permissions: reconnect and approve `eth_requestAccounts` popup.
- Transactions fail for role actions: account is not admin/notary in contract.

## Sepolia Deployment

### 1. Configure env file

```bash
cp .env.example .env
```

Fill:

- `SEPOLIA_RPC_URL`
- `PRIVATE_KEY`
- `ETHERSCAN_API_KEY` (optional)
- `ADMIN_ADDRESS` (optional)

### 2. Deploy

```bash
npm run deploy:sepolia
```

### 3. Update frontend

Set `CONTRACT_ADDRESS` and `EXPECTED_CHAIN_ID = 11155111n` in [frontend/src/config.js](frontend/src/config.js).

### 4. Optional verification

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <ADMIN_ADDRESS>
```
