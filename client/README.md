# Bombparty Clone - Frontend

The React client application for Bombparty Clone, built with modern technologies for a responsive and engaging user experience.

## Overview

This is the frontend component of the Bombparty Clone game. It provides a real-time, interactive UI for players to join rooms, customize game settings, and play the word game with multiplayer support via Socket.io.

## Tech Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **UI Library**: React Bootstrap
- **State Management**: Zustand
- **Real-time Communication**: Socket.io Client
- **Testing**: Vitest + React Testing Library
- **Styling**: SCSS with CSS Custom Properties

## Getting Started

### Prerequisites

- Bun (recommended) — for installing deps and running lightweight scripts
- Node.js 18+ (optional)

### Installation

```bash
# Install client dependencies
cd client
bun install
```

### Development

Run the development server (Vite) for HMR and fast refresh:

```bash
cd client
bun start
```

The application will open at `http://localhost:3000` with hot module reloading enabled.

### Building

Build for production (uses Vite):

```bash
cd client
bun run build
```

The optimized build will be output to the `dist/` directory.

### Testing

Run the test suite (Vitest):

```bash
cd client
bun test

# Or run in watch mode via the test runner flags
bun test -- --watch
```

## Key Features

### Components

- **Game Component** - Main game interface with timer, letter blend, and player input
- **Room Management** - Create, join, and manage game rooms
- **Settings Panel** - Customize game rules and difficulty
- **Player List** - View all players and their scores
- **Message System** - Real-time chat during gameplay

### Hooks

- **useSocket** - Manages Socket.io connection and events
- **useRoom** - Provides access to room state
- **useStore** - Zustand stores for game and sound settings
- **useHowl** - Audio playback with Howler.js
- **useInterval** - Interval management
- **useIdle** - User idle detection

### State Management

The application uses Zustand for global state:

- `useGameStore` - Game settings (name, theme, avatar)
- `useSoundStore` - Audio settings (music, sound effects, volume)

## Configuration

### Environment Variables

Create a `.env` file in the client directory if needed:

```
VITE_API_URL=http://localhost:3001
```

### Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Optimizations

- Code splitting with dynamic imports
- Lazy loading of components
- Optimized bundle size
- Image optimization with modern formats
- CSS-in-JS minimization with Vite

## Accessibility

The application follows WCAG 2.1 AA standards:

- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- Color contrast compliance
- Screen reader compatible

## Development Tips

### Running with Backend

To run the full application stack, run from the project root:

```bash
bun run dev
```

This will start both the frontend (Vite, port 3000) and backend (Bun, port 8080).

### Hot Module Replacement

Vite provides fast HMR - changes to React components are reflected instantly in the browser.

### TypeScript

All files use TypeScript for type safety. Run type checking:

```bash
tsc --noEmit
```

### Linting & Formatting

While there's no ESLint config in this setup, follow these conventions:

- Use TypeScript strict mode
- Follow React hooks rules
- Use descriptive variable names
- Add JSDoc comments for complex functions

## Troubleshooting

### Port Already in Use

If port 3000 is already in use:

```bash
# Change in vite.config.ts
server: {
  port: 3001,
  ...
}
```

### Socket.io Connection Issues

Ensure the backend server is running on the expected port and the `VITE_API_URL` environment variable is set correctly.

### Build Size Issues

Check bundle size with Vite's built-in analyzer:

```bash
bun run build
```

## Learning Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Documentation](https://vitejs.dev/)
- [Socket.io Client Guide](https://socket.io/docs/v4/client-api/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)

## Contributing

This is part of the Bombparty Clone project. For contribution guidelines, see the [main README](../README.md).

---

**Back to [main project](../README.md)**
