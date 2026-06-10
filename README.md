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
2. Register a document (select file, optional IPFS CID, registry number)
3. Verify document by file/hash
4. Audit registry history by registry number
5. Manage notary role and revoke entries (admin/notary roles)

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
