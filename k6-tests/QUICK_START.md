# 🚀 Quick Start - k6 Load Testing

Super quick guide to start testing your marketplace!

---

## ⚡ Installation (Windows)

### Option 1: Using Chocolatey (Recommended)
```cmd
choco install k6
```

### Option 2: Using Winget
```cmd
winget install k6 --source winget
```

### Option 3: Manual Download
Download from: https://github.com/grafana/k6/releases

---

## 🎯 Run Your First Test (3 Steps!)

### Step 1: Start Your Backend
```cmd
cd backend
python manage.py runserver
```

### Step 2: Open New Terminal, Go to k6-tests folder
```cmd
cd "C:\Users\Lord Justin\Desktop\My website\k6-tests"
```

### Step 3: Run Basic Test
```cmd
k6 run load-test-basic.js
```

---

## 📊 What You'll See

```
     ✓ status is 200
     ✓ response time < 500ms
     ✓ has results

     checks.........................: 100.00% ✓ 450      ✗ 0
     data_received..................: 1.2 MB  20 kB/s
     http_req_duration..............: avg=234ms   p(95)=456ms
     http_reqs......................: 150     2.5/s
     vus............................: 20      min=0      max=50
```

### ✅ Good Results:
- All checks passing (✓)
- Response time <500ms
- No errors

### ❌ Problems:
- Checks failing (✗)
- Response time >1000ms
- High error rate

---

## 🧪 All Available Tests

### 1. Basic Load Test (Start Here!)
```cmd
k6 run load-test-basic.js
```
Tests: Products, Categories, Search

### 2. Auth Test (Need test accounts)
```cmd
k6 run load-test-auth.js
```
Tests: Login, JWT tokens, Protected endpoints

### 3. Rate Limit Test (Security!)
```cmd
k6 run rate-limit-test.js
```
Tests: Should see 429 errors (this is good!)

### 4. Stress Test (Find limits)
```cmd
k6 run stress-test.js
```
Tests: Up to 300 users, finds breaking point

### 5. Spike Test (Traffic surge!)
```cmd
k6 run spike-test.js
```
Tests: Sudden 500-user spike

---

## 🎮 Run All Tests at Once

```cmd
run-all-tests.cmd
```

This runs all 5 tests in sequence!

---

## ⚙️ Before Running Auth Test

Edit `load-test-auth.js` and add your test users:

```javascript
const TEST_USERS = [
  { username: 'testuser1', password: 'YourPassword123!' },
  { username: 'testuser2', password: 'YourPassword123!' },
];
```

Create these users first:
```cmd
cd backend
python manage.py createsuperuser
```

---

## 🛡️ Expected Security Results

### Rate Limit Test:
```
✅ Rate limit working! Got 429 response
✅ Login rate limit working!
Rate Limit Hit: 68.5%
✅ Rate limiting is WORKING!
```

If you DON'T see 429 errors → Rate limiting is broken!

---

## 💡 Tips

1. **Start small** - Run basic test first
2. **Watch your backend** - Keep an eye on terminal
3. **429 errors are GOOD** - Means rate limiting works
4. **Don't test production** - Only test locally!
5. **Check database** - Make sure you have test data

---

## 🆘 Troubleshooting

### "k6: command not found"
→ Install k6 first (see Installation section)

### "Connection refused"
→ Make sure backend is running on localhost:8000

### "All requests failing"
→ Check if API URL is correct in test file

### "No rate limit errors"
→ Your rate limiting might not be configured

---

## 📈 What to Look For

### Performance:
- ✅ P95 < 500ms = Excellent
- ⚠️ P95 500-1000ms = Good
- ❌ P95 > 1000ms = Needs optimization

### Reliability:
- ✅ Error rate < 5% = Excellent
- ⚠️ Error rate 5-10% = Acceptable
- ❌ Error rate > 10% = Problems!

### Security:
- ✅ Rate limits trigger = Protected
- ❌ No rate limits = Vulnerable to DDoS!

---

## 🎉 Next Steps

1. ✅ Run basic test
2. ✅ Check results
3. ✅ Test rate limiting
4. ✅ Run stress test
5. 📊 Analyze results
6. 🔧 Optimize if needed

---

**Happy Testing! Find bugs before users do!** 🐛🔍

**Remember:** Good performance = Happy users! 😊
