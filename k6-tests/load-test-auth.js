import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const loginSuccessRate = new Rate('login_success');

// Test configuration - Testing authentication endpoints
export const options = {
  stages: [
    { duration: '1m', target: 5 },   // Ramp up to 5 users
    { duration: '2m', target: 10 },  // Stay at 10 users
    { duration: '30s', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // Auth requests can be slower
    errors: ['rate<0.15'],
    login_success: ['rate>0.8'],       // At least 80% login success
  },
};

const BASE_URL = 'http://localhost:8000/api';

// Test user credentials - CHANGE THESE TO YOUR TEST ACCOUNTS
const TEST_USERS = [
  { username: 'testuser1', password: 'TestPass123!' },
  { username: 'testuser2', password: 'TestPass123!' },
  { username: 'testuser3', password: 'TestPass123!' },
];

export default function () {
  // Pick a random test user
  const user = TEST_USERS[Math.floor(Math.random() * TEST_USERS.length)];
  
  // Test 1: Login
  const loginPayload = JSON.stringify({
    username: user.username,
    password: user.password,
  });
  
  const loginParams = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  let response = http.post(`${BASE_URL}/auth/login/`, loginPayload, loginParams);
  
  let checkRes = check(response, {
    'login status is 200': (r) => r.status === 200,
    'has access token': (r) => JSON.parse(r.body).access !== undefined,
    'has refresh token': (r) => JSON.parse(r.body).refresh !== undefined,
  });
  
  loginSuccessRate.add(checkRes);
  errorRate.add(!checkRes);
  
  if (checkRes) {
    const tokens = JSON.parse(response.body);
    const accessToken = tokens.access;
    
    sleep(1);
    
    // Test 2: Get user profile (authenticated request)
    const authParams = {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    };
    
    response = http.get(`${BASE_URL}/auth/user/`, authParams);
    
    checkRes = check(response, {
      'profile status is 200': (r) => r.status === 200,
      'has user data': (r) => JSON.parse(r.body).username !== undefined,
    });
    
    errorRate.add(!checkRes);
    
    sleep(1);
    
    // Test 3: Get user's products
    response = http.get(`${BASE_URL}/products/?seller=${user.username}`, authParams);
    
    checkRes = check(response, {
      'my products status is 200': (r) => r.status === 200,
    });
    
    errorRate.add(!checkRes);
    
    sleep(2);
    
    // Test 4: Get notifications
    response = http.get(`${BASE_URL}/notifications/`, authParams);
    
    checkRes = check(response, {
      'notifications accessible': (r) => r.status === 200 || r.status === 404,
    });
    
    errorRate.add(!checkRes);
  }
  
  sleep(3);
}
