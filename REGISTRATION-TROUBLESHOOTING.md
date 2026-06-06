# Registration Troubleshooting Guide

## Password Requirements ⚠️

The registration requires a **strong password** with:
- ✅ At least **8 characters**
- ✅ At least **one uppercase letter** (A-Z)
- ✅ At least **one number** (0-9)

### ✅ Valid Password Examples:
- `MyPass123`
- `TaskFlow2024!`
- `SecureP@ss1`
- `Welcome123`

### ❌ Invalid Password Examples:
- `password` (no uppercase, no number)
- `Password` (no number)
- `pass123` (no uppercase)
- `Pass12` (too short, less than 8 characters)

---

## Testing Registration

### Step 1: Check the Backend
The backend API is working correctly. Test with:
```powershell
$body = @{name='Test User';email='test@test.com';password='Test1234'} | ConvertTo-Json
Invoke-WebRequest -Uri http://localhost:5000/api/auth/register -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing
```

Expected response: `201 Created` with message "Registration successful"

### Step 2: Try Registering in the Browser
1. Go to http://localhost:5173
2. Click "Create account" or "Register"
3. Fill in the form with:
   - **Name**: Your Full Name
   - **Email**: your.email@example.com
   - **Password**: `MyPass123` (must meet requirements above!)
4. Click "Create account"

### Step 3: Check for Errors

#### Browser Console (F12)
Open browser DevTools (press F12) and check:
- **Console tab**: Look for JavaScript errors or API errors
- **Network tab**: Check if the POST request to `/api/auth/register` appears
  - If request shows "CORS error": Backend CORS issue
  - If request shows "404": Wrong API URL
  - If request shows "400": Validation error (check password requirements)
  - If request shows "409": Email already exists
  - If request shows "500": Server error

#### Backend Logs
Check Terminal ID 19 for backend logs. Look for:
- `POST /api/auth/register` - request received
- Any error messages

---

## Common Issues & Solutions

### Issue 1: "Password must contain at least one uppercase letter"
**Solution**: Make sure your password has at least one capital letter
- ❌ `password123` 
- ✅ `Password123`

### Issue 2: "Password must contain at least one number"
**Solution**: Add a number to your password
- ❌ `MyPassword` 
- ✅ `MyPassword1`

### Issue 3: "Password must be at least 8 characters"
**Solution**: Use a longer password
- ❌ `Pass1` 
- ✅ `Password1`

### Issue 4: "Email already registered"
**Solution**: The email is already in the database. Either:
- Use a different email address
- Try logging in with that email instead
- Delete the user from MongoDB Atlas if it's a test account

### Issue 5: Form doesn't submit / Nothing happens
**Solutions**:
1. **Check browser console (F12)** for JavaScript errors
2. **Refresh the page** (Ctrl+R or Cmd+R)
3. **Clear browser cache** and reload
4. **Check if frontend is running** on http://localhost:5173
5. **Check if backend is running** on http://localhost:5000

### Issue 6: "Network Error" or "Failed to fetch"
**Solutions**:
1. **Verify backend is running**: Check Terminal ID 19
2. **Verify backend URL**: Should be http://localhost:5000
3. **Check firewall**: Make sure localhost connections are allowed
4. **Restart backend**:
   ```bash
   # Stop the backend (Ctrl+C in Terminal 19)
   cd server
   npm run dev
   ```

### Issue 7: CORS Error
**Solution**: Verify `CLIENT_URL` in `server/.env` is set to:
```
CLIENT_URL=http://localhost:5173
```

Then restart the backend server.

---

## Quick Test Commands

### Test Backend Health
```powershell
curl http://localhost:5000/health
```
Should return: `{"status":"ok",...}`

### Test Frontend is Serving
```powershell
curl http://localhost:5173
```
Should return HTML content

### Check MongoDB Connection
```powershell
curl http://localhost:5000/health?detailed=true
```
Should show: `"mongodb": "connected"`

---

## Email Verification Note

After successful registration:
- ✅ You'll see: "Account created! Please check your email to verify"
- ⚠️ Since SMTP is not configured, the verification link will appear in the **backend console logs** (Terminal 19)
- 📧 Look for a line like: `Verification URL: http://localhost:5173/verify-email/...`
- You can copy that URL and paste it in your browser to verify your email

---

## Manual Database Check

If you want to verify the user was created in MongoDB:

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Log in with your credentials
3. Click "Browse Collections"
4. Select `taskflow` database
5. Select `users` collection
6. Look for your user by email

---

## Still Having Issues?

1. **Check all processes are running**:
   - Frontend: http://localhost:5173 (Terminal 13)
   - Backend: http://localhost:5000 (Terminal 19)

2. **Check backend logs** (Terminal 19) for any errors

3. **Check browser console** (F12) for JavaScript errors

4. **Try a different browser** (Chrome, Firefox, Edge)

5. **Restart everything**:
   ```bash
   # Stop both frontend and backend (Ctrl+C)
   
   # Start backend
   cd server
   npm run dev
   
   # In another terminal, start frontend
   cd client
   npm run dev
   ```

---

## Test Account Credentials

Use these credentials for testing:
- **Email**: test@example.com
- **Password**: Test1234
- **Name**: Test User

This account was already created during backend testing and should work for login.

---

**Last Updated**: June 6, 2026
