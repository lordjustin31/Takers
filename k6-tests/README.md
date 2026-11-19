# 🧪 k6 Load Testing Scripts for Your Marketplace

Comprehensive performance and security testing suite for your Django marketplace!

---

## 📋 Prerequisites

### 1. Install k6

**Windows:**
```cmd
choco install k6
```

Or download from: https://k6.io/docs/get-started/installation/

**Alternative (using Chocolatey):**
```cmd
winget install k6 --source winget
```

### 2. Prepare Your Environment

- ✅ Make sure backend is running: `python manage.py runserver`
- ✅ Create test user accounts (for auth tests)
- ✅ Have some test data in database

---

## 🎯 Available Test Scripts

### 1️⃣ Basic Load Test (`load-test-basic.js`)

**Purpose:** Test general API performance under normal load

**What it tests:**
- Product listing endpoint
- Categories endpoint
- Search functionality

**Run command:**
```cmd
k6 run load-test-basic.js
```

**Expected behavior:**
- Gradually increases from 10 → 50 users
- All requests should complete in <500ms
- Less than 10% error rate

---

### 2️⃣ Authentication Load Test (`load-test-auth.js`)

**Purpose:** Test authentication system and protected endpoints

**What it tests:**
- Login endpoint
- User profile retrieval
- Authenticated API calls
- Token handling

**⚠️ Before running:**
Edit the script and update test user credentials:
```javascript
const TEST_USERS = [
  { username: 'YOUR_TEST_USER', password: 'YOUR_TEST_PASSWORD' },
];
```

**Run command:**
```cmd
k6 run load-test-auth.js
```

**Expected behavior:**
- 80%+ successful logins
- JWT tokens work correctly
- Protected endpoints accessible with valid tokens

---

### 3️⃣ Stress Test (`stress-test.js`)

**Purpose:** Find the breaking point of your application

**What it tests:**
- Multiple endpoints simultaneously
- Realistic user behavior patterns
- System behavior under extreme load (300+ users)

**Run command:**
```cmd
k6 run stress-test.js
```

**Expected behavior:**
- Gradually increases to 300 concurrent users
- Identifies performance bottlenecks
- Shows when system starts degrading
- Generates `stress-test-summary.json` report

---

### 4️⃣ Spike Test (`spike-test.js`)

**Purpose:** Test sudden traffic surge (viral content, Black Friday)

**What it tests:**
- Homepage feed endpoint
- Response to sudden 500-user spike
- Recovery after spike

**Run command:**
```cmd
k6 run spike-test.js
```

**Expected behavior:**
- Normal traffic: 10 users
- Sudden spike: 500 users for 1 minute
- System should handle or gracefully degrade
- Should recover after spike

---

### 5️⃣ Rate Limit Test (`rate-limit-test.js`)

**Purpose:** Verify rate limiting is working (security test!)

**What it tests:**
- Anonymous user rate limits (20/min)
- Login endpoint rate limits (5/min)
- Brute force protection

**Run command:**
```cmd
k6 run rate-limit-test.js
```

**Expected behavior:**
- ✅ Should trigger 429 (Too Many Requests) errors
- ✅ Rate limiting should block >50% of rapid requests
- ✅ Protection against DDoS and brute force attacks

**If you DON'T get 429 errors, your rate limiting needs fixing!**

---

## 📊 Understanding Results

### Key Metrics:

**http_req_duration:** Response time
- `avg`: Average response time
- `p(95)`: 95% of requests faster than this
- `p(99)`: 99% of requests faster than this
- `max`: Slowest request

**http_req_failed:** Failed requests
- Should be <10% for healthy system

**http_reqs:** Total requests made

**vus (Virtual Users):** Concurrent users

---

## 🎯 Performance Benchmarks

### Good Performance:
- ✅ P95 response time: <500ms
- ✅ P99 response time: <1000ms
- ✅ Error rate: <5%
- ✅ Rate limiting: Working (429 errors)

### Needs Optimization:
- ⚠️ P95 response time: >1000ms
- ⚠️ Error rate: 5-15%
- ⚠️ Rate limiting: Not triggering

### Critical Issues:
- ❌ P95 response time: >2000ms
- ❌ Error rate: >15%
- ❌ System crashes under load
- ❌ No rate limiting

---

## 🚀 Quick Start Guide

### Step 1: Run Basic Test
```cmd
cd k6-tests
k6 run load-test-basic.js
```

### Step 2: Check Results
Look for:
- ✅ All checks passing (green)
- ✅ Response times <500ms
- ✅ 0% error rate

### Step 3: Test Rate Limiting
```cmd
k6 run rate-limit-test.js
```

Expected: Should see 429 errors (this is GOOD!)

### Step 4: Stress Test
```cmd
k6 run stress-test.js
```

This will show your system's limits

---

## 🔧 Customization

### Change User Load:
Edit `stages` in any script:
```javascript
stages: [
  { duration: '30s', target: 100 },  // Your desired user count
]
```

### Change API URL:
Edit `BASE_URL` in any script:
```javascript
const BASE_URL = 'https://your-domain.com/api';
```

### Add Custom Endpoints:
Add new test cases:
```javascript
const response = http.get(`${BASE_URL}/your-endpoint/`);
check(response, {
  'your check': (r) => r.status === 200,
});
```

---

## 🛡️ Security Testing Tips

### Test Rate Limiting:
1. Run `rate-limit-test.js`
2. You WANT to see 429 errors
3. If no 429s → rate limiting broken!

### Test Authentication:
1. Run `load-test-auth.js` with wrong passwords
2. Should see failures after 5 attempts (rate limit)

### Test DDoS Protection:
1. Run `spike-test.js`
2. System should not crash
3. Should return 503 or rate limit, not crash

---

## 📈 Results Files

Tests generate JSON summaries:
- `stress-test-summary.json` - Full stress test metrics
- `rate-limit-test-summary.json` - Rate limiting analysis

---

## ⚠️ Important Notes

1. **Don't run on production!** - These tests generate heavy load
2. **Use test accounts** - Don't use real user credentials
3. **Monitor your server** - Watch CPU, memory, database
4. **Rate limiting will trigger** - This is expected and good!
5. **Start small** - Run basic test first, then increase load

---

## 🎉 What You Should See

### Healthy System:
```
✓ status is 200
✓ response time < 500ms
✓ has results

http_req_duration..............: avg=234ms  p(95)=456ms
http_req_failed................: 2.3%
```

### Rate Limiting Working:
```
✅ Rate limit working! Got 429 response
✅ Login rate limit working! Protection against brute force

Rate Limit Hit: 68.5%
✅ Rate limiting is WORKING!
```

---

## 🔥 Next Steps

After running tests:

1. **If performance is slow:**
   - Add database indexes
   - Enable caching
   - Optimize queries
   - Use CDN

2. **If rate limiting fails:**
   - Check Django throttling settings
   - Verify middleware is active
   - Test with different IPs

3. **If system crashes:**
   - Add more memory
   - Optimize database
   - Use load balancer
   - Add CDN/WAF

---

## 📞 Need Help?

Common issues:
- **"Connection refused"**: Backend not running
- **"No 429 errors"**: Rate limiting not configured
- **"All requests fail"**: Check API URL
- **"k6 not found"**: Install k6 first

---

**Enjoy testing your marketplace! Find those bugs before your users do!** 🚀🐛

**Pro tip:** Run tests regularly, especially before major updates!
