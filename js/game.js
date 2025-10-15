class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        // Title
        this.add.text(400, 200, 'Battle Bikes', {
            fontSize: '48px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Start Game button
        const startButton = this.add.text(400, 300, 'Start Game', {
            fontSize: '24px',
            fill: '#00ff00'
        }).setOrigin(0.5).setInteractive();
        
        startButton.on('pointerdown', () => {
            this.scene.start('ColorSelectScene');
        });

        // Settings button
        const settingsButton = this.add.text(400, 350, 'Settings', {
            fontSize: '24px',
            fill: '#ffff00'
        }).setOrigin(0.5).setInteractive();
        
        settingsButton.on('pointerdown', () => {
            this.scene.start('SettingsScene');
        });

        // Exit Game button
        const exitButton = this.add.text(400, 400, 'Exit Game', {
            fontSize: '24px',
            fill: '#ff0000'
        }).setOrigin(0.5).setInteractive();
        
        exitButton.on('pointerdown', () => {
            if (typeof require !== 'undefined') {
                const { remote } = require('electron');
                remote.getCurrentWindow().close();
            }
        });
    }
}

class ColorSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ColorSelectScene' });
    }

    create() {
        // Title
        this.add.text(400, 150, 'Choose Your Color', {
            fontSize: '36px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const colors = [
            { name: 'Red', hex: '#ff0000' },
            { name: 'Orange', hex: '#ff8800' },
            { name: 'Yellow', hex: '#ffff00' },
            { name: 'Green', hex: '#00ff00' },
            { name: 'Blue', hex: '#0088ff' },
            { name: 'Purple', hex: '#8800ff' }
        ];

        colors.forEach((color, index) => {
            const x = 200 + (index % 3) * 200;
            const y = 250 + Math.floor(index / 3) * 100;
            
            const colorButton = this.add.text(x, y, color.name, {
                fontSize: '24px',
                fill: color.hex
            }).setOrigin(0.5).setInteractive();
            
            colorButton.on('pointerdown', () => {
                this.registry.set('selectedColor', color.hex);
                // Show loading text
                this.add.text(400, 450, 'Loading...', {
                    fontSize: '18px',
                    fill: '#ffffff'
                }).setOrigin(0.5);
                
                // Start game after brief delay
                this.time.delayedCall(1000, () => {
                    this.scene.start('GameScene');
                });
            });
        });
    }
}

class SettingsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SettingsScene' });
    }

    create() {
        // Title
        this.add.text(400, 200, 'Settings', {
            fontSize: '48px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Back button
        const backButton = this.add.text(400, 350, 'Back to Menu', {
            fontSize: '24px',
            fill: '#00ff00'
        }).setOrigin(0.5).setInteractive();
        
        backButton.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.gridSize = 20;
        this.snake = [];
        this.food = {};
        this.direction = { x: 1, y: 0 };
        this.previousDirection = { x: 1, y: 0 };
        this.trailSegments = [];
        this.score = 0;
        this.gameOver = false;
        this.isPaused = false;
        this.gameStarted = false;
        this.baseSpeed = 150;
        this.speedBoost = false;
        this.invincible = false;
        this.staticTrailSprites = [];
        this.lastTrailLength = 0;
        this.trailRenderTexture = null;
        this.trailSpritePool = [];
        this.maxTrailLength = 300;
    }

    preload() {
        // Load color sprite sheets
        this.load.spritesheet('red_sheet', 'assets/images/Sprite Sheets/Red_Sheet.png', {
            frameWidth: 28,
            frameHeight: 28
        });
        this.load.spritesheet('orange_sheet', 'assets/images/Sprite Sheets/Orange_Sheet.png', {
            frameWidth: 28,
            frameHeight: 28
        });
        this.load.spritesheet('yellow_sheet', 'assets/images/Sprite Sheets/Yellow_Sheet.png', {
            frameWidth: 28,
            frameHeight: 28
        });
        this.load.spritesheet('green_sheet', 'assets/images/Sprite Sheets/Green_Sheet.png', {
            frameWidth: 28,
            frameHeight: 28
        });
        this.load.spritesheet('blue_sheet', 'assets/images/Sprite Sheets/Blue_Sheet.png', {
            frameWidth: 28,
            frameHeight: 28
        });
        this.load.spritesheet('purple_sheet', 'assets/images/Sprite Sheets/Purple_Sheet.png', {
            frameWidth: 28,
            frameHeight: 28
        });
    }

    create() {
        // Get selected car based on color
        const selectedColor = this.registry.get('selectedColor') || '#ff8800';
        const colorSheetMap = {
            '#ff0000': 'red_sheet',
            '#ff8800': 'orange_sheet', 
            '#ffff00': 'yellow_sheet',
            '#00ff00': 'green_sheet',
            '#0088ff': 'blue_sheet',
            '#8800ff': 'purple_sheet'
        };
        this.selectedSheet = colorSheetMap[selectedColor] || 'orange_sheet';
        // Frame indices: 0-3=car, 4-7=corners, 8-9=trails
        this.carFrames = { up: 0, right: 1, down: 2, left: 3 };
        this.cornerFrames = {
            rightUp: 4, downLeft: 4,    // right>up or down>left
            downRight: 5, leftUp: 5,    // down>right or left>up  
            upRight: 6, leftDown: 6,    // up>right or left>down
            rightDown: 7, upLeft: 7     // right>down or up>left
        };
        this.trailFrames = { horizontal: 8, vertical: 9 };

        // Initialize snake
        this.snake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];
        
        // Initialize trail segments with directions
        this.trailSegments = [
            { x: 9, y: 10, direction: { x: 1, y: 0 }, isCorner: false },
            { x: 8, y: 10, direction: { x: 1, y: 0 }, isCorner: false }
        ];



        // Create food
        this.spawnFood();

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

        // Score text
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '18px',
            fill: '#ffffff'
        });

        // Show countdown
        this.add.text(400, 300, 'Get Ready!', {
            fontSize: '32px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        let countdown = 3;
        const countdownText = this.add.text(400, 350, countdown.toString(), {
            fontSize: '48px',
            fill: '#ffff00'
        }).setOrigin(0.5);
        
        const countdownTimer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                countdown--;
                if (countdown > 0) {
                    countdownText.setText(countdown.toString());
                } else {
                    countdownText.setText('GO!');
                    this.time.delayedCall(500, () => {
                        this.children.removeAll();
                        this.scoreText = this.add.text(16, 16, 'Score: 0', {
                            fontSize: '18px',
                            fill: '#ffffff'
                        });


                        
                        this.gameStarted = true;
                        this.drawGame();
                        
                        // Start game loop
                        this.gameTimer = this.time.addEvent({
                            delay: this.baseSpeed,
                            callback: this.updateSnake,
                            callbackScope: this,
                            loop: true
                        });
                    });
                }
            },
            repeat: 3
        });
    }

    update() {
        if (this.gameOver) {
            if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
                this.restartGame();
            }
            return;
        }

        // Handle pause
        if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
            this.togglePause();
        }

        if (this.isPaused) return;

        // Handle input
        if (Phaser.Input.Keyboard.JustDown(this.cursors.left) && this.direction.x !== 1) {
            this.previousDirection = { ...this.direction };
            this.direction = { x: -1, y: 0 };
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right) && this.direction.x !== -1) {
            this.previousDirection = { ...this.direction };
            this.direction = { x: 1, y: 0 };
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.up) && this.direction.y !== 1) {
            this.previousDirection = { ...this.direction };
            this.direction = { x: 0, y: -1 };
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down) && this.direction.y !== -1) {
            this.previousDirection = { ...this.direction };
            this.direction = { x: 0, y: 1 };
        }
    }

    updateSnake() {
        if (this.gameOver || this.isPaused || !this.gameStarted) return;

        const head = { ...this.snake[0] };
        head.x += this.direction.x;
        head.y += this.direction.y;

        // Check wall collision
        if (head.x < 0 || head.x >= 40 || head.y < 0 || head.y >= 30) {
            this.endGame();
            return;
        }

        // Check self collision (unless invincible)
        if (!this.invincible && this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.endGame();
            return;
        }

        this.snake.unshift(head);
        
        // Add new trail segment
        if (this.snake.length > 1) {
            const prevHead = this.snake[1];
            
            // Check if this is a direction change
            const lastSegmentDirection = this.trailSegments.length > 0 ? this.trailSegments[0].direction : { x: 1, y: 0 };
            const isDirectionChange = this.direction.x !== lastSegmentDirection.x || this.direction.y !== lastSegmentDirection.y;
            
            if (isDirectionChange) {
                // Create corner piece as first segment after turn
                this.trailSegments.unshift({ 
                    x: prevHead.x, 
                    y: prevHead.y, 
                    direction: { ...this.direction },
                    isCorner: true,
                    cornerFrom: { ...lastSegmentDirection },
                    cornerTo: { ...this.direction }
                });
            } else {
                // Create regular trail piece
                this.trailSegments.unshift({ 
                    x: prevHead.x, 
                    y: prevHead.y, 
                    direction: { ...this.direction },
                    isCorner: false
                });
            }
        }

        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            if (this.food.type === 'red') {
                this.score += 10;
            } else if (this.food.type === 'lightblue') {
                this.score += 15;
                this.activateSpeedBoost();
            } else if (this.food.type === 'white') {
                this.score += 20;
                this.activateInvincibility();
            }
            this.scoreText.setText('Score: ' + this.score);
            this.spawnFood();
        } else {
            this.snake.pop();
            this.trailSegments.pop();
        }

        this.drawGame();
    }

    spawnFood() {
        do {
            const rand = Math.random();
            let foodType;
            if (rand < 0.70) foodType = 'red';
            else if (rand < 0.95) foodType = 'lightblue';
            else foodType = 'white';
            
            this.food = {
                x: Phaser.Math.Between(0, 39),
                y: Phaser.Math.Between(0, 29),
                type: foodType
            };
        } while (this.snake.some(segment => segment.x === this.food.x && segment.y === this.food.y));
    }

    drawGame() {
        // Clear graphics
        if (this.graphics) this.graphics.destroy();
        this.graphics = this.add.graphics();
        
        // Clear previous car sprites
        if (this.carSprites) {
            this.carSprites.forEach(sprite => sprite.destroy());
        }
        this.carSprites = [];
        
        // Create sprite pool if needed
        if (this.trailSpritePool.length === 0) {
            for (let i = 0; i < this.maxTrailLength; i++) {
                const sprite = this.add.image(-50, -50, this.selectedSheet, 8)
                    .setDisplaySize(this.gridSize, this.gridSize);
                this.trailSpritePool.push(sprite);
            }
        }
        
        // Hide all trail sprites first
        this.trailSpritePool.forEach(sprite => sprite.setPosition(-50, -50));
        
        // Draw car head
        const head = this.snake[0];
        const carSprite = this.add.image(
            head.x * this.gridSize + this.gridSize / 2,
            head.y * this.gridSize + this.gridSize / 2,
            this.selectedSheet,
            this.carFrame
        ).setDisplaySize(this.gridSize, this.gridSize);
        
        this.carSprites.push(carSprite);
        
        // Set car frame based on direction
        let carFrame;
        if (this.direction.x === 1) carFrame = this.carFrames.right;
        else if (this.direction.x === -1) carFrame = this.carFrames.left;
        else if (this.direction.y === -1) carFrame = this.carFrames.up;
        else if (this.direction.y === 1) carFrame = this.carFrames.down;
        carSprite.setFrame(carFrame);
        
        // Update trail sprites from pool
        this.trailSegments.forEach((segment, index) => {
            if (index < this.maxTrailLength) {
                const sprite = this.trailSpritePool[index];
                let frame;
                if (segment.isCorner) {
                    const from = segment.cornerFrom;
                    const to = segment.cornerTo;
                    if (from.x === 1 && to.y === -1) frame = this.cornerFrames.rightUp;
                    else if (from.y === 1 && to.x === 1) frame = this.cornerFrames.downRight;
                    else if (from.x === -1 && to.y === 1) frame = this.cornerFrames.leftDown;
                    else if (from.y === -1 && to.x === -1) frame = this.cornerFrames.upLeft;
                    else if (from.y === 1 && to.x === -1) frame = this.cornerFrames.downLeft;
                    else if (from.x === -1 && to.y === -1) frame = this.cornerFrames.leftUp;
                    else if (from.y === -1 && to.x === 1) frame = this.cornerFrames.upRight;
                    else frame = this.cornerFrames.rightDown;
                } else {
                    frame = (segment.direction.x !== 0) ? this.trailFrames.horizontal : this.trailFrames.vertical;
                }
                
                sprite.setFrame(frame).setPosition(
                    segment.x * this.gridSize + this.gridSize / 2,
                    segment.y * this.gridSize + this.gridSize / 2
                );
            }
        });

        // Draw food
        let foodColor;
        if (this.food.type === 'red') foodColor = 0xff0000;
        else if (this.food.type === 'lightblue') foodColor = 0x87ceeb;
        else if (this.food.type === 'white') foodColor = 0xffffff;
        
        this.graphics.fillStyle(foodColor);
        this.graphics.fillRect(
            this.food.x * this.gridSize,
            this.food.y * this.gridSize,
            this.gridSize - 1,
            this.gridSize - 1
        );
    }

    endGame() {
        this.gameOver = true;
        this.add.text(400, 300, 'Game Over!', {
            fontSize: '32px',
            fill: '#ff0000'
        }).setOrigin(0.5);
        
        this.add.text(400, 350, 'Press ENTER to restart', {
            fontSize: '16px',
            fill: '#ffffff'
        }).setOrigin(0.5);
    }

    restartGame() {
        // Stop current timer
        if (this.gameTimer) this.gameTimer.destroy();
        
        // Reset game state
        this.snake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];
        this.direction = { x: 1, y: 0 };
        this.previousDirection = { x: 1, y: 0 };
        this.trailSegments = [];
        this.score = 0;
        this.gameOver = false;
        this.isPaused = false;
        this.gameStarted = false;
        this.baseSpeed = 150;
        this.speedBoost = false;
        this.invincible = false;
        this.staticTrailSprites = [];
        this.lastTrailLength = 0;
        this.trailSpritePool = [];
        
        // Clear everything and restart scene
        this.scene.restart();
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.add.text(400, 250, 'PAUSED', {
                fontSize: '32px',
                fill: '#ffff00'
            }).setOrigin(0.5);
            this.add.text(400, 290, 'Press ESC to resume', {
                fontSize: '16px',
                fill: '#ffffff'
            }).setOrigin(0.5);
        } else {
            // Remove only pause text, preserve sprites
            this.children.list.forEach(child => {
                if (child.type === 'Text' && (child.text === 'PAUSED' || child.text === 'Press ESC to resume')) {
                    child.destroy();
                }
            });
        }
    }

    activateSpeedBoost() {
        if (this.speedBoost) return; // Don't stack boosts
        
        this.speedBoost = true;
        const boostedSpeed = Math.round(this.baseSpeed * 0.85); // 15% faster
        
        // Update game timer speed
        this.gameTimer.delay = boostedSpeed;
        
        // Remove boost after 5 seconds
        this.time.delayedCall(5000, () => {
            this.speedBoost = false;
            this.gameTimer.delay = this.baseSpeed;
        });
    }

    activateInvincibility() {
        this.invincible = true;
        
        // Remove invincibility after 5 seconds
        this.time.delayedCall(5000, () => {
            this.invincible = false;
        });
    }
}

// Game configuration
const config = {
    type: Phaser.WEBGL,
    width: 800,
    height: 600,
    backgroundColor: '#2c3e50',
    render: {
        batchSize: 4096,
        maxTextures: 32,
        antialias: false,
        roundPixels: true,
        powerPreference: 'high-performance'
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: [MenuScene, ColorSelectScene, SettingsScene, GameScene]
};

// Start the game
const game = new Phaser.Game(config);