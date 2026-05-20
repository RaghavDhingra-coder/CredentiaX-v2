# Certificate API Endpoints Reference

## Base URL
```
http://localhost:3001/api/v1/certificates
```

---

## Endpoints

### 1. Issue Certificate (UNIVERSITY only)
**POST** `/certificates/issue`

**Authentication:** Required (UNIVERSITY role)

**Request Body:**
```json
{
  "holderId": "clxxx...",
  "title": "Bachelor of Computer Science",
  "course": "Computer Science & Engineering",
  "description": "Completed with distinction",
  "issueDate": "2026-05-20"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "certificate": {
      "id": "clxxx...",
      "certificateId": "CERT-2026-000001",
      "title": "Bachelor of Computer Science",
      "course": "Computer Science & Engineering",
      "description": "Completed with distinction",
      "issueDate": "2026-05-20T00:00:00.000Z",
      "pdfHash": "a1b2c3d4...",
      "pdfPath": "uploads/certificates/CERT-2026-000001.pdf",
      "blockchainTxHash": "0x123...",
      "issuerWalletAddress": "0xabc...",
      "isRevoked": false,
      "createdAt": "2026-05-20T10:30:00.000Z",
      "holder": {
        "id": "clxxx...",
        "name": "John Doe",
        "email": "john@example.com",
        "walletAddress": "0xdef..."
      },
      "issuedByUser": {
        "id": "clxxx...",
        "name": "MIT University",
        "email": "admin@mit.edu",
        "walletAddress": "0xabc..."
      }
    }
  }
}
```

---

### 2. Get My Certificates (HOLDER only)
**GET** `/certificates/my-certificates`

**Authentication:** Required (HOLDER role)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "certificates": [
      {
        "id": "clxxx...",
        "certificateId": "CERT-2026-000001",
        "title": "Bachelor of Computer Science",
        "course": "Computer Science & Engineering",
        "description": "Completed with distinction",
        "issueDate": "2026-05-20T00:00:00.000Z",
        "pdfHash": "a1b2c3d4...",
        "pdfPath": "uploads/certificates/CERT-2026-000001.pdf",
        "blockchainTxHash": "0x123...",
        "issuerWalletAddress": "0xabc...",
        "isRevoked": false,
        "createdAt": "2026-05-20T10:30:00.000Z",
        "issuedByUser": {
          "id": "clxxx...",
          "name": "MIT University",
          "email": "admin@mit.edu",
          "walletAddress": "0xabc..."
        }
      }
    ]
  }
}
```

---

### 3. Get Issued Certificates (UNIVERSITY only)
**GET** `/certificates/issued`

**Authentication:** Required (UNIVERSITY role)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "certificates": [
      {
        "id": "clxxx...",
        "certificateId": "CERT-2026-000001",
        "title": "Bachelor of Computer Science",
        "course": "Computer Science & Engineering",
        "description": "Completed with distinction",
        "issueDate": "2026-05-20T00:00:00.000Z",
        "pdfHash": "a1b2c3d4...",
        "pdfPath": "uploads/certificates/CERT-2026-000001.pdf",
        "blockchainTxHash": "0x123...",
        "issuerWalletAddress": "0xabc...",
        "isRevoked": false,
        "createdAt": "2026-05-20T10:30:00.000Z",
        "holder": {
          "id": "clxxx...",
          "name": "John Doe",
          "email": "john@example.com",
          "walletAddress": "0xdef..."
        }
      }
    ]
  }
}
```

---

### 4. Get Certificate by ID (Public)
**GET** `/certificates/:certificateId`

**Authentication:** Not required

**Example:** `GET /certificates/CERT-2026-000001`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "certificate": {
      "id": "clxxx...",
      "certificateId": "CERT-2026-000001",
      "title": "Bachelor of Computer Science",
      "course": "Computer Science & Engineering",
      "description": "Completed with distinction",
      "issueDate": "2026-05-20T00:00:00.000Z",
      "pdfHash": "a1b2c3d4...",
      "pdfPath": "uploads/certificates/CERT-2026-000001.pdf",
      "blockchainTxHash": "0x123...",
      "issuerWalletAddress": "0xabc...",
      "isRevoked": false,
      "createdAt": "2026-05-20T10:30:00.000Z",
      "holder": {
        "id": "clxxx...",
        "name": "John Doe",
        "email": "john@example.com",
        "walletAddress": "0xdef..."
      },
      "issuedByUser": {
        "id": "clxxx...",
        "name": "MIT University",
        "email": "admin@mit.edu",
        "walletAddress": "0xabc..."
      }
    }
  }
}
```

---

### 5. Download Certificate PDF (Authenticated)
**GET** `/certificates/file/:certificateId`

**Authentication:** Required (HOLDER, UNIVERSITY, or ADMIN)

**Access Control:**
- Holder can download their own certificates
- University can download certificates they issued
- Admin can download any certificate

**Example:** `GET /certificates/file/CERT-2026-000001`

**Response (200):**
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="CERT-2026-000001.pdf"`
- Binary PDF data

**Error (403):**
```json
{
  "success": false,
  "message": "You do not have permission to download this certificate"
}
```

---

### 6. Revoke Certificate (UNIVERSITY only)
**PATCH** `/certificates/:id/revoke`

**Authentication:** Required (UNIVERSITY or ADMIN role)

**Example:** `PATCH /certificates/clxxx.../revoke`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "certificate": {
      "id": "clxxx...",
      "certificateId": "CERT-2026-000001",
      "isRevoked": true,
      ...
    }
  }
}
```

**Error (403):**
```json
{
  "success": false,
  "message": "Only the issuing university can revoke this certificate"
}
```

**Error (409):**
```json
{
  "success": false,
  "message": "Certificate is already revoked"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "holderId, title, course, and issueDate are required"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. UNIVERSITY role required."
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Certificate not found"
}
```

### 422 Unprocessable Entity
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "holderId": "Select a holder",
    "title": "Title is required"
  }
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

Or in cookies:
```
Cookie: token=<jwt_token>
```

---

## Certificate ID Format

Certificate IDs follow the pattern:
```
CERT-{YEAR}-{SEQUENCE}
```

Examples:
- `CERT-2026-000001`
- `CERT-2026-000042`
- `CERT-2026-123456`

---

## PDF Hash

The `pdfHash` field contains the SHA-256 hash of the complete PDF binary:
- Used for integrity verification
- Can be compared with blockchain-stored hash
- Format: 64-character hexadecimal string

---

## Blockchain Integration

If blockchain is configured:
- `blockchainTxHash` contains the transaction hash
- View on Polygonscan: `https://amoy.polygonscan.com/tx/{txHash}`
- If blockchain fails, certificate is still issued (off-chain only)
- `blockchainTxHash` will be `null` if not on-chain

---

## QR Code

Each certificate PDF contains a QR code that points to:
```
{APP_URL}/verify/{certificateId}
```

Example: `http://localhost:5173/verify/CERT-2026-000001`

This allows anyone to scan and verify the certificate authenticity.
