import type { Express } from "express";
import { createServer, type Server } from "http";
import { IncomingMessage, ServerResponse } from 'http';
import { WebSocketServer } from 'ws';
import fileUpload from 'express-fileupload';
import AdmZip from 'adm-zip';
import path from 'path';
import { db } from "../db";
import { files } from "../db/schema";
import { eq } from "drizzle-orm";
import { setupAuth } from "./auth";
import { handleQuery, aiEventEmitter } from './services/nvidia';
import type { Message } from './types';
import { handleTerminal } from './terminal';

// For SSE clients
const clients = new Set<ServerResponse>();

// Utility function to find an available port
async function findAvailablePort(startPort: number, maxAttempts: number = 10): Promise<number> {
  for (let port = startPort; port < startPort + maxAttempts; port++) {
    try {
      await new Promise((resolve, reject) => {
        const server = createServer();
        server.listen(port, '0.0.0.0')
          .once('error', reject)
          .once('listening', () => {
            server.close(() => resolve(port));
          });
      });
      return port;
    } catch (err) {
      if (port === startPort + maxAttempts - 1) {
        throw new Error('No available ports found');
      }
      continue;
    }
  }
  throw new Error('No available ports found');
}

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);

  // Initialize authentication
  setupAuth(app);

  // Authentication middleware
  const requireAuth = (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    next();
  };

  // Initialize WebSocket server
  const wss = new WebSocketServer({ noServer: true });

  // WebSocket upgrade handler
  httpServer.on('upgrade', (request: IncomingMessage, socket, head) => {
    try {
      const pathname = new URL(request.url!, `http://${request.headers.host}`).pathname;

      if (request.headers['sec-websocket-protocol'] === 'vite-hmr') {
        socket.destroy();
        return;
      }

      if (pathname === '/terminal') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          handleTerminal(ws);
        });
      } else if (pathname === '/ws/ide') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      } else {
        socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
        socket.destroy();
      }
    } catch (error) {
      console.error('Error in WebSocket upgrade:', error);
      socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
      socket.destroy();
    }
  });

  // Configure file upload middleware
  app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
    useTempFiles: true,
    tempFileDir: '/tmp/',
    debug: false,
    safeFileNames: true,
    preserveExtension: true,
    abortOnLimit: true,
    responseOnLimit: 'File size limit has been reached',
    uploadTimeout: 30000,
    createParentPath: true,
    parseNested: true
  }));

  // Error handling middleware
  app.use((err: any, req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    console.error('Error:', err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal server error';
    res.status(status).json({ error: message });
  });

  // CORS middleware
  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5000');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
  });

  // File Routes
  app.post('/api/upload', requireAuth, async (req, res) => {
    try {
      if (!req.files || !('project' in req.files)) {
        return res.status(400).json({ error: 'No project file uploaded' });
      }

      const projectFile = req.files.project;
      if (Array.isArray(projectFile)) {
        return res.status(400).json({ error: 'Multiple file upload not supported' });
      }

      if (!req.user?.id) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Handle zip file upload
      if (projectFile.name.endsWith('.zip')) {
        const zip = new AdmZip(projectFile.tempFilePath);
        const entries = zip.getEntries();

        for (const entry of entries) {
          if (!entry.isDirectory) {
            await db.insert(files).values({
              name: path.basename(entry.entryName),
              path: entry.entryName,
              content: entry.getData().toString('utf8'),
              userId: req.user.id,
              isDirectory: false
            });
          }
        }

        return res.json({
          success: true,
          message: 'Zip file contents imported successfully'
        });
      }

      // Handle single file upload
      const [uploadedFile] = await db.insert(files).values({
        name: projectFile.name,
        path: projectFile.name,
        content: projectFile.data.toString('utf8'),
        userId: req.user.id,
        isDirectory: false
      }).returning();

      res.json({ success: true, file: uploadedFile });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({
        error: 'File upload failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/files', requireAuth, async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const userFiles = await db.query.files.findMany({
        where: eq(files.userId, req.user.id),
        orderBy: (files, { asc }) => [asc(files.name)]
      });

      const fileTree = userFiles.reduce((acc: any[], file) => {
        const parts = file.path.split('/');
        let current = acc;

        parts.forEach((part, idx) => {
          if (!part) return;

          const existing = current.find(item => item.name === part);
          if (existing && idx < parts.length - 1) {
            current = existing.children;
          } else if (!existing) {
            const newItem = {
              name: part,
              type: idx === parts.length - 1 && !file.isDirectory ? 'file' : 'folder',
              children: []
            };
            current.push(newItem);
            current = newItem.children;
          }
        });

        return acc;
      }, []);

      res.json(fileTree);
    } catch (error) {
      console.error('Error listing files:', error);
      res.status(500).json({ error: 'Failed to list files' });
    }
  });

  // SSE endpoint for IDE communication
  app.get('/api/sse', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });

    const clientId = Date.now().toString();

    const sendEvent = (data: any) => {
      try {
        if (!res.writableEnded) {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          res.write(message);
          if (typeof (res as any).flush === 'function') {
            (res as any).flush();
          }
        }
      } catch (error) {
        console.error('Error sending SSE event:', error);
        cleanup();
      }
    };

    // Send initial connection confirmation
    sendEvent({
      type: 'connection',
      status: 'connected',
      clientId,
      timestamp: Date.now()
    });

    // Message handlers
    const messageHandler = (message: Message) => sendEvent(message);
    const errorHandler = (error: Message) => sendEvent(error);

    // Subscribe to AI events
    aiEventEmitter.on('message', messageHandler);
    aiEventEmitter.on('error', errorHandler);

    // Heartbeat
    const heartbeatInterval = setInterval(() => {
      try {
        if (!res.writableEnded) {
          sendEvent({
            type: 'heartbeat',
            clientId,
            timestamp: Date.now()
          });
        } else {
          cleanup();
        }
      } catch (error) {
        console.error(`Heartbeat error for client ${clientId}:`, error);
        cleanup();
      }
    }, 15000);

    // Cleanup function
    const cleanup = () => {
      clearInterval(heartbeatInterval);
      aiEventEmitter.removeListener('message', messageHandler);
      aiEventEmitter.removeListener('error', errorHandler);
      clients.delete(res);
      if (!res.writableEnded) {
        res.end();
      }
    };

    // Add client to active connections
    clients.add(res);

    // Handle client disconnect
    req.on('close', cleanup);
    req.on('error', (error) => {
      console.error(`SSE error for client ${clientId}:`, error);
      cleanup();
    });

    // Keep connection alive
    if (res.socket) {
      res.socket.setKeepAlive(true);
      res.socket.setTimeout(0);
    }
  });

  // AI query endpoint
  app.post('/api/query', async (req, res) => {
    try {
      const { content, currentFile } = req.body;
      if (!content) {
        return res.status(400).json({ error: 'Content is required' });
      }

      try {
        const response = await handleQuery(content, currentFile);

        clients.forEach(client => {
          try {
            client.write(`data: ${JSON.stringify(response)}\n\n`);
          } catch (error) {
            console.error('Error sending SSE message:', error);
            clients.delete(client);
          }
        });

        if (response.type !== 'error') {
          return res.json({ success: true });
        }

        const statusCode = response.content.includes('rate limit') ? 429 :
          response.content.includes('authentication') ? 401 :
            response.content.includes('invalid request') ? 400 : 500;

        return res.status(statusCode).json({ error: response.content });

      } catch (error) {
        if (error instanceof Error && error.message === 'NEED_NEW_API_KEY') {
          return res.status(401).json({
            error: 'API key invalid or expired',
            needNewKey: true
          });
        }
        throw error;
      }
    } catch (error) {
      console.error('Error processing query:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process query';
      res.status(500).json({ error: errorMessage });
    }
  });

  // File operations
  app.post('/api/files/create', requireAuth, async (req, res) => {
    try {
      const { path: filePath, content = '' } = req.body;
      if (!filePath) {
        return res.status(400).json({ error: 'File path is required' });
      }

      if (!req.user?.id) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const [newFile] = await db.insert(files)
        .values({
          name: path.basename(filePath),
          path: filePath,
          content,
          userId: req.user.id,
          isDirectory: false
        })
        .returning();

      res.json({ success: true, file: newFile });
    } catch (error) {
      console.error('Error creating file:', error);
      res.status(500).json({
        error: 'Failed to create file',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get('/api/files/exists', requireAuth, async (req, res) => {
    try {
      const filePath = req.query.path as string;
      if (!filePath) {
        return res.status(400).json({ error: 'File path is required' });
      }

      if (!req.user?.id) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const existingFile = await db.query.files.findFirst({
        where: eq(files.path, filePath) && eq(files.userId, req.user.id)
      });

      res.json(!!existingFile);
    } catch (error) {
      console.error('Error checking file existence:', error);
      res.status(500).json({ error: 'Failed to check file existence' });
    }
  });

  // Port conflict handling
  httpServer.on('error', async (error: any) => {
    if (error.code === 'EADDRINUSE') {
      try {
        const newPort = await findAvailablePort(5000);
        httpServer.listen(newPort, '0.0.0.0');
      } catch (err) {
        console.error('Failed to find available port:', err);
      }
    } else {
      console.error('Server error:', error);
    }
  });

  return httpServer;
}