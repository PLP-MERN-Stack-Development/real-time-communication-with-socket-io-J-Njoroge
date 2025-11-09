# 🚀 Quick Setup Guide - How to Run the App

## Step-by-Step Instructions

### 1. Check Prerequisites
Make sure you have Node.js installed:
```bash
node --version
# Should show v18 or higher

npm --version
# Should show version number
```

If Node.js is not installed, download it from: https://nodejs.org/

---

### 2. Install Dependencies

#### Install Server Dependencies
Open a terminal/command prompt and run:
```bash
cd server
npm install
```

**Common Issues:**
- If you get `npm: command not found`, install Node.js first
- If installation fails, try: `npm install --legacy-peer-deps`
- On Windows, make sure you're in the correct directory

#### Install Client Dependencies
Open a **NEW** terminal/command prompt and run:
```bash
cd client
npm install
```

---

### 3. Start the Application

You need **TWO terminals** running simultaneously:

#### Terminal 1 - Start the Server
```bash
cd server
npm run dev
```

**Expected Output:**
```
Server running on port 5000
```

**Common Errors:**
- **Port 5000 already in use**: 
  - Change the port in `server/.env` file: `PORT=5001`
  - Or kill the process using port 5000
- **Cannot find module 'nodemon'**:
  - Run: `npm install -g nodemon` or `npm install --save-dev nodemon`
- **Module not found errors**:
  - Make sure you ran `npm install` in the server directory

#### Terminal 2 - Start the Client
```bash
cd client
npm run dev
```

**Expected Output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Common Errors:**
- **Port 5173 already in use**:
  - Vite will automatically use the next available port (5174, 5175, etc.)
  - Check the terminal output for the actual port
- **Cannot find module errors**:
  - Make sure you ran `npm install` in the client directory

---

### 4. Open the Application

Open your web browser and go to:
```
http://localhost:5173
```

You should see the login page!

---

## 🔧 Common Errors and Solutions

### Error 1: "Cannot find module 'express'"
**Solution:**
```bash
cd server
npm install
```

### Error 2: "Cannot find module 'react'"
**Solution:**
```bash
cd client
npm install
```

### Error 3: "Port 5000 is already in use"
**Solution:**
1. Find and kill the process:
   ```bash
   # Windows
   netstat -ano | findstr :5000
   taskkill /PID <PID_NUMBER> /F
   
   # Mac/Linux
   lsof -ti:5000 | xargs kill
   ```
2. Or change the port in `server/.env`:
   ```
   PORT=5001
   ```

### Error 4: "EADDRINUSE: address already in use"
**Solution:**
- This means a port is already in use
- Kill the process using that port (see Error 3)
- Or change the port number

### Error 5: "Module not found: Can't resolve 'socket.io-client'"
**Solution:**
```bash
cd client
npm install socket.io-client
```

### Error 6: "ERR_CONNECTION_REFUSED" in browser
**Solution:**
- Make sure the server is running (Terminal 1)
- Check that server is on port 5000
- Verify the client is trying to connect to the correct URL

### Error 7: "npm: command not found"
**Solution:**
- Install Node.js from https://nodejs.org/
- Restart your terminal after installation

### Error 8: "SyntaxError: Unexpected token" or "Cannot use import statement"
**Solution:**
- Make sure you're using Node.js v18 or higher
- Check that `client/package.json` has `"type": "module"`
- Check that `server/package.json` has `"type": "commonjs"`

### Error 9: "Failed to load resource: the server responded with a status of 404"
**Solution:**
- Make sure both server and client are running
- Check browser console for specific error
- Verify CORS settings in server.js

### Error 10: "Cannot read property 'username' of undefined"
**Solution:**
- Make sure you're logged in first
- Try refreshing the page
- Check browser console for more details

---

## 🐛 Debugging Tips

### Check if servers are running:
1. **Server**: Look for "Server running on port 5000" in Terminal 1
2. **Client**: Look for "Local: http://localhost:5173" in Terminal 2

### Check browser console:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for any red error messages

### Check Network tab:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Look for failed requests (red entries)

### Verify file structure:
Make sure these files exist:
- `server/server.js`
- `server/package.json`
- `client/src/App.jsx`
- `client/src/main.jsx`
- `client/package.json`
- `client/index.html`

---

## 📝 Quick Start Commands

### Windows (PowerShell/CMD):
```powershell
# Terminal 1
cd server
npm install
npm run dev

# Terminal 2 (new window)
cd client
npm install
npm run dev
```

### Mac/Linux:
```bash
# Terminal 1
cd server
npm install
npm run dev

# Terminal 2 (new tab/window)
cd client
npm install
npm run dev
```

---

## ✅ Verification Checklist

Before reporting an error, check:
- [ ] Node.js is installed (v18+)
- [ ] npm is installed
- [ ] Dependencies installed in both `server/` and `client/`
- [ ] Server is running (Terminal 1)
- [ ] Client is running (Terminal 2)
- [ ] Browser is open to correct URL (http://localhost:5173)
- [ ] No port conflicts
- [ ] Firewall is not blocking connections

---

## 🆘 Still Having Issues?

If you're still getting errors:

1. **Share the exact error message** - Copy the full error from your terminal or browser console
2. **Share your Node.js version**: `node --version`
3. **Share your npm version**: `npm --version`
4. **Share your operating system**: Windows/Mac/Linux
5. **Check if both terminals show any errors**

---

## 🎯 Expected Behavior

When everything works correctly:
1. Terminal 1 shows: "Server running on port 5000"
2. Terminal 2 shows: "Local: http://localhost:5173"
3. Browser opens to login page
4. You can enter username and join chat
5. Messages appear in real-time

Good luck! 🚀

