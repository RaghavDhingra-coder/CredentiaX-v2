# CredentiaX

Blockchain-based credential issuance and verification for universities, students, verifiers, and administrators.

CredentiaX lets a university create holder accounts, issue certificate PDFs with embedded QR codes, anchor credential metadata on an EVM smart contract, and verify uploaded certificates by comparing extracted document fields against the registry record.

## What It Does

- Universities create holder/student accounts and issue certificates.
- Certificates are generated as PDFs, stored under the backend uploads folder, and assigned IDs like `CERT-2026-000001`.
- QR codes embed a verification URL containing the certificate ID.
- On-chain issuance is a two-step flow: the backend prepares the certificate and hashes, then MetaMask signs the smart-contract transaction, then the backend finalizes the record.
- Verifiers upload a certificate PDF or image. The backend extracts certificate fields, scans/decodes QR data where possible, looks up the registry record, and flags mismatches as tampering.
- Holders can view and download their own certificates.
- Admins can inspect users and system-wide analytics.

## Architecture

```text
CredentiaX-v2
├── frontend/          React 19 + Vite 8 SPA
├── backend/           Express 5 API + Prisma + PostgreSQL
├── smart-contracts/   Hardhat + Solidity CredentialRegistry
├── README.md          Project guide
└── *.md, test-*.js    Extra implementation notes and test helpers
```

Runtime flow:

```text
React app
  ├─ Auth, role dashboards, wallet connection, certificate upload verification
  └─ Axios calls through Vite proxy: /api/v1 -> http://localhost:3001

Express API
  ├─ JWT auth with httpOnly cookies
  ├─ Prisma models for users, certificates, universities, verification logs
  ├─ PDF generation, QR generation, SHA-256 hashing
  ├─ Gemini extraction with PDF/OCR fallback for verification
  └─ ethers.js contract reads and optional server-side contract writes

CredentialRegistry.sol
  ├─ Stores PDF hash plus normalized metadata field hashes
  ├─ Tracks issuer, issue time, expiry, revoked state
  └─ Returns validity status codes for on-chain verification
```

## Tech Stack

| Area | Stack |
| --- | --- |
| Frontend | React 19, Vite 8, React Router 7, Tailwind CSS 4 |
| UI/data | Recharts, React Hot Toast |
| Wallet/web3 | MetaMask, ethers.js v6 |
| Backend | Node.js ESM, Express 5 |
| Database | PostgreSQL/Neon, Prisma 5 |
| Auth | JWT cookies, bcryptjs |
| Validation/uploads | Zod, Multer |
| Certificates | PDFKit, qrcode, SHA-256 hashing |
| Verification extraction | Gemini API, pdf-parse, Tesseract.js, Jimp, jsQR |
| Smart contracts | Solidity 0.8.24, Hardhat 2 |
| Networks | Local Hardhat, Polygon Amoy, Sepolia config available |

## Folder Structure

```text
frontend/
├── src/
│   ├── abis/                  Contract ABI used by the browser
│   ├── components/            Navbar, ProtectedRoute, QRScanner, WalletButton
│   ├── components/analytics/  Dashboard analytics UI
│   ├── context/               AuthContext and WalletContext
│   ├── layouts/               MainLayout
│   ├── pages/                 Home, Login, Register, Dashboard, VerifyCertificate
│   ├── pages/dashboards/      Holder, University, Verifier, Admin dashboards
│   ├── routes/                App route definitions
│   ├── services/              Axios API client
│   └── utils/                 Contract and QR parsing helpers
├── vite.config.js             Dev server and /api proxy
└── package.json

backend/
├── prisma/
│   ├── schema.prisma          User, University, Certificate, VerificationLog models
│   └── migrations/            Database migrations
├── src/
│   ├── config/                env, Prisma, blockchain contract setup
│   ├── controllers/           HTTP request handlers
│   ├── middleware/            Auth, validation, upload, errors, logging
│   ├── routes/                API route modules mounted under /api/v1
│   ├── schemas/               Zod auth/request schemas
│   ├── services/              Auth, users, holders, certificates, verification, analytics
│   └── utils/                 PDF, QR, hashing, metadata, responses
├── uploads/                   Generated certificate files
└── package.json

smart-contracts/
├── contracts/CredentialRegistry.sol
├── scripts/deploy.js
├── test/CredentialRegistry.test.js
├── hardhat.config.js
└── package.json
```

## Roles

| Role | Main capabilities |
| --- | --- |
| `HOLDER` | View and download certificates issued to them |
| `UNIVERSITY` | Create holders, issue certificates, finalize blockchain transactions, revoke issued certificates, view university analytics |
| `VERIFIER` | Access the protected `/verify` page and upload certificates for integrity checks |
| `ADMIN` | View all users, access admin analytics, and use admin-protected capabilities |

## Frontend Routes

