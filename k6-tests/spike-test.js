import http from 'k6/http';
import { check, sleep } from 'k6';

// Spike test - Sudden traffic surge (like going viral!)
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Normal traffic
    { duration: '10s', target: 500 },  // SPIKE! (Black Friday, viral post)
    { duration: '1m', target: 500 },   // Hold the spike
    { duration: '10s', target: 10 },   // Back to normal
    { duration: '30s', target: 10 },   // Cooldown
  ],
  thresholds: {
    http_req_duration: ['p(99)<3000'], // 99% under 3s even during spike
    http_req_failed: ['rate<0.5'],     // Allow 50% failure during spike
  },
};

const BASE_URL = 'http://localhost:8000/api';

export default function () {
  // Test the most popular endpoint (homepage feed)
  const response = http.get(`${BASE_URL}/products/?moderation_status=approved&is_active=true&ordering=-view_count&page_size=20`);
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time OK': (r) => r.timings.duration < 5000,
  });
  
  // Very short sleep - high request rate
  sleep(0.1);
}
