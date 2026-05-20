# CredentiaX Certificate Generation - Quick Start Guide

## 🚀 Start the Application

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```
**Expected Output:**
```
✔  Neon PostgreSQL connected
✔  CredentiaX API running on http://localhost:3001
   Environment : development
   API base    : http://localhost:3001/api/v1
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```
**Expected Output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## 🧪 Test Certificate Flow (5 Minutes)

### Step 1: Register University (1 min)
1. Open http://localhost:5173
2. Click "Register"
3. Fill form:
   - Name: "MIT University"
   - Email: "admin@mit.edu"
   - Password: "password123"
   - Role: **UNIVERSITY**
4. Click "Register"
5. Login with same credentials

### Step 2: Create Holder (1 min)
1. Click "Create Holder" button
2. Fill form:
   - Name: "John Doe"
   - Email: "john@example.com"
   - Wallet: (leave empty or add 0x...)
3. Click "Create Holder"
4. **IMPORTANT:** Copy the temporary password shown
5. Click "Done"

### Step 3: Issue Certificate (2 min)
1. Click "Issue Certificate" button
2. Fill form:
   - Holder: Select "John Doe"
   - Title: "Bachelor of Computer Science"
   - Course: "Computer Science & Engineering"
   - Date: Select today
   - Description: "Completed with distinction" (optional)
3. Click "Issue Certificate"
4. Wait for success message (~2-3 seconds)
5. Click "Download PDF"
6. Open PDF and verify:
   - ✅ University name
   - ✅ Holder name
   - ✅ Certificate details
   - ✅ QR code
   - ✅ Certificate ID
7. Click "Done"

### Step 4: View as Holder (1 min)
1. Logout from university account
2. Login as holder:
   - Email: "john@example.com"
   - Password: (paste temporary password)
3. View "My Credentials" section
4. Click "Download" button
5. Verify PDF downloads

---

## ✅ Success Indicators

### Backend Running:
- ✅ Console shows "PostgreSQL connected"
- ✅ Console shows "API running on http://localhost:3001"
- ✅ No error messages

### Frontend Running:
- ✅ Browser opens to http://localhost:5173
- ✅ Login page loads
- ✅ No console errors

### Certificate Issued:
- ✅ Success toast notification
- ✅ Certificate appears in "Issued Certificates" table
- ✅ PDF downloads successfully
- ✅ PDF contains all information
- ✅ QR code is visible in PDF

### Holder View:
- ✅ Certificate appears in "My Credentials"
- ✅ Certificate details are correct
- ✅ Download button works
- ✅ Status shows "Active"

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if .env exists
ls backend/.env

# If missing, copy from example
cp backend/.env.example backend/.env

# Edit .env and add your DATABASE_URL and JWT_SECRET
nano backend/.env
```

### Frontend won't start
```bash
# Reinstall dependencies
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Certificate issuance fails
1. Check backend console for errors
2. Verify holder exists in database
3. Check uploads/certificates/ directory exists
4. Verify JWT_SECRET is set in .env

### PDF download fails
1. Check if file exists: `ls backend/uploads/certificates/`
2. Verify you're logged in
3. Check browser console for errors
4. Verify API URL is correct

### "No holders yet" message
1. Make sure you're logged in as UNIVERSITY
2. Create a holder first before issuing certificate
3. Refresh the page

---

## 📝 Environment Setup

### Backend .env (Minimum Required)
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
JWT_SECRET="your-super-secret-key-change-this"
APP_URL="http://localhost:5173"
```

### Optional Blockchain Config
```env
POLYGON_AMOY_RPC_URL="https://rpc-amoy.polygon.technology"
PRIVATE_KEY="your-private-key-here"
CONTRACT_ADDRESS="your-contract-address-here"
```

---

## 🔗 Important URLs

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001/api/v1
- **Health Check:** http://localhost:3001/api/v1/health
- **Prisma Studio:** Run `npm run db:studio` in backend folder

---

## 📋 Quick Commands

### Backend
```bash
npm run dev          # Start development server
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio
npm run db:generate  # Regenerate Prisma client
```

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

---

## 🎯 Key Features to Test

1. ✅ **Certificate Issuance** - University issues certificate
2. ✅ **PDF Generation** - Professional PDF with QR code
3. ✅ **PDF Download** - Secure authenticated download
4. ✅ **Holder View** - Holder sees their certificates
5. ✅ **Certificate Listing** - Both parties see certificates
6. ✅ **Status Badges** - Active/Revoked indicators
7. ✅ **Blockchain Link** - View on Polygonscan (if configured)

---

## 📞 Need Help?

### Check Documentation
- `CERTIFICATE_IMPLEMENTATION_COMPLETE.md` - Full implementation guide
- `API_CERTIFICATE_ENDPOINTS.md` - API reference
- `IMPLEMENTATION_SUMMARY.md` - Technical details

### Common Issues
1. **Port already in use:** Change PORT in .env
2. **Database connection failed:** Check DATABASE_URL
3. **JWT errors:** Verify JWT_SECRET is set
4. **File not found:** Check uploads/ directory exists

---

## ✨ What's Working

- ✅ User registration and authentication
- ✅ Holder creation by universities
- ✅ Certificate issuance with PDF generation
- ✅ QR code embedding in PDFs
- ✅ SHA-256 hash computation
- ✅ Blockchain anchoring (optional)
- ✅ Certificate listing for universities
- ✅ Certificate viewing for holders
- ✅ Secure PDF downloads
- ✅ Status tracking (Active/Revoked)
- ✅ Professional UI with loading states

---

## 🎉 You're Ready!

Follow the 5-minute test flow above to verify everything works. The entire certificate generation feature is complete and ready for use.

**Happy Testing! 🚀**
