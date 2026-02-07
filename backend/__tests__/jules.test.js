import { describe, test, expect } from '@jest/globals';
import http from 'http';

const port = 3000; // Use the default server port

describe('Jules API', () => {
  test('should return a successful response for /api/jules/execute', (done) => {
    const postData = JSON.stringify({
      command: 'Hello Jules',
    });

    const options = {
      hostname: 'localhost',
      port: port,
      path: '/api/jules/execute',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          expect(res.statusCode).toBe(200);
          expect(response.success).toBe(true);
          expect(response.agent).toBe('Jules (Gemini 1.5 Pro)');
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    req.on('error', (e) => {
      done(e);
    });

    req.write(postData);
    req.end();
  });
});
