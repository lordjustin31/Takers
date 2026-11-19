# 🌐 Network Setup Guide - Access from Other Devices

## ✅ Configuration Complete!

I've configured your marketplace to run on your local network so other devices can access it!

---

## 🚀 How to Start (2 Ways)

### Method 1: Automatic (Recommended)

Just double-click:
```
start-network-mode.cmd
```

This will start both frontend and backend on network-accessible ports!

### Method 2: Manual

**Terminal 1 - Backend:**
```cmd
cd backend
python manage.py runserver 0.0.0.0:5371
```

**Terminal 2 - Frontend:**
```cmd
cd frontend
npm run dev -- --host
```

---

## 📱 Access Your App

### From Your Computer:
- **Frontend**: http://localhost:5174
- **API**: http://localhost:5371/api

### From Other Devices (Same WiFi):
- **Frontend**: http://192.168.100.3:5174
- **API**: http://192.168.100.3:5371/api

**Example:** Phone, tablet, another laptop on same WiFi can access your marketplace!

---

## ⚙️ What I Changed

### Frontend (.env):
```
VITE_API_URL=http://192.168.100.3:5371
```

### Backend (.env):
```
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,192.168.100.3,0.0.0.0
CORS_ALLOWED_ORIGINS=http://localhost:5174,http://192.168.100.3:5174
```

---

## 🔄 Switching Modes

### Want to switch back to localhost only?

1. **Frontend .env** - Change to:
   ```
   VITE_API_URL=http://localhost:8000
   ```

2. **Backend .env** - Change to:
   ```
   DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
   CORS_ALLOWED_ORIGINS=http://localhost:5173
   ```

3. **Or just use:**
   ```cmd
   start-localhost-mode.cmd
   ```

---

## 🛡️ Security Notes

### ⚠️ Important:
- **Only use network mode for testing/development**
- **Don't expose to public internet** (this is local network only)
- **Use firewall** - Windows Firewall should already protect you
- **Same WiFi only** - Only devices on same network can access

### For Production:
- Use proper domain name
- Enable HTTPS
- Use production server (not `runserver`)
- Change `DEBUG=False`

---

## 🐛 Troubleshooting

### "Can't connect from other device"
1. Check if both devices are on same WiFi
2. Check Windows Firewall settings
3. Try: `python manage.py runserver 0.0.0.0:5371` (make sure 0.0.0.0 is used)
4. Verify IP address: `ipconfig` should show `192.168.100.3`

### "CORS error"
- Make sure backend `.env` has your IP in `CORS_ALLOWED_ORIGINS`
- Restart backend after changing `.env`

### "Login not working"
- Check frontend `.env` has correct `VITE_API_URL`
- Restart frontend: `Ctrl+C` and `npm run dev -- --host` again

### "Port already in use"
- Kill existing processes on port 5371 or 5174
- Or use different ports

---

## 📞 Your Network Info

- **Your IP**: 192.168.100.3
- **Backend Port**: 5371
- **Frontend Port**: 5174 (Vite default with --host)

**Share these URLs with other devices:**
- Main app: `http://192.168.100.3:5174`

---

## 🎉 Testing from Phone/Tablet

1. Make sure phone is on same WiFi
2. Open browser on phone
3. Go to: `http://192.168.100.3:5174`
4. Your marketplace should load!

---

## 🔥 Quick Commands

**Start everything (network mode):**
```cmd
start-network-mode.cmd
```

**Start everything (localhost mode):**
```cmd
start-localhost-mode.cmd
```

**Check your IP:**
```cmd
ipconfig
```

**Kill ports if stuck:**
```cmd
netstat -ano | findstr :5371
taskkill /PID [PID_NUMBER] /F
```

---

**You're all set! Other devices can now access your marketplace!** 🚀📱💻
