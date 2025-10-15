# Game Assets

## Directory Structure

- `images/` - Sprites, backgrounds, UI elements, icons
- `sounds/` - Sound effects, music, audio files
- `fonts/` - Custom fonts for the game

## Usage

Place your game assets in the appropriate folders and load them in the preload() method of your scenes.

Example:
```javascript
preload() {
    this.load.image('snake', 'assets/images/snake.png');
    this.load.audio('eat', 'assets/sounds/eat.wav');
    this.load.bitmapFont('pixel', 'assets/fonts/pixel.png', 'assets/fonts/pixel.xml');
}
```