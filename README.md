<div align="center">

# CredentiaX

### Blockchain-Powered Decentralized Credential Verification

**Issue · Verify · Trust — without intermediaries**

[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?logo=solidity)](https://soliditylang.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-ESM-339933?logo=node.js)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql)](https://neon.tech)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.x-yellow?logo=ethereum)](https://hardhat.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)

</div>

---

## What is CredentiaX?

CredentiaX is a full-stack decentralized application that lets **universities issue tamper-proof digital credentials** and **anyone verify them instantly** — no emails, no phone calls, no middlemen.

Every certificate is:
- **Generated** as a PDF with an embedded QR code
- **Hashed** with SHA-256 for tamper detection
- **Anchored on-chain** via a MetaMask-signed transaction
- **Verifiable** in under a second by scanning the QR code with any camera

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React 19 + Vite)              │
│                                                                  │
│  Home  ·  Login  ·  Register  ·  Dashboard  ·  /verify/:certId  │
│                                                                  │
│  Role dashboards:                                                │
│    UNIVERSITY  →  issue, revoke, analytics, wallet sign          │
│    HOLDER      →  view & download own certificates               │
│    VERIFIER    →  QR scanner, manual lookup, blockchain proof    │
│    ADMIN       →  system-wide analytics & user management        │
└───────────────────────┬──────────────────────────────────────────┘
                        │  HTTPS / REST (Axios, cookie-based JWT)
┌───────────────────────▼──────────────────────────────────────────┐
│                    BACKEND (Express 5 + Prisma)                  │
│                                                                  │
│  Auth · Certificates · Verification · Blockchain · Analytics    │
│  PDF generation (PDFKit) · QR codes · SHA-256 hashing           │
│  Multer uploads · Zod validation · JWT middleware                │
└──────────┬────────────────────────────┬───────────────────────────┘
           │                            │
┌──────────▼──────┐          ┌──────────▼──────────────────────────┐
│   Neon Postgres │          │  EVM Blockchain (Hardhat / Amoy)    │
│   (Prisma ORM)  │          │                                     │
│                 │          │  CredentialRegistry.sol             │
│  users          │          │  ├─ issueCredential(bytes32×4)      │
│  certificates   │          │  ├─ revokeCredential(bytes32)       │
│  universities   │          │  └─ verifyCredential(bytes32)       │
│  verification_  │          │       → (bool valid, uint8 code)    │
│    logs         │          └─────────────────────────────────────┘
└─────────────────┘
```

---

## Feature Highlights

### For Universities
- Create student accounts (Holders) under their institution
- Issue PDF certificates with embedded QR codes — **one click**
- **Two-phase blockchain issuance**: backend prepares payload → MetaMask pops up → wallet signs → transaction confirmed → certificate goes ACTIVE
- Revoke compromised credentials on-chain
- Analytics dashboard: certificates issued, blockchain adoption rate, recent activity

### For Holders (Students)
- View all received certificates
- Download signed PDFs at any time

### For Verifiers (Employers, Institutions)
- **Live camera QR scanner** — point at any certificate, get instant result
- Manual certificate ID lookup
- Upload PDF for SHA-256 tamper detection
- Full **blockchain proof panel**: TX hash, issuer wallet, block number, chain

### For Everyone (Public)
- `/verify/:certId` — shareable URL embedded in every QR code
- No login required to verify any certificate

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS 4, React Router v7 |
| UI / Charts | Recharts, React Hot Toast |
| Web3 Client | Ethers.js v6, MetaMask (BrowserProvider) |
| QR Scanning | html5-qrcode 2.3 |
| Backend | Node.js (ESM), Express 5 |
| ORM / DB | Prisma 5, Neon PostgreSQL |
| Auth | JWT (httpOnly cookies), bcryptjs |
| Validation | Zod 4 |
| PDF & QR | PDFKit, qrcode |
| File Uploads | Multer (memory storage) |
| Smart Contracts | Solidity 0.8.24, Hardhat 2 |
| Blockchain | Hardhat Local (dev), Polygon Amoy testnet (staging) |

---

## Repository Layout

```
CredentiaX/
├── frontend/                  # React + Vite SPA
│   └── src/
│       ├── abis/              # Compiled contract ABI
│       ├── components/        # QRScanner, Navbar, WalletButton…
│       ├── context/           # AuthContext, WalletContext
│       ├── pages/
│       │   ├── dashboards/    # University / Holder / Verifier / Admin
│       │   ├── Home.jsx
│       │   ├── VerifyCertificate.jsx
│       │   └── …
│       ├── services/          # Axios client (api.js)
│       └── utils/             # contract.js, parseQRCode.js, …
│
├── backend/                   # Express API
│   └── src/
│       ├── config/            # env, prisma, blockchain clients
│       ├── controllers/       # thin HTTP layer
│       ├── middleware/        # auth, upload, validation, errors
│       ├── routes/            # 9 route modules
│       ├── services/          # business logic
│       └── utils/             # PDF, QR, hash, AppError…
│
├── smart-contracts/           # Hardhat project
│   ├── contracts/
│   │   └── CredentialRegistry.sol
│   ├── scripts/
│   │   └── deploy.js
│   └── test/
│       └── CredentialRegistry.test.js
│
└── README.md
```

---

## Database Schema

```
users
  id · name · email · password · role · walletAddress
  createdByUniversityId → users(id)   [UNIVERSITY → HOLDER link]

