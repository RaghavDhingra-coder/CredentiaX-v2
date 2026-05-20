# Certificate Route Debugging Guide

## ✅ Current Status

The backend server IS running with comprehensive logging added. All routes are registered correctly:

```
[CERT-ROUTES] ✓ POST /issue registered
[ROUTES] ✓ /certificates mounted
[STARTUP] ✓ Routes mounted at /api/v1
✔  Server is listening on http://localhost:3001
```

## 🔍 Logging Added

### 1. Server Level (`server.js`)
- Logs when routes are mounted at `/api/v1`
- Logs every incoming request: `[REQUEST] METHOD URL`

### 2. Routes Level (`routes/index.js`)
- Logs each sub-route as it's mounted
- Logs 404 errors with full URL

### 3. Certificate Routes (`routes/certificateRoutes.js`)
- Logs each route as it's registered
- Logs when test route is hit

### 4. Auth Middleware (`middleware/auth.js`)
- Logs when `verifyToken` is called
- Logs token presence
- Logs user email and role after verification
- Logs role requirements and checks
- Logs auth failures

### 5. Certificate Controller (`controllers/certificateController.js`)
- Logs when `issue()` is called
- Logs user and request body
- Logs validation failures
- Logs service calls
- Logs success/errors

## 🧪 Manual Testing Steps

### Step 1: Verify Server is Running

Open terminal and run:
```bash
curl http://localhost:3001/api/v1/health
```

**Expected Response:**
```json
{"success":true,"message":"API is healthy"}
```

**Expected Logs in Backend:**
```
[REQUEST] GET /api/v1/health
```

### Step 2: Test Certificate Test Route

```bash
curl http://localhost:3001/api/v1/certificates/test
```

**Expected Response:**
```json
{"success":true,"message":"Certificate routes are mounted correctly!"}
```

**Expected Logs:**
```
[REQUEST] GET /api/v1/certificates/test
[CERT-ROUTES] Test route hit!
```

### Step 3: Test Issue Endpoint (Without Auth)

```bash
curl -X POST http://localhost:3001/api/v1/certificates/issue \
  -H "Content-Type: application/json" \
  -d '{"holderId":"test","title":"Test","course":"Test","issueDate":"2026-05-20"}'
```

**Expected Response:**
```json
{"success":false,"message":"Authentication required"}
```

**Expected Logs:**
```
[REQUEST] POST /api/v1/certificates/issue
[AUTH] verifyToken called for: POST /api/v1/certificates/issue
[AUTH] Token present: false
[AUTH] No token found - authentication required
```

### Step 4: Test from Frontend

1. **Open Browser DevTools** (F12)
2. **Go to Network tab**
3. **Login as UNIVERSITY user**
4. **Try to issue a certificate**
5. **Watch the logs in backend terminal**

**Expected Logs When Request Comes In:**
```
[REQUEST] POST /api/v1/certificates/issue
[AUTH] verifyToken called for: POST /api/v1/certificates/issue
[AUTH] Token present: true
[AUTH] Token verified - User: university@example.com Role: UNIVERSITY
[AUTH] requireRole called - Required: [ 'UNIVERSITY' ] User role: UNIVERSITY
[AUTH] Role check passed
[CERT-CONTROLLER] issue() called
[CERT-CONTROLLER] User: { id: '...', email: '...', role: 'UNIVERSITY' }
[CERT-CONTROLLER] Body: { holderId: '...', title: '...', ... }
```

## 🐛 Troubleshooting

### If You See: "Route not found"

**Check Backend Logs For:**
```
[REQUEST] POST /api/v1/certificates/issue
[404] Route not found: POST /api/v1/certificates/issue
```

This means the request reached the server but didn't match any route.

**Possible Causes:**
1. Routes not mounted correctly (but logs show they are)
2. Request path doesn't match exactly
3. Method mismatch (POST vs GET)

### If You See: "Authentication required"

**Check Backend Logs For:**
```
[AUTH] Token present: false
```

**Solution:**
- Make sure you're logged in
- Check browser cookies for `credentiax_token`
- Check if cookie is being sent with request (DevTools → Network → Request Headers)

### If You See: "Access denied"

**Check Backend Logs For:**
```
[AUTH] Role check failed - User has: HOLDER Required: [ 'UNIVERSITY' ]
```

**Solution:**
- You're logged in as wrong role
- Login as UNIVERSITY user

### If No Logs Appear

**This means the request isn't reaching the backend at all.**

**Check:**
1. Is backend running? Look for: `✔  Server is listening on http://localhost:3001`
2. Is frontend proxy working? Check `vite.config.js`
3. Is request going to correct URL? Check browser DevTools Network tab
4. Is there a CORS error? Check browser console

## 📊 What the Logs Tell You

### Successful Request Flow:
```
[REQUEST] POST /api/v1/certificates/issue
[AUTH] verifyToken called
[AUTH] Token verified - User: xxx Role: UNIVERSITY
[AUTH] Role check passed
[CERT-CONTROLLER] issue() called
[CERT-CONTROLLER] Calling certificateService.issueCertificate...
[CERT-CONTROLLER] Certificate issued successfully: CERT-2026-000001
```

### Failed Auth:
```
[REQUEST] POST /api/v1/certificates/issue
[AUTH] verifyToken called
[AUTH] Token present: false
[AUTH] No token found - authentication required
```

### Wrong Role:
```
[REQUEST] POST /api/v1/certificates/issue
[AUTH] verifyToken called
[AUTH] Token verified - User: xxx Role: HOLDER
[AUTH] Role check failed - User has: HOLDER Required: [ 'UNIVERSITY' ]
```

### Route Not Found:
```
[REQUEST] POST /api/v1/certificates/issue
[404] Route not found: POST /api/v1/certificates/issue
```

## 🎯 Next Steps

1. **Run Step 1 & 2** to verify server is responding
2. **Run Step 3** to verify auth middleware is working
3. **Run Step 4** and **watch the backend logs** to see exactly where it fails
4. **Share the logs** with me if you still see "Route not found"

The routes ARE registered correctly. The logs will show us exactly where the request is failing.