| Route | Access | Description |
| --- | --- | --- |
| `/` | Public | Landing/home page |
| `/login` | Guest | Login form |
| `/register` | Guest | Registration form |
| `/dashboard` | Authenticated | Role-specific dashboard |
| `/verify` | `VERIFIER`, `ADMIN` | Certificate upload verification page |
| `/unauthorized` | Public | Access denied page |

Note: generated QR codes currently point to `/verify/<certificateId>`, while the React router currently exposes `/verify` as a protected upload page. Direct public certificate lookup is available through the backend API route `GET /api/v1/certificates/:certificateId`.

## Backend API

All routes are mounted under `/api/v1`.

### Auth

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Public | Register and set auth cookie |
| `POST` | `/auth/login` | Public | Login and set auth cookie |
| `POST` | `/auth/logout` | Public | Clear auth cookie |
| `GET` | `/auth/me` | Authenticated | Current user |
| `PATCH` | `/auth/wallet` | Authenticated | Link or unlink wallet address |

### Certificates

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/certificates/issue` | `UNIVERSITY` | Legacy single-step issuance |
| `POST` | `/certificates/prepare-issuance` | `UNIVERSITY` | Generate PDF, hash fields, save as `PENDING_BLOCKCHAIN`, return MetaMask payload |
| `POST` | `/certificates/finalize-issuance` | `UNIVERSITY` | Save transaction data and mark certificate `ACTIVE` |
| `GET` | `/certificates/my-certificates` | `HOLDER` | Holder's certificates |
| `GET` | `/certificates/issued` | `UNIVERSITY` | Certificates issued by the signed-in university |
| `GET` | `/certificates/file/:certificateId` | Authenticated owner/issuer/admin | Download certificate PDF |
| `PATCH` | `/certificates/:id/revoke` | `UNIVERSITY`, `ADMIN` | Revoke a database certificate record |
| `GET` | `/certificates/:certificateId` | Public | Lookup certificate by public certificate ID |

### Verification

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/verify/upload` | Public API | Upload PDF/image as `pdf`; returns `VALID`, `TAMPERED`, `REVOKED`, or `NOT_FOUND` |

### Blockchain

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/blockchain/status` | Authenticated | Provider/contract health |
| `POST` | `/blockchain/test-issue` | `UNIVERSITY` | Test server-side on-chain issue |
| `POST` | `/blockchain/revoke` | `UNIVERSITY` | Revoke on-chain credential |
| `GET` | `/blockchain/verify/:credentialId` | Authenticated | Read on-chain credential state |

### Users, Holders, Universities, Analytics, Health

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/users` | `ADMIN` | List users |
| `GET` | `/users/:id` | `ADMIN` | User detail |
| `POST` | `/holders` | `UNIVERSITY` | Create holder under the university |
| `GET` | `/holders` | `UNIVERSITY` | List university holders |
| `GET` | `/holders/:id` | `UNIVERSITY` | Holder detail |
| `GET` | `/universities` | Public | List universities |
| `GET` | `/universities/:id` | Public | University detail |
| `POST` | `/universities` | `ADMIN`, `UNIVERSITY` | Create university profile |
| `GET` | `/analytics/university` | `UNIVERSITY` | University-scoped analytics |
| `GET` | `/analytics/admin` | `ADMIN` | System analytics |
| `GET` | `/health` | Public | API health |
| `GET` | `/health/db` | Public | Database health |

## Database Model Summary

```text
User
  id, name, email, password, role, walletAddress
  createdByUniversityId links holders to the university user that created them

University
  universityName, universityCode, walletAddress, isVerified

Certificate
  certificateId, title, course, description, usn, cgpa, issueDate
  pdfHash, pdfPath, blockchainTxHash, issuerWalletAddress
  status: PENDING_BLOCKCHAIN | ACTIVE | FAILED
  chainId, blockNumber, isRevoked
  holderId -> User
  issuedByUserId -> User

VerificationLog
  verifierIp, verificationStatus
  certificateId -> Certificate database id
```

## Smart Contract

`smart-contracts/contracts/CredentialRegistry.sol` stores primitive mappings for compatibility with Hardhat and simple contract reads.

It stores:

- `credHash`: PDF SHA-256 reference hash as `bytes32`
- `certNameHash`, `certUsnHash`, `certCourseHash`, `certGradeHash`, `certDateHash`: normalized metadata hashes
- `credIssuer`, `credIssuedAt`, `credExpiresAt`, `credRevoked`

Main functions:

```solidity
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
) external;

function revokeCredential(bytes32 credentialId) external;

function verifyCredential(bytes32 credentialId)
    external view returns (bool valid, uint8 statusCode);
```

Status codes from `verifyCredential`:

- `0`: valid
- `1`: not found
- `2`: revoked
- `3`: expired

## Issuance Logic

