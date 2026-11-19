import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Stress test configuration - Push the system to its limits!
export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '3m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 200 },  // Spike to 200 users (stress!)
    { duration: '3m', target: 200 },  // Hold at 200 users
    { duration: '2m', target: 300 },  // Push to 300 users (breaking point?)
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% should be under 2s (more lenient)
    http_req_failed: ['rate<0.3'],     // Allow up to 30% failure at peak
  },
};

const BASE_URL = 'http://localhost:8000/api';

export default function () {
  // Simulate real user behavior - random actions
  const randomAction = Math.random();
  
  if (randomAction < 0.3) {
    // 30% - Browse products
    const response = http.get(`${BASE_URL}/products/?page=${Math.floor(Math.random() * 5) + 1}`);
    check(response, {
      'browse products OK': (r) => r.status === 200,
    });
  } else if (randomAction < 0.5) {
    // 20% - View specific product
    const productId = Math.floor(Math.random() * 100) + 1;
    const response = http.get(`${BASE_URL}/products/${productId}/`);
    check(response, {
      'view product OK': (r) => r.status === 200 || r.status === 404,
    });
  } else if (randomAction < 0.7) {
    // 20% - Search products
    const searchTerms = ['laptop', 'phone', 'camera', 'book', 'shirt'];
    const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];
    const response = http.get(`${BASE_URL}/products/?search=${term}`);
    check(response, {
      'search OK': (r) => r.status === 200,
    });
  } else if (randomAction < 0.9) {
    // 20% - Get categories
    const response = http.get(`${BASE_URL}/categories/`);
    check(response, {
      'categories OK': (r) => r.status === 200,
    });
  } else {
    // 10% - View user shop
    const userId = Math.floor(Math.random() * 50) + 1;
    const response = http.get(`${BASE_URL}/products/?seller_id=${userId}`);
    check(response, {
      'user shop OK': (r) => r.status === 200,
    });
  }
  
  // Random think time between 0.5s and 3s
  sleep(Math.random() * 2.5 + 0.5);
}

export function handleSummary(data) {
  return {
    'stress-test-summary.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  // Simple summary function
  return `
  ========================================
  STRESS TEST SUMMARY
  ========================================
  Total Requests: ${data.metrics.http_reqs.values.count}
  Failed Requests: ${data.metrics.http_req_failed.values.passes}
  Avg Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
  95th Percentile: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
  Max Response Time: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms
  ========================================
  `;
}