certificates
  id · certificateId (CERT-YYYY-NNNNNN) · title · course
  pdfHash · pdfPath · blockchainTxHash · issuerWalletAddress
  status (PENDING_BLOCKCHAIN | ACTIVE | FAILED)
  chainId · blockNumber · isRevoked
  holderId → users · issuedByUserId → users

universities
  universityName · universityCode · walletAddress · isVerified

verification_logs
  verifierIp · verificationStatus · certificateId → certificates
```

---

## Smart Contract

`CredentialRegistry.sol` uses **flat primitive mappings** — no structs, no dynamic-array returns — for maximum EVM compatibility.

```solidity
mapping(bytes32 => bytes32)  public credHash;
mapping(bytes32 => address)  public credIssuer;
mapping(bytes32 => uint256)  public credIssuedAt;
mapping(bytes32 => uint256)  public credExpiresAt;
mapping(bytes32 => bool)     public credRevoked;

function issueCredential(bytes32 credentialId, bytes32 credentialHash,
                         address subject, uint256 expiresAt) external;

function revokeCredential(bytes32 credentialId) external;

// Returns (valid, statusCode): 0=valid 1=notFound 2=revoked 3=expired
function verifyCredential(bytes32 credentialId)
    external view returns (bool valid, uint8 statusCode);
```

Certificate IDs are encoded to `bytes32` via `zeroPadBytes(hexlify(toUtf8Bytes(certId)), 32)` and PDF hashes are sent as `0x` + the raw SHA-256 hex string.

---

## Issuance Flow (Two-Phase Blockchain)

```
University clicks "Issue Certificate"
        │
        ▼
[Phase 1 — Backend]
POST /api/v1/certificates/prepare-issuance
  • validates holder belongs to this university
  • generates PDF + QR code
  • SHA-256 hashes the PDF
  • saves certificate as PENDING_BLOCKCHAIN
  • returns { blockchainPayload: { credentialIdBytes32, credentialHashBytes32,
              subjectAddress, expiresAt, contractAddress, chainId } }
        │
        ▼
[Frontend — MetaMask]
  • calls contract.issueCredential(...) with the payload
  • MetaMask popup → user confirms → tx broadcast
  • waits for tx.wait() (1 confirmation)
        │
        ▼
[Phase 2 — Backend]
POST /api/v1/certificates/finalize-issuance
  { certificateId, txHash, signerAddress, chainId, blockNumber }
  • marks certificate ACTIVE
  • stores txHash, blockNumber, chainId
        │
        ▼
Certificate is live — QR code works instantly
```

---

## API Reference

### Authentication
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/register` | Public | Register new account |
| POST | `/api/v1/auth/login` | Public | Login, set JWT cookie |
| POST | `/api/v1/auth/logout` | Public | Clear cookie |
| GET | `/api/v1/auth/me` | Any | Current user profile |
| PATCH | `/api/v1/auth/wallet` | Any | Link/unlink wallet address |

### Certificates
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/certificates/:certId` | Public | Lookup by cert ID |
| POST | `/api/v1/certificates/prepare-issuance` | UNIVERSITY | Phase 1 — generate PDF |
| POST | `/api/v1/certificates/finalize-issuance` | UNIVERSITY | Phase 2 — confirm tx |
| POST | `/api/v1/certificates/issue` | UNIVERSITY | Legacy single-step issue |
| GET | `/api/v1/certificates/my-certificates` | HOLDER | Own certificates |
| GET | `/api/v1/certificates/issued` | UNIVERSITY | Issued by this university |
| GET | `/api/v1/certificates/file/:certId` | Authenticated | Download PDF |
| PATCH | `/api/v1/certificates/:id/revoke` | UNIVERSITY / ADMIN | Revoke |

### Verification (Public)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/verify/upload` | Public | Upload PDF, get VALID / TAMPERED / REVOKED |

### Blockchain
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/blockchain/status` | Authenticated | Node + contract health |
| GET | `/api/v1/blockchain/verify/:credId` | Authenticated | On-chain lookup |

### Analytics
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/analytics/university` | UNIVERSITY | Own stats |
| GET | `/api/v1/analytics/admin` | ADMIN | System-wide stats |

### Health
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | API status |
| GET | `/api/v1/health/db` | Database connectivity |

---

## Getting Started

### Prerequisites

- Node.js 18+ (Node 25 is supported for the frontend; use Node 18/20 for Hardhat)
- MetaMask browser extension
- A Neon PostgreSQL database (free tier works)

