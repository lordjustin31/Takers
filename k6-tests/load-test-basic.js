import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 20 },   // Stay at 20 users for 1 min
    { duration: '30s', target: 50 },  // Spike to 50 users
    { duration: '1m', target: 50 },   // Stay at 50 users
    { duration: '30s', target: 0 },   // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.1'],    // Less than 10% of requests should fail
    errors: ['rate<0.1'],             // Custom error rate should be below 10%
  },
};

const BASE_URL = 'http://localhost:8000/api';

export default function () {
  // Test 1: Get all products
  let response = http.get(`${BASE_URL}/products/`);
  
  let checkRes = check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'has results': (r) => JSON.parse(r.body).results !== undefined,
  });
  
  errorRate.add(!checkRes);
  
  sleep(1);

  // Test 2: Get categories
  response = http.get(`${BASE_URL}/categories/`);
  
  checkRes = check(response, {
    'categories status is 200': (r) => r.status === 200,
    'has categories': (r) => JSON.parse(r.body).length > 0,
  });
  
  errorRate.add(!checkRes);
  
  sleep(1);

  // Test 3: Search products
  response = http.get(`${BASE_URL}/products/?search=test`);
  
  checkRes = check(response, {
    'search status is 200': (r) => r.status === 200,
  });
  
  errorRate.add(!checkRes);
  
  sleep(2);
}
