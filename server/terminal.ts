import * as pty from "node-pty"
import { WebSocket } from "ws"
import * as os from "os"
import { log } from "./vite"

interface TerminalSession {
  pid: number;
  ws: WebSocket;
  pty: pty.IPty;
  lastActivity: number;
  heartbeatInterval?: NodeJS.Timeout;
}

const sessions = new Map<WebSocket, TerminalSession>();
const MAX_IDLE_TIME = 30 * 60 * 1000; // 30 minutes
const PING_INTERVAL = 30000; // 30 seconds
const CLEANUP_INTERVAL = 60000; // 1 minute

let pingInterval: NodeJS.Timeout | null = null;
let cleanupInterval: NodeJS.Timeout | null = null;

function startIntervals() {
  if (pingInterval) {
    clearInterval(pingInterval);
  }
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }

  // Start ping interval
  pingInterval = setInterval(() => {
    const now = Date.now();
    sessions.forEach((session, ws) => {
      try {
        if (ws.readyState === WebSocket.OPEN) {
          session.lastActivity = now;
          ws.ping();
        }
      } catch (error) {
        log(`Error sending ping: ${error}`, "terminal");
        cleanupSession(ws);
      }
    });
  }, PING_INTERVAL);

  // Start cleanup interval
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    sessions.forEach((session, ws) => {
      if (now - session.lastActivity > MAX_IDLE_TIME) {
        log(`Cleaning up idle terminal session: ${session.pid}`, "terminal");
        cleanupSession(ws);
      }
    });
  }, CLEANUP_INTERVAL);
}

function cleanupSession(ws: WebSocket) {
  const session = sessions.get(ws);
  if (session) {
    try {
      session.pty.kill();
      sessions.delete(ws);
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    } catch (error) {
      log(`Error cleaning up session: ${error}`, "terminal");
    }
  }
}

// Cleanup all sessions on process exit
process.on('exit', () => {
  sessions.forEach((_, ws) => cleanupSession(ws));
});

process.on('SIGTERM', () => {
  sessions.forEach((_, ws) => cleanupSession(ws));
  process.exit(0);
});

export function handleTerminal(ws: WebSocket) {
  try {
    log("New terminal connection established", "terminal");

    // Start ping and cleanup intervals if not already started
    if (!pingInterval || !cleanupInterval) {
      startIntervals();
    }

    const shell = os.platform() === "win32" ? "powershell.exe" : "bash";
    const ptyProcess = pty.spawn(shell, [], {
      name: "xterm-256color",
      cols: 80,
      rows: 24,
      cwd: process.env.HOME || process.cwd(),
      env: { ...process.env, TERM: 'xterm-256color' } as { [key: string]: string },
      useConpty: os.platform() === "win32",
    });

    const session: TerminalSession = {
      pid: ptyProcess.pid,
      ws,
      pty: ptyProcess,
      lastActivity: Date.now()
    }

    sessions.set(ws, session);
    log("Terminal session created", "terminal");

    // Start sending pings to keep connection alive
    startIntervals();

    ptyProcess.onData((data) => {
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      } catch (ex) {
        log(`Error sending terminal data: ${ex}`, "terminal");
        cleanupSession(ws);
      }
    });

    ptyProcess.onExit(({ exitCode, signal }) => {
      log(`Terminal process exited with code ${exitCode} and signal ${signal}`, "terminal");
      cleanupSession(ws);
    });

    ws.on("message", (data) => {
      try {
        const message = data.toString();
        if (message.startsWith("{")) {
          const parsed = JSON.parse(message);
          if (parsed.type === "resize") {
            ptyProcess.resize(parsed.cols, parsed.rows);
            log(`Terminal resized to ${parsed.cols}x${parsed.rows}`, "terminal");
          }
        } else {
          ptyProcess.write(message);
        }
      } catch (ex) {
        log(`Error handling terminal message: ${ex}`, "terminal");
        cleanupSession(ws);
      }
    });

    ws.on("error", (error) => {
      log(`WebSocket error: ${error}`, "terminal");
      cleanupSession(ws);
    });

    ws.on("close", () => {
      log("Terminal WebSocket closed", "terminal");
      cleanupSession(ws);
    });

    // Send initial greeting
    ptyProcess.write('echo "Terminal session started"\r');
  } catch (error) {
    log(`Failed to create terminal session: ${error}`, "terminal");
    if (ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  }
}