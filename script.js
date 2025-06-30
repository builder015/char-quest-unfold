
class AnimalRunGame {
    constructor() {
        this.gameScreen = document.getElementById('gameScreen');
        this.character = document.getElementById('character');
        this.currentLevel = 1;
        this.maxLevel = 3;
        this.score = 0;
        this.lives = 3;
        this.activeCharacter = 'dino';
        this.isJumping = false;
        this.isGameRunning = true;
        this.isPaused = false;
        this.obstacles = [];
        this.coins = [];
        this.gameSpeed = 2000;
        this.obstacleTimer = null;
        this.coinTimer = null;
        
        this.characters = {
            dino: '🦕',
            tiger: '🐅',
            dog: '🐕'
        };
        
        this.obstacleTypes = ['🌵', '🪨', '🔥'];
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.startLevel();
        this.gameLoop();
    }

    bindEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.key === ' ') {
                e.preventDefault();
                this.jump();
            }
            if (e.key === 'p' || e.key === 'P') {
                this.togglePause();
            }
        });

        document.addEventListener('click', (e) => {
            if (!e.target.classList.contains('char-btn') && 
                !e.target.classList.contains('restart-btn') &&
                !e.target.classList.contains('pause-btn')) {
                this.jump();
            }
        });

        document.querySelectorAll('.char-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchCharacter(btn.dataset.char);
            });
        });

        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.togglePause();
        });

        let touchStartY = 0;
        document.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
        });

        document.addEventListener('touchend', (e) => {
            const touchEndY = e.changedTouches[0].clientY;
            const deltaY = touchStartY - touchEndY;
            
            if (deltaY > 30) {
                this.jump();
            }
        });
    }

    jump() {
        if (!this.isJumping && this.isGameRunning && !this.isPaused) {
            this.isJumping = true;
            this.character.classList.add('jumping');
            
            setTimeout(() => {
                this.character.classList.remove('jumping');
                this.isJumping = false;
            }, 600);
        }
    }

    switchCharacter(characterType) {
        if (this.activeCharacter === characterType) return;
        
        this.activeCharacter = characterType;
        this.character.textContent = this.characters[characterType];
        
        document.querySelectorAll('.char-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.char === characterType);
        });
    }

    startLevel() {
        this.clearGameElements();
        
        document.getElementById('currentLevel').textContent = this.currentLevel;
        
        this.showLevelTransition();
        
        this.gameScreen.className = `game-screen level-${this.currentLevel}`;
        
        this.gameSpeed = Math.max(800, 2000 - (this.currentLevel - 1) * 400);
        
        setTimeout(() => {
            if (this.isGameRunning) {
                this.startObstacleSpawning();
                this.startCoinSpawning();
            }
        }, 2000);
    }

    showLevelTransition() {
        const transition = document.getElementById('levelTransition');
        transition.textContent = `LEVEL ${this.currentLevel}`;
        transition.classList.add('show');
        
        setTimeout(() => {
            transition.classList.remove('show');
        }, 2000);
    }

    startObstacleSpawning() {
        if (this.obstacleTimer) {
            clearInterval(this.obstacleTimer);
        }
        
        this.obstacleTimer = setInterval(() => {
            if (this.isGameRunning && !this.isPaused) {
                this.spawnObstacle();
            }
        }, this.gameSpeed);
    }

    startCoinSpawning() {
        if (this.coinTimer) {
            clearInterval(this.coinTimer);
        }
        
        this.coinTimer = setInterval(() => {
            if (this.isGameRunning && !this.isPaused) {
                this.spawnCoin();
            }
        }, this.gameSpeed * 1.5);
    }

    spawnObstacle() {
        const obstacle = document.createElement('div');
        obstacle.className = `obstacle ${this.currentLevel > 2 ? 'super-fast-obstacle' : this.currentLevel > 1 ? 'fast-obstacle' : ''}`;
        obstacle.textContent = this.obstacleTypes[Math.floor(Math.random() * this.obstacleTypes.length)];
        obstacle.style.right = '-50px';
        
        this.gameScreen.appendChild(obstacle);
        this.obstacles.push(obstacle);
        
        setTimeout(() => {
            if (obstacle && obstacle.parentNode) {
                obstacle.remove();
                this.obstacles = this.obstacles.filter(obs => obs !== obstacle);
            }
        }, this.currentLevel > 2 ? 1000 : this.currentLevel > 1 ? 1500 : 2000);
    }

    spawnCoin() {
        if (Math.random() < 0.7) {
            const coin = document.createElement('div');
            coin.className = 'coin';
            coin.textContent = '🪙';
            coin.style.right = '-30px';
            
            this.gameScreen.appendChild(coin);
            this.coins.push(coin);
            
            setTimeout(() => {
                if (coin && coin.parentNode) {
                    coin.remove();
                    this.coins = this.coins.filter(c => c !== coin);
                }
            }, 2000);
        }
    }

    checkCollisions() {
        const charRect = this.character.getBoundingClientRect();
        
        this.obstacles.forEach((obstacle, index) => {
            const obstacleRect = obstacle.getBoundingClientRect();
            
            if (this.isColliding(charRect, obstacleRect)) {
                this.hitObstacle();
                obstacle.remove();
                this.obstacles.splice(index, 1);
            }
        });
        
        this.coins.forEach((coin, index) => {
            const coinRect = coin.getBoundingClientRect();
            
            if (this.isColliding(charRect, coinRect)) {
                this.collectCoin();
                coin.remove();
                this.coins.splice(index, 1);
            }
        });
    }

    isColliding(rect1, rect2) {
        return !(rect1.right < rect2.left || 
                rect1.left > rect2.right || 
                rect1.bottom < rect2.top || 
                rect1.top > rect2.bottom);
    }

    hitObstacle() {
        this.lives--;
        document.getElementById('lives').textContent = this.lives;
        
        this.character.style.filter = 'hue-rotate(0deg) saturate(2) brightness(1.5)';
        setTimeout(() => {
            this.character.style.filter = 'none';
        }, 200);
        
        if (this.lives <= 0) {
            this.gameOver();
        }
    }

    collectCoin() {
        this.score += 10 * this.currentLevel;
        document.getElementById('score').textContent = this.score;
        
        this.character.style.filter = 'hue-rotate(45deg) saturate(2) brightness(1.5)';
        setTimeout(() => {
            this.character.style.filter = 'none';
        }, 200);
        
        if (this.score >= this.currentLevel * 50 && this.currentLevel < this.maxLevel) {
            this.nextLevel();
        }
    }

    nextLevel() {
        this.currentLevel++;
        this.clearGameElements();
        this.startLevel();
    }

    clearGameElements() {
        if (this.obstacleTimer) {
            clearInterval(this.obstacleTimer);
        }
        if (this.coinTimer) {
            clearInterval(this.coinTimer);
        }
        
        this.obstacles.forEach(obstacle => obstacle.remove());
        this.coins.forEach(coin => coin.remove());
        this.obstacles = [];
        this.coins = [];
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseBtn = document.getElementById('pauseBtn');
        pauseBtn.textContent = this.isPaused ? '▶️ RESUME' : '⏸️ PAUSE';
    }

    gameOver() {
        this.isGameRunning = false;
        this.clearGameElements();
        
        const gameOverScreen = document.getElementById('gameOverScreen');
        const gameOverText = document.getElementById('gameOverText');
        const finalScore = document.getElementById('finalScore');
        
        if (this.currentLevel >= this.maxLevel && this.score >= this.maxLevel * 50) {
            gameOverText.textContent = '🎉 YOU WIN! 🎉';
        } else {
            gameOverText.textContent = '💥 GAME OVER 💥';
        }
        
        finalScore.textContent = `Final Score: ${this.score}`;
        gameOverScreen.classList.add('show');
    }

    restart() {
        this.currentLevel = 1;
        this.score = 0;
        this.lives = 3;
        this.isGameRunning = true;
        this.isPaused = false;
        this.isJumping = false;
        
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('gameOverScreen').classList.remove('show');
        document.getElementById('pauseBtn').textContent = '⏸️ PAUSE';
        
        this.character.classList.remove('jumping');
        
        this.startLevel();
    }

    gameLoop() {
        if (this.isGameRunning && !this.isPaused) {
            this.checkCollisions();
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

let game;

function restartGame() {
    if (game) {
        game.restart();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    game = new AnimalRunGame();
});
