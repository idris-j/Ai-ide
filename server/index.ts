import express from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { setupAuth } from "./auth";

const app = express();

// CORS middleware must be first
app.use((req, res, next) => {
  const allowedOrigins = ['http://localhost:5000', 'http://localhost:3000', 'https://advanced-ai-ide.replit.app'];
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add logging middleware for debugging auth issues
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms ${req.headers.origin || 'no-origin'} ${req.cookies?.connect?.sid ? 'has-session' : 'no-session'}`);
  });
  next();
});

// Initialize authentication before routes
setupAuth(app);

// Error handling middleware with better error details
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  const details = process.env.NODE_ENV === 'development' ? err.stack : undefined;
  res.status(status).json({ error: message, details });
});

// Initialize server
async function startServer() {
  try {
    const server = registerRoutes(app);

    // In development, setup Vite middleware
    if (process.env.NODE_ENV !== 'production') {
      await setupVite(app, server);
    } else {
      // In production, serve static files
      serveStatic(app);
    }

    const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;

    server.listen(port, '0.0.0.0', () => {
      console.log(`Server started successfully on port ${port}`);
    }).on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use`);
        process.exit(1);
      } else {
        console.error('Server error:', error);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
  process.exit(1);
});

// Start the server
startServer();