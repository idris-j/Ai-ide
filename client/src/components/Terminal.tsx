import * as React from "react"
import { Terminal as XTerm } from "xterm"
import { FitAddon } from "xterm-addon-fit"
import { WebLinksAddon } from "xterm-addon-web-links"
import "xterm/css/xterm.css"

interface TerminalProps {
  className?: string
}

export function Terminal({ className }: TerminalProps) {
  const terminalRef = React.useRef<HTMLDivElement>(null)
  const xtermRef = React.useRef<XTerm>()
  const wsRef = React.useRef<WebSocket>()
  const fitAddonRef = React.useRef<FitAddon>()

  React.useEffect(() => {
    if (!terminalRef.current) return

    // Initialize xterm with better defaults
    const term = new XTerm({
      cursorBlink: true,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontSize: 14,
      theme: {
        background: "var(--editor-bg)",
        foreground: "var(--foreground)",
        cursor: "var(--foreground)",
        black: "#000000",
        red: "#cd3131",
        green: "#0dbc79",
        yellow: "#e5e510",
        blue: "#2472c8",
        magenta: "#bc3fbc",
        cyan: "#11a8cd",
        white: "#e5e5e5",
        brightBlack: "#666666",
        brightRed: "#f14c4c",
        brightGreen: "#23d18b",
        brightYellow: "#f5f543",
        brightBlue: "#3b8eea",
        brightMagenta: "#d670d6",
        brightCyan: "#29b8db",
        brightWhite: "#e5e5e5",
      },
      allowTransparency: true,
      scrollback: 10000,
      smoothScrollDuration: 300,
    })

    // Add addons
    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.loadAddon(new WebLinksAddon())
    fitAddonRef.current = fitAddon

    // Open terminal in the container
    term.open(terminalRef.current)
    fitAddon.fit()

    // Store the terminal instance
    xtermRef.current = term

    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const ws = new WebSocket(`${protocol}//${window.location.host}/terminal`)

        // Set a timeout for the connection
        const connectionTimeout = setTimeout(() => {
          if (ws.readyState !== WebSocket.OPEN) {
            ws.close()
            term.write("\r\n\x1B[1;3;31mConnection timeout. Retrying...\x1B[0m\r\n")
            setTimeout(connectWebSocket, 2000)
          }
        }, 5000)

        wsRef.current = ws

        ws.onopen = () => {
          clearTimeout(connectionTimeout)
          term.write("\x1B[1;3;32mTerminal connected.\x1B[0m\r\n$ ")

          // Send initial size
          if (xtermRef.current) {
            ws.send(JSON.stringify({
              type: "resize",
              cols: xtermRef.current.cols,
              rows: xtermRef.current.rows,
            }))
          }
        }

        ws.onclose = (event) => {
          // Only attempt to reconnect if the terminal is still mounted and it wasn't a clean close
          if (terminalRef.current && !event.wasClean) {
            term.write("\r\n\x1B[1;3;31mTerminal disconnected. Attempting to reconnect...\x1B[0m\r\n")
            // Increase reconnect delay with each attempt, max 5 seconds
            const delay = Math.min((event.code === 1006 ? 1000 : 2000), 5000)
            setTimeout(connectWebSocket, delay)
          }
        }

        ws.onerror = () => {
          // Don't show error message if we're already disconnected
          if (ws.readyState === WebSocket.OPEN) {
            term.write("\r\n\x1B[1;3;31mTerminal connection error. Retrying...\x1B[0m\r\n")
          }
        }

        ws.onmessage = (event) => {
          if (terminalRef.current && event.data) {
            term.write(event.data)
          }
        }
      } catch (error) {
        console.error("Failed to establish WebSocket connection:", error)
        term.write("\r\n\x1B[1;3;31mFailed to connect to terminal server.\x1B[0m\r\n")
      }
    }

    connectWebSocket()

    term.onData((data) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(data)
      }
    })

    // Handle resize
    const handleResize = () => {
      if (!fitAddonRef.current || !xtermRef.current) return;

      try {
        fitAddonRef.current.fit();
        if (wsRef.current?.readyState === WebSocket.OPEN && xtermRef.current) {
          wsRef.current.send(JSON.stringify({
            type: "resize",
            cols: xtermRef.current.cols,
            rows: xtermRef.current.rows,
          }));
        }
      } catch (error) {
        console.error('Error resizing terminal:', error);
      }
    }

    // Handle terminal panel visibility changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          setTimeout(handleResize, 0)
        }
      })
    })

    const terminalPanel = document.getElementById('terminal-panel')
    if (terminalPanel) {
      observer.observe(terminalPanel, { attributes: true })
    }

    window.addEventListener("resize", handleResize)
    handleResize() // Initial resize

    return () => {
      window.removeEventListener("resize", handleResize)
      observer.disconnect()
      term.dispose()
      wsRef.current?.close()
    }
  }, [])

  return (
    <div ref={terminalRef} className={className} />
  )
}