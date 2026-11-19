import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const rateLimitHit = new Rate('rate_limit_triggered');
const requestsBlocked = new Rate('requests_blocked');

// Test rate limiting - Should trigger 429 errors
export const options = {
  vus: 1, // Single user making rapid requests
  duration: '2m',
  thresholds: {
    rate_limit_triggered: ['rate>0.5'], // Expect rate limits to be hit
    requests_blocked: ['rate>0.3'],     // Expect blocks
  },
};

const BASE_URL = 'http://localhost:8000/api';

export default function () {
  // Make rapid requests to trigger rate limiting
  
  // Test 1: Anonymous user rapid requests (should hit 20/min limit)
  let response = http.get(`${BASE_URL}/products/`);
  
  let isRateLimited = check(response, {
    'rate limit triggered (429)': (r) => r.status === 429,
  });
  
  rateLimitHit.add(isRateLimited);
  requestsBlocked.add(response.status === 429);
  
  if (response.status === 429) {
    console.log('✅ Rate limit working! Got 429 response');
  }
  
  // Very minimal sleep - spam requests
  sleep(0.1);
  
  // Test 2: Try login endpoint (should have stricter limits)
  const loginPayload = JSON.stringify({
    username: 'testuser',
    password: 'wrongpassword',
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  response = http.post(`${BASE_URL}/auth/login/`, loginPayload, params);
  
  isRateLimited = response.status === 429;
  rateLimitHit.add(isRateLimited);
  requestsBlocked.add(isRateLimited);
  
  if (isRateLimited) {
    console.log('✅ Login rate limit working! Protection against brute force');
  }
  
  sleep(0.1);
}

export function handleSummary(data) {
  const totalRequests = data.metrics.http_reqs.values.count;
  const blockedRequests = data.metrics.requests_blocked ? 
    data.metrics.requests_blocked.values.rate * totalRequests : 0;
  const rateLimitTriggered = data.metrics.rate_limit_triggered ?
    data.metrics.rate_limit_triggered.values.rate * 100 : 0;
  
  console.log(`
  ========================================
  RATE LIMIT TEST RESULTS
  ========================================
  Total Requests: ${totalRequests}
  Blocked Requests: ${Math.round(blockedRequests)}
  Rate Limit Hit: ${rateLimitTriggered.toFixed(1)}%
  
  ✅ Rate limiting is ${rateLimitTriggered > 50 ? 'WORKING' : 'NOT WORKING'}!
  ========================================
  `);
  
  return {
    'rate-limit-test-summary.json': JSON.stringify(data),
  };
}