### 1 — Clone and install

```bash
git clone https://github.com/your-username/CredentiaX.git
cd CredentiaX
npm run install:all
```

### 2 — Configure environment variables

**`backend/.env`**
```env
PORT=3001
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
APP_URL=http://127.0.0.1:5173

DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

JWT_SECRET="your-secret-at-least-32-chars"
JWT_EXPIRES_IN="7d"

# Local Hardhat (development)
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
PRIVATE_KEY=0x0000000000000000000000000000000000000000000000000000000000000001
CONTRACT_ADDRESS=<deployed address — see step 4>
CHAIN_ID=31337
```

**`frontend/.env`**
```env
VITE_API_BASE_URL=http://localhost:3001/api/v1
VITE_APP_NAME=CredentiaX
VITE_CONTRACT_ADDRESS=<deployed address — see step 4>
VITE_CHAIN_ID=31337
```

### 3 — Run the database migration

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

### 4 — Start the local blockchain and deploy the contract

```bash
# Terminal 1 — Hardhat node
cd smart-contracts
npx hardhat node --hostname 127.0.0.1

# Terminal 2 — Deploy contract (copy the printed address into both .env files)
npx hardhat run scripts/deploy.js --network localhost
```

### 5 — Start backend and frontend

```bash
# Terminal 3
npm run backend        # Express on http://localhost:3001

# Terminal 4
npm run frontend       # Vite on http://127.0.0.1:5173
```

### 6 — Configure MetaMask

1. Add network: **Hardhat Local** — RPC `http://127.0.0.1:8545`, Chain ID `31337`
2. Import a test account using one of the private keys printed by `hardhat node`
3. Connect the wallet from the University dashboard

---

## Verification Flow — End to End

```
1. University issues certificate  →  PDF downloaded with QR code
2. Student shares PDF / prints it
3. Verifier opens /verify page     OR   Verifier dashboard → "Open QR Scanner"
4. Camera scans QR  ──────────────────────────────────┐
                                                       │
   OR manually types CERT-YYYY-NNNNNN                  │
                                                       ▼
5. Frontend calls GET /api/v1/certificates/:certId
6. Result card shows:
     ✅ VALID      — green, blockchain proof panel visible
     🚫 REVOKED    — amber, revocation details shown
     ❌ NOT_FOUND  — grey, no record in registry
7. Blockchain proof panel:
     TX Hash · Issuer Wallet · Block # · Chain ID · "Stored On-Chain" badge
```

For tamper detection, the verifier uploads the PDF on the "Upload PDF" tab.  
The backend recomputes the SHA-256 hash and compares it character-by-character with the stored hash, highlighting any discrepancies inline.

---

## Roles

| Role | Can do |
|------|--------|
| **HOLDER** | View & download own certificates |
| **UNIVERSITY** | Create holders, issue & revoke certificates, view analytics |
| **VERIFIER** | Scan QR codes, look up certificates, verify PDFs |
| **ADMIN** | All of the above + system-wide analytics, user management |

---

## Deploying to Polygon Amoy Testnet

1. Fund a wallet with MATIC from the [Amoy faucet](https://faucet.polygon.technology)
2. Export the private key and set it in `smart-contracts/.env`
3. Deploy:
   ```bash
   cd smart-contracts
   npx hardhat run scripts/deploy.js --network amoy
   ```
4. Update `backend/.env`:
   ```env
   CONTRACT_ADDRESS=<amoy address>
   CHAIN_ID=80002
   ```
5. Update `frontend/.env`:
   ```env
   VITE_CONTRACT_ADDRESS=<amoy address>
   VITE_CHAIN_ID=80002
   ```
6. MetaMask will switch to **Polygon Amoy** automatically when connecting

---

## Security Notes

- JWTs are stored in `httpOnly`, `sameSite: lax` cookies — never accessible from JavaScript
- PDF hashes are computed server-side at issuance time — the client cannot tamper with the reference hash
- QR payloads are sanitised: only `http:` / `https:` URIs are accepted, `javascript:` and `data:` are always rejected, payload length is capped at 512 characters
- The smart contract stores hashes immutably — on-chain records cannot be altered after issuance
- Camera stream is fully stopped and released on modal close — no ghost streams

---

## Scripts Reference

```bash
# Root
npm run frontend          # Start frontend dev server
npm run backend           # Start backend dev server
npm run contracts:compile # Compile Solidity
npm run contracts:test    # Run Hardhat tests
npm run contracts:node    # Start local Hardhat node
npm run install:all       # Install all workspace deps

# Backend (cd backend)
npm run dev               # nodemon
npm run db:migrate        # Run Prisma migrations
npm run db:studio         # Prisma Studio GUI

# Smart Contracts (cd smart-contracts)
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.js --network localhost
npx hardhat run scripts/deploy.js --network amoy
```

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">
  Built with React · Express · Solidity · Hardhat · Prisma · Neon PostgreSQL
</div>