```text
1. University creates or selects a HOLDER account.
2. Frontend calls POST /api/v1/certificates/prepare-issuance.
3. Backend validates the holder belongs to the university.
4. Backend generates a certificate ID, QR code, PDF, PDF hash, and metadata hashes.
5. Backend stores the certificate as PENDING_BLOCKCHAIN.
6. Frontend sends the returned payload to CredentialRegistry.issueCredential through MetaMask.
7. After transaction confirmation, frontend calls POST /api/v1/certificates/finalize-issuance.
8. Backend stores tx hash, signer address, chain ID, block number, and marks the certificate ACTIVE.
```

There is also a legacy `/certificates/issue` path that can issue a PDF first and optionally attempt server-side blockchain issuance when blockchain config and holder wallet data are present.

## Verification Logic

The upload verification endpoint accepts PDFs and images.

```text
1. Extract fields with Gemini.
2. If Gemini fails, fall back to pdf-parse for PDFs or Tesseract OCR for images.
3. Decode QR URL when possible and parse the certificate ID.
4. Fall back to visible certificate ID, manual hint, or filename.
5. Look up the certificate in PostgreSQL.
6. Compare registry values against extracted document values:
   certificate ID, title, course, holder, USN, CGPA, issued by.
7. Return VALID, TAMPERED, REVOKED, or NOT_FOUND and write a verification log when applicable.
```

## Environment Variables

Create `backend/.env`:

```env
PORT=3001
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
APP_URL=http://127.0.0.1:5173

DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"

JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d

# Required for Gemini-first upload verification.
# Without it, verification falls back to local PDF/OCR extraction.
GEMINI_API_KEY=your-gemini-api-key

# Blockchain configuration.
# For local Hardhat, use http://127.0.0.1:8545 as the RPC URL.
POLYGON_AMOY_RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=optional-server-wallet-private-key
CONTRACT_ADDRESS=deployed-contract-address
CHAIN_ID=31337
```

Create `frontend/.env`:

```env
VITE_CONTRACT_ADDRESS=deployed-contract-address
VITE_CHAIN_ID=31337
```

The frontend API client uses `baseURL: /api/v1`; Vite proxies `/api` to `http://localhost:3001` during development.

## Local Setup

Install dependencies:

```bash
npm run install:all
```

Prepare the database:

```bash
cd backend
npm run db:generate
npm run db:migrate
```

Start a local blockchain:

```bash
cd smart-contracts
npm run node
```

Deploy the contract in another terminal:

```bash
cd smart-contracts
npm run deploy:local
```

Copy the printed contract address into `backend/.env` and `frontend/.env`.

Start the backend from the project root:

```bash
cd ..
npm run backend
```

Start the frontend from the project root in another terminal:

```bash
npm run frontend
```

Open the app at:

```text
http://127.0.0.1:5173
```

## MetaMask Local Network

For local development, add this network to MetaMask:

| Field | Value |
| --- | --- |
| Network name | Hardhat Local |
| RPC URL | `http://127.0.0.1:8545` |
| Chain ID | `31337` |
| Currency | `ETH` |

Import one of the private keys printed by `hardhat node`, then connect the wallet from the app.

## Polygon Amoy Deployment

The Hardhat project includes an `amoy` network. Set `POLYGON_AMOY_RPC_URL` and `PRIVATE_KEY`, then deploy:

```bash
cd smart-contracts
npx hardhat run scripts/deploy.js --network amoy
```

For Amoy, use:

```env
CHAIN_ID=80002
VITE_CHAIN_ID=80002
```

and set both backend and frontend contract address variables to the deployed Amoy contract address.

## Scripts

Root scripts:

```bash
npm run install:all          # Install frontend, backend, and smart-contract deps
npm run frontend             # Start Vite dev server
npm run backend              # Start Express API with nodemon
npm run contracts:compile    # Compile contracts
npm run contracts:test       # Run Hardhat tests
npm run contracts:node       # Start local Hardhat node
```

Backend scripts:

```bash
npm run dev
npm run start
npm run db:migrate
npm run db:generate
npm run db:studio
npm run db:push
npm run db:reset
```

Frontend scripts:

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

Smart-contract scripts:

```bash
npm run compile
npm run test
npm run node
npm run deploy:local
npm run deploy:sepolia
npm run clean
```

## Notes and Current Caveats

- The repository has several extra notes and debugging files such as `QUICK_START.md`, `API_CERTIFICATE_ENDPOINTS.md`, `DEBUGGING_GUIDE.md`, and implementation summaries.
- `backend/uploads/` contains generated files and should be treated as runtime storage.
- `smart-contracts/artifacts/` and `cache/` are generated by Hardhat.
- The root `package.json` is marked `private` and currently uses the `ISC` license field.
- The QR generation code embeds `/verify/<certificateId>`, but the current React app defines `/verify` as a protected upload verifier page.
