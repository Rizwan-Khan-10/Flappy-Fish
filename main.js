class Game {
    constructor(canvas, context) {
        this.canvas = canvas;
        this.context = context;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.baseHeight = 720;
        this.ratio = this.height / this.baseHeight;
        this.background = new Background(this);
        this.player = new Player(this);
        this.sound = new Audio();
        this.obstacles = [];
        this.numberOfObstacles = 20;
        this.gravity;
        this.speed;
        this.minSpeed;
        this.maxSpeed;
        this.score;
        this.bottomMargin;
        this.gameOver;
        this.timer;
        this.message1;
        this.message2;
        this.smallFont;
        this.largeFont;
        this.debug = false;
        this.eventTimer = 0;
        this.eventInterval = 150;
        this.eventUpdate = false;
        this.touchStartX;
        this.swipeDistance = 50;
        this.resize(window.innerWidth, window.innerHeight);

        window.addEventListener("resize", e => {
            this.resize(e.currentTarget.innerWidth, e.currentTarget.innerHeight);
        });

        this.canvas, addEventListener("mousedown", e => {
            this.player.flap();
        });

        this.canvas, addEventListener("mouseup", e => {
            setTimeout(() => {
                this.player.wingsUp();
            }, 50);
        });

        window.addEventListener("keydown", e => {
            if (e.key === " " || e.key === "Enter") {
                this.player.flap();
            }
            if (e.key === "Shift" || e.key.toLowerCase() === "c") {
                this.player.startCharge();
            }
            if (e.toLowerCase() === "r") {
                this.resize(window.innerWidth, window.innerHeight);
            }
        });

        window.addEventListener("keyup", e => {
            this.player.wingsUp();
        });

        this.canvas.addEventListener("touchstart", e => {
            this.player.flap();
            this.touchStartX = e.changedTouches[0].pageX;
        });

        this.canvas.addEventListener("touchend", e => {
            if (e.changedTouches[0].pageX - this.touchStartX > this.swipeDistance) {
                this.player.startCharge();
            } else {
                this.player.flap();
                setTimeout(() => {
                    this.player.wingsUp();
                }, 100);
            }
        });

        this.canvas.addEventListener("touchmove", e => {
            e.preventDefault();
        });
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.context.fillStyle = "white";
        this.context.textAlign = "right";
        this.context.lineWidth = 1;
        this.context.strokeStyle = "white";
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.ratio = this.height / this.baseHeight;
        this.bottomMargin = Math.floor(50 * this.ratio);
        this.smallFont = Math.ceil(20 * this.ratio);
        this.largeFont = Math.ceil(45 * this.ratio);
        this.context.font = this.smallFont + "x Arial";
        this.gravity = 0.15 * this.ratio;
        this.speed = 2 * this.ratio;
        this.minSpeed = this.speed;
        this.maxSpeed = this.speed * 5;
        this.player.resize();
        this.background.resize();
        this.createObstacles();
        this.obstacles.forEach(obstacle => {
            obstacle.resize();
        });
        this.score = 0;
        this.gameOver = false;
        this.timer = 0;
    }

    render(deltaTime) {
        if (!this.gameOver) {
            this.timer += deltaTime;
        }
        this.handlePeriodicEvents(deltaTime);
        this.background.update();
        this.background.draw();
        this.drawStatusText();
        this.player.update();
        this.player.draw();
        this.obstacles.forEach(obstacle => {
            obstacle.update();
            obstacle.draw();
        });
    }

    createObstacles() {
        this.obstacles = [];
        const firstX = this.baseHeight * this.ratio;
        const obstacleSpacing = 600 * this.ratio;
        for (let i = 0; i < this.numberOfObstacles; i++) {
            this.obstacles.push(new Obstacle(this, firstX + i * obstacleSpacing));
        }
    }

    drawStatusText() {
        this.context.save();
        this.context.fillText("Score: " + this.score, this.width - this.smallFont, this.largeFont);
        this.context.textAlign = "left";
        this.context.fillText("Timer: " + this.formatTimer(), this.smallFont, this.largeFont);
        if (this.gameOver) {
            this.context.textAlign = "center";
            this.context.font = this.largeFont + "px Arial";
            this.context.fillText(this.message1, this.width * 0.5, this.height * 0.5 - this.largeFont, this.width * 0.5);
            this.context.font = this.smallFont + "px Arial";
            this.context.fillText(this.message2, this.width * 0.5, this.height * 0.5 - this.smallFont, this.width * 0.5);
            this.context.fillText("Press 'R' to try again!", this.width * 0.5, this.height * 0.5, this.width * 0.5);
        }
        if (this.player.energy <= this.player.minEnergy) {
            this.context.fillStyle = "red";
        } else if (this.player.energy >= this.player.maxEnergy) {
            this.context.fillStyle = "orangered";
        } else if (this.player.energy > this.player.minEnergy) {
            this.context.fillStyle = "orange";
        }
        for (let i = 0; i < this.player.energy; i++) {
            this.context.fillRect(10, this.height - 10 - this.player.barSize * i, this.player.barSize * 4.5, this.player.barSize);
        }
        this.context.restore();
    }

    formatTimer() {
        return (this.timer * 0.001).toFixed(1);
    }

    checkCollision(a, b) {
        const dx = a.collisionX - b.collisionX;
        const dy = a.collisionY - b.collisionY;
        const distance = Math.hypot(dx, dy);
        const sumOfRadii = a.collisionRadius + b.collisionRadius;
        return distance <= sumOfRadii;
    }

    handlePeriodicEvents(deltaTime) {
        if (this.eventTimer < this.eventInterval) {
            this.eventTimer += deltaTime;
            this.eventUpdate = false;
        } else {
            this.eventTimer = this.eventTimer % this.eventInterval;
            this.eventUpdate = true;
        }
    }

    triggerGameOver() {
        if (!this.gameOver) {
            this.gameOver = true;
            if (this.obstacles.length <= 0) {
                this.sound.play(this.sound.win);
                this.message1 = "Nailed it!";
                this.message2 = "Can you do it faster than " + this.formatTimer() + " seconds!";
            } else {
                this.sound.play(this.sound.lose);
                this.message1 = "Getting rusty?";
                this.message2 = "Collision time " + this.formatTimer() + " seconds!";
            }
        }
    }
}

window.addEventListener("load", () => {
    const canvas = document.getElementById("canvas1");
    const context = canvas.getContext("2d");
    canvas.width = 720;
    canvas.height = 720;

    const game = new Game(canvas, context);

    let lastTime = 0;

    function animate(timeStamp) {
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;
        // context.clearRect(0, 0, canvas.width, canvas.height);
        game.render(deltaTime);
        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
});