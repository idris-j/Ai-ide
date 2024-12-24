import WebSocket from 'ws';
import { createServer } from 'http';
import express from 'express';
import { registerRoutes } from '../routes';

describe('WebSocket Server Tests', () => {
  let server: any;
  let wss: WebSocket.Server;
  const PORT = 5001;
  const BASE_URL = `ws://localhost:${PORT}`;

  beforeAll((done) => {
    const app = express();
    server = registerRoutes(app);
    server.listen(PORT, '0.0.0.0', done);
  });

  afterAll((done) => {
    server.close(done);
  });

  const connectWebSocket = (path: string): Promise<WebSocket> => {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`${BASE_URL}${path}`);
      
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Connection timeout'));
      }, 5000);

      ws.on('open', () => {
        clearTimeout(timeout);
        resolve(ws);
      });

      ws.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  };

  const waitForMessage = (ws: WebSocket): Promise<any> => {
    return new Promise((resolve) => {
      ws.once('message', (data) => {
        resolve(JSON.parse(data.toString()));
      });
    });
  };

  test('IDE WebSocket connection establishes successfully', async () => {
    const ws = await connectWebSocket('/ws/ide');
    expect(ws.readyState).toBe(WebSocket.OPEN);
    ws.close();
  });

  test('Terminal WebSocket connection establishes successfully', async () => {
    const ws = await connectWebSocket('/terminal');
    expect(ws.readyState).toBe(WebSocket.OPEN);
    ws.close();
  });

  test('IDE WebSocket handles messages correctly', async () => {
    const ws = await connectWebSocket('/ws/ide');
    
    const testMessage = {
      type: 'query',
      content: 'test message',
      currentFile: null
    };
    
    ws.send(JSON.stringify(testMessage));
    const response = await waitForMessage(ws);
    
    expect(response).toHaveProperty('id');
    expect(response).toHaveProperty('type');
    expect(response).toHaveProperty('content');
    
    ws.close();
  });

  test('WebSocket maintains connection with ping/pong', async () => {
    const ws = await connectWebSocket('/ws/ide');
    
    // Wait for 35 seconds to test ping/pong (30s interval + 5s buffer)
    await new Promise(resolve => setTimeout(resolve, 35000));
    
    expect(ws.readyState).toBe(WebSocket.OPEN);
    ws.close();
  }, 40000);
});
