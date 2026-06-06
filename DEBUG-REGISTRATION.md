# Debug Registration Issue

## Step 1: Test with Simple HTML Page

I've created a test page that bypasses the React app to test the API directly.

1. Open `test-registration.html` in your browser (just double-click it)
2. Click the "Register" button
3. Check if registration works

If this works, the issue is in the React app. If it doesn't work, the issue is with CORS or the backend.

## Step 2: Check Browser Console

1. Open your browser at http://localhost:5173
2. Press **F12** to open DevTools
3. Go to the **Console** tab
4. Try to register
5. Look for any errors in the console

### Common Console Errors:

#### "CORS policy" error
```
Access to XMLHttpRequest at 'http://localhost:5000/api/auth/register' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```
**Solution**: Check `CLIENT_URL` in `server/.env` is set to `http://localhost:5173`

#### "Network Error" or "ERR_CONNECTION_REFUSED"
```
POST http://localhost:5000/api/auth/register net::ERR_CONNECTION_REFUSED
```
**Solution**: Backend is not running. Check Terminal 19.

#### "400 Bad Request" - Validation Error
```
{error: {message: "Password must contain at least one uppercase letter"}}
```
**Solution**: Your password doesn't meet requirements. Use: MyPass123

#### "409 Conflict" - Email Already Exists
```
{error: {message: "Email already registered."}}
```
**Solution**: Try a different email or login with existing credentials.

## Step 3: Check Network Tab

1. Open DevTools (F12)
2. Go to the **Network** tab
3. Try to register
4. Look for the request to `/auth/register`

### What to Check:

#### Request Headers
- Should include: `Content-Type: application/json`
- Should include: `Origin: http://localhost:5173`

#### Request Payload
```json
{
  "name": "Your Name",
  "email": "your@email.com",
  "password": "YourPass123"
}
```

#### Response Status
- **201 Created** = Success! ✅
- **400 Bad Request** = Validation error (check password requirements)
- **409 Conflict** = Email already exists
- **500 Internal Server Error** = Backend error (check Terminal 19)

#### Response Body
Success:
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email."
}
```

Error:
```json
{
  "success": false,
  "error": {
    "message": "Password must contain at least one uppercase letter",
    "code": "VALIDATION_ERROR"
  }
}
```

## Step 4: Check Backend Logs

Check Terminal 19 for logs when you submit the form:

### Success Log:
```
2026-06-06 15:30:00 [http]: ::1 - - [06/Jun/2026:09:30:00 +0000] "POST /api/auth/register HTTP/1.1" 201
```

### Error Logs:
```
2026-06-06 15:30:00 [error]: Validation error: ...
```

## Step 5: Test Password Requirements

Your password MUST have:
- ✅ At least 8 characters
- ✅ At least ONE uppercase letter (A-Z)
- ✅ At least ONE number (0-9)

### Test These:
- ✅ `MyPass123` - VALID
- ✅ `TaskFlow2024` - VALID
- ✅ `Welcome123` - VALID
- ❌ `password123` - INVALID (no uppercase)
- ❌ `Password` - INVALID (no number)
- ❌ `MYPASS123` - VALID but not recommended
- ❌ `Pass12` - INVALID (too short)

## Step 6: Try Different Browser

Sometimes browser extensions or cache can cause issues:
1. Try in **Incognito/Private** mode
2. Try a different browser (Chrome, Firefox, Edge)

## Step 7: Clear Everything and Restart

1. Close browser completely
2. Stop both servers (Ctrl+C in Terminals 19 and 22)
3. Start backend:
   ```bash
   cd server
   npm run dev
   ```
4. Start frontend:
   ```bash
   cd client
   npm run dev
   ```
5. Open fresh browser tab to http://localhost:5173

## Step 8: Use Test Account

If registration keeps failing, try logging in with the test account:
- **Email**: test@example.com
- **Password**: Test1234

This account was created via API and should work.

## Step 9: Manual API Test

Test the API directly with PowerShell:

```powershell
$body = @{
    name = 'My Name'
    email = 'myemail@test.com'
    password = 'MyPass123'
} | ConvertTo-Json

$headers = @{
    'Content-Type' = 'application/json'
    'Origin' = 'http://localhost:5173'
}

Invoke-WebRequest -Uri http://localhost:5000/api/auth/register -Method POST -Headers $headers -Body $body -UseBasicParsing
```

Expected output: `StatusCode: 201`

## Common Issues & Solutions

### Issue: "Registration failed" (generic error)
1. Check browser console for actual error
2. Check backend Terminal 19 for errors
3. Check Network tab for response details

### Issue: Nothing happens when clicking register
1. Check if button is disabled or loading
2. Check browser console for JavaScript errors
3. Check if form validation is blocking submit

### Issue: Page reloads instead of showing error
1. Form might not have `onSubmit={handleSubmit(onSubmit)}`
2. Check if there's a JavaScript error preventing form handling

### Issue: "Email already registered"
1. Try a different email
2. Or login with that email instead
3. Or delete the user from MongoDB Atlas

## Get Detailed Error Info

I've updated the RegisterPage.jsx to log detailed error information to the console. When you try to register:

1. Open browser console (F12)
2. Try to register
3. Look for logs:
   - "Submitting registration: ..."
   - "Registration response: ..." (success)
   - "Registration error: ..." (failure)
   - "Error response: ..." (error details)

## Still Not Working?

Please provide:
1. **Browser console errors** (copy the red text)
2. **Network tab details** (status code and response)
3. **Backend Terminal 19 logs** (any errors)
4. **The password you're using** (make sure it meets requirements)
5. **The exact error message** you see on screen

---

**Last Updated**: June 6, 2026
