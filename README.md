# 💣 Bombparty Clone

A full-stack real-time multiplayer word game built with TypeScript, React, and Socket.io. Inspired by the original [Bombparty](https://jklm.fun/).

[![Live Demo](https://img.shields.io/badge/Live%20Demo-bombparty--clone.fly.dev-blue?style=for-the-badge)](https://bombparty-clone.fly.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)

## Overview

Bombparty Clone is a fast-paced word game where players compete in real-time to form valid words containing randomly generated letter combinations. The game features customizable settings, a scoring system, and smooth multiplayer gameplay powered by WebSockets.

## Features

- 🎮 **Real-time Multiplayer** - Play with friends using Socket.io
- ⚡ **Instant Gameplay** - No lag, responsive UI with React 19
- 🎯 **Customizable Rules** - Adjust timer, lives, and difficulty settings
- 📊 **Score Tracking** - Keep track of player statistics
- 🎨 **Beautiful UI** - Built with React Bootstrap and custom styling
- 🌙 **Dark Mode** - Enjoy the game in any lighting condition
- 🔊 **Sound Effects** - Immersive audio feedback with Howler.js
- 📱 **Responsive Design** - Play on desktop and mobile devices

## Tech Stack

### Frontend

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **UI Components**: React Bootstrap
- **State Management**: Zustand
- **Real-time Communication**: Socket.io Client
- **Testing**: Vitest with React Testing Library

### Backend

- **Runtime**: Node.js
- **Framework**: Express with Socket.io
- **Database**: SQLite with better-sqlite3
- **Logging**: Pino
- **Language**: TypeScript

### Deployment

- **Hosting**: Fly.io
- **Environment**: Docker

## Getting Started

### Prerequisites

- Bun (recommended) — for running the backend, installing deps, and tests
- Node.js 18+ (only required if you run with Node instead of Bun)

### Installation

1. Clone the repository

```bash
git clone https://github.com/Laosing/bombparty-clone.git
cd bombparty-clone
```

2. Install dependencies

```bash
# Install root + client dependencies using Bun
bun install
```

### Development

Start both the backend and frontend in development mode (uses Bun for the server and Vite for the client):

```bash
# From project root
bun run dev
```

This will start:

- Backend on `http://localhost:8080`
- Frontend on `http://localhost:3000`

### Building for Production

```bash
# Build the client bundle
cd client && bun run build

# (Optional) Build any server artifacts if you use tsc or similar
# For Bun-only runtime this may not be required; see package.json scripts
```

### Testing

Run the test suite using Bun for server tests and the client test runner as configured:

```bash
# Run client tests (uses Vitest/Vite config)
cd client && bun test

# Run server tests (if any) with Bun
bun run test
```

## How to Play

1. **Create or Join a Room** - Start a new game or enter a room code
2. **Customize Settings** - Adjust timer, lives, and difficulty before playing
3. **Form Words** - Type words that contain the current letter blend
4. **Earn Points** - Valid words earn points, extra letters earn bonuses
5. **Survive** - Lose a life if you can't form a word in time
6. **Win** - Be the last player(s) standing

## Configuration

Game settings can be customized in the room settings panel:

- **Timer**: Countdown duration per turn (default: 10 seconds)
- **Lives**: Starting lives per group (default: 2)
- **Hard Mode**: Enable harder difficulty after X rounds (default: 5)
- **Letter Blend Counter**: Changes letter blend after X valid words

## API

The backend exposes a Socket.io API for real-time communication:

### Events (Client → Server)

- `joinRoom` - Join a game room
- `joinGame` - Join the current game
- `leaveGame` - Leave the current game
- `checkWord` - Validate a word
- `setSettings` - Update room settings
- `startGame` - Start the countdown
- `stopGame` - Stop the game

### Events (Server → Client)

- `getRoom` - Receive updated room state
- `wordValidation` - Word validation result
- `boom` - Time's up notification
- `winner` - Game winner announcement
- `messages` - Chat messages

## Contributing

Contributions are welcome! This is a personal open-source project, so feel free to:

- 🐛 Report bugs and issues
- 💡 Suggest new features
- 🔧 Submit pull requests
- 📝 Improve documentation

## License

MIT License - See [LICENSE](LICENSE) file for details

## Acknowledgments

- Inspired by [Bombparty](https://jklm.fun/) by JKLM.fun
- Built with modern web technologies and best practices
- Special thanks to the open-source community

## Contact & Support

For questions, feedback, or support:

- Open an issue on [GitHub](https://github.com/Laosing/bombparty-clone/issues)
- Visit the live demo at [bombparty-clone.fly.dev](https://bombparty-clone.fly.dev/)

---

**Made with ❤️ by [Drew](https://github.com/Laosing)**
