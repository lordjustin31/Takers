import json
import urllib.request

payload = {
    'username': 'testuser4',
    'email': 'test4@example.com',
    'password': 'StrongPass123',
}
data = json.dumps(payload).encode()
req = urllib.request.Request(
    'http://127.0.0.1:8000/api/auth/register/',
    data=data,
    headers={'Content-Type': 'application/json'},
)
with urllib.request.urlopen(req) as response:
    print(response.status)
    print(response.read().decode())
