# My Phaser Game

A 2D game built with Phaser.js and Electron, designed for Steam distribution.

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run in development mode:
   ```bash
   npm run dev
   ```

## Building for Distribution

Build for all platforms:
```bash
npm run dist
```

## Project Structure

- `main.js` - Electron main process
- `index.html` - Game HTML container
- `js/game.js` - Main Phaser game logic
- `assets/` - Game assets (images, sounds, etc.)

## Steam Integration

For Steam features, you'll need to:
1. Install Steamworks SDK
2. Add Steam achievements/leaderboards
3. Configure Steam Input for controllers
4. Set up Steam Workshop (if needed)