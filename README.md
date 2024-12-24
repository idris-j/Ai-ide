
# AI IDE - Modern AI-Powered Development Environment

A sophisticated integrated development environment featuring AI assistance, real-time collaboration, and modern developer tools.

## 🌟 Features

- **AI-Powered Assistance**: Integrated with NVIDIA's Granite-34b model for intelligent code completion and suggestions
- **Modern Interface**: Built with React and Tailwind CSS for a sleek, responsive design
- **Real-Time Collaboration**: WebSocket-based live coding environment
- **Terminal Integration**: Built-in terminal emulator for command-line operations
- **File Management**: Comprehensive file system with upload/download capabilities
- **Multi-Language Support**: Monaco Editor integration for superior code editing experience
- **Authentication System**: Secure user authentication and session management

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn/UI
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: NVIDIA API (Granite-34b model)
- **Real-time Communication**: WebSocket, Server-Sent Events (SSE)
- **Editor**: Monaco Editor
- **Authentication**: Passport.js

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - NVIDIA_API_KEY_AIDEVSPHERE
   - DATABASE_URL
   - SESSION_SECRET

4. Start the development server:
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
├── client/               # Frontend React application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utility functions
├── server/              # Backend Express application
│   ├── services/        # Business logic
│   └── routes.ts        # API routes
└── db/                  # Database configuration
```

## 💡 Key Features

### AI Integration
- Real-time code suggestions
- Context-aware completions
- Intelligent error detection

### Development Environment
- Syntax highlighting
- Code completion
- Integrated terminal
- File tree navigation
- Multiple theme support

### Collaboration Features
- Real-time updates
- Shared editor sessions
- Interactive AI assistance

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
