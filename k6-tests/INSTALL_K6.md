# 📥 How to Install k6 on Windows (Without Chocolatey)

## Method 1: Using Winget (Recommended)

Open PowerShell or CMD and run:
```cmd
winget install k6 --source winget
```

Then verify:
```cmd
k6 version
```

---

## Method 2: Manual Installation (If Winget Fails)

### Step 1: Download k6

1. Go to: https://github.com/grafana/k6/releases/latest
2. Download the file: **`k6-v0.48.0-windows-amd64.zip`** (or latest version)
3. Save it to your Downloads folder

### Step 2: Extract

1. Right-click the downloaded ZIP file
2. Click "Extract All..."
3. Extract to: `C:\k6\`

### Step 3: Add to PATH

**Option A: Using GUI**
1. Press `Win + R`
2. Type: `sysdm.cpl` and press Enter
3. Click "Advanced" tab
4. Click "Environment Variables"
5. Under "System variables", find "Path"
6. Click "Edit"
7. Click "New"
8. Add: `C:\k6`
9. Click OK on all windows

**Option B: Using PowerShell (Run as Admin)**
```powershell
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\k6", "Machine")
```

### Step 4: Verify Installation

Close and reopen your terminal, then run:
```cmd
k6 version
```

You should see:
```
k6 v0.48.0 (go1.21.4, windows/amd64)
```

---

## Method 3: Using Scoop (Another Package Manager)

If you have Scoop installed:
```cmd
scoop install k6
```

Don't have Scoop? Install it first:
```powershell
iwr -useb get.scoop.sh | iex
```

---

## 🧪 Test k6 Installation

Once installed, run:
```cmd
k6 version
```

If you see version info = ✅ Success!

---

## ⚠️ Troubleshooting

### "k6 is not recognized"
→ Restart your terminal after installation
→ Check if k6 is in PATH
→ Try running from k6 folder directly

### "Access denied"
→ Run PowerShell as Administrator
→ Or extract to user folder instead: `C:\Users\Lord Justin\k6\`

### Still not working?
→ Use portable mode: Just run `k6.exe` from the extracted folder
→ No installation needed!

---

## 🚀 Quick Test

After installation, go to k6-tests folder:
```cmd
cd "C:\Users\Lord Justin\Desktop\My website\k6-tests"
k6 run load-test-basic.js
```

You're ready! 🎉
