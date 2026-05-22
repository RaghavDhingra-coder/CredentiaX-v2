# CredentiaX — Frontend

React 19 + Vite 8 single-page application for the CredentiaX credential verification platform.

## Stack

- **React 19** with `react-router-dom` v7
- **Tailwind CSS 4** (Vite plugin)
- **Ethers.js v6** — MetaMask wallet integration
- **html5-qrcode** — live camera QR scanning
- **Recharts** — analytics charts
- **React Hot Toast** — notifications
- **Axios** — API client with cookie credentials

## Scripts

```bash
npm run dev      # Start dev server (http://127.0.0.1:5173)
npm run build    # Production build → dist/
npm run preview  # Preview production build
npm run lint     # ESLint
```

## Environment Variables

Copy `.env.example` to `.env`:

```env
VITE_API_BASE_URL=http://localhost:3001/api/v1
VITE_APP_NAME=CredentiaX
VITE_CONTRACT_ADDRESS=0x...   # deployed CredentialRegistry address
VITE_CHAIN_ID=31337           # 31337 = Hardhat local, 80002 = Polygon Amoy
```

## Key Directories

```
src/
├── abis/          CredentialRegistry.json (auto-updated after deploy)
├── components/    QRScanner, Navbar, WalletButton, AnalyticsSection
├── context/       AuthContext, WalletContext (MetaMask)
├── pages/
│   ├── dashboards/   University, Holder, Verifier, Admin
│   ├── Home.jsx
│   └── VerifyCertificate.jsx   (public, linked from QR codes)
├── services/      api.js (Axios instance)
└── utils/         contract.js, parseQRCode.js
```

See the [root README](../README.md) for full project documentation.
