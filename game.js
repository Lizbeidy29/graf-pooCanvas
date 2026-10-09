
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ========================================
// CLASE BALL (PELOTA)
// ========================================
class Ball {
    constructor(x, y, radius, speedX, speedY, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.speedX = speedX;
        this.speedY = speedY;
        this.color = color;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

    move() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Rebote en los bordes superior e inferior
        if (this.y - this.radius <= 0) {
            this.y = this.radius;
            this.speedY = Math.abs(this.speedY);
        }

        if (this.y + this.radius >= canvas.height) {
            this.y = canvas.height - this.radius;
            this.speedY = -Math.abs(this.speedY);
        }
    }

    reset() {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;

        // Cambiar dirección horizontal al reiniciar
        this.speedX = -this.speedX;
    }
}

// ========================================
// CLASE PADDLE (PALETA)
// ========================================
class Paddle {
    constructor(
        x, y, width, height, color,
        isPlayerControlled = false
    ) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.isPlayerControlled = isPlayerControlled;
        this.speed = 5;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(
            this.x,
            this.y,
            this.width,
            this.height
        );
    }

    move(direction) {
        if (direction === "up") {
            this.y -= this.speed;
        } else if (direction === "down") {
            this.y += this.speed;
        }

        // Mantener la paleta dentro del canvas
        this.y = Math.max(
            0,
            Math.min(
                this.y,
                canvas.height - this.height
            )
        );
    }

    // La computadora intenta interceptar la pelota

autoMove(targetY) {
    const center = this.y + this.height / 2;

    // Moverse continuamente hacia la posición objetivo
    if (center < targetY) {
        this.move("down");
    } else if (center > targetY) {
        this.move("up");
    }
}

}

// ========================================
// CLASE GAME (CONTROLA EL JUEGO)
// ========================================
class Game {
    constructor() {
        // Cinco pelotas de diferentes tamaños,
        // colores y velocidades
        this.balls = [
            new Ball(300, 100, 8, 3, 2, "#FF1744"),
            new Ball(400, 200, 12, -4, 3, "#FFD600"),
            new Ball(500, 300, 16, 4, -3, "#00E5FF"),
            new Ball(350, 400, 10, -5, -2, "#76FF03"),
            new Ball(450, 500, 6, 5, 4, "#AA00FF")
        ];

        // Paleta del jugador: 200 px de alto
        // La altura original era de 100 px
        this.paddle1 = new Paddle(
            15,
            200,
            12,
            200,
            "#00FFFF",
            true
        );

       
 // Paleta de la computadora: cubre toda la altura

this.paddle2 = new Paddle(
    canvas.width - 27,
    225,
    12,
    150,
    "#FF1493"
);

// Computadora más rápida
this.paddle2.speed = 12;


        this.keys = {};
    }

    draw() {
        // Limpiar el canvas conservando el fondo CSS rosa
        ctx.clearRect(
            0, 0, canvas.width, canvas.height
        );

        // Dibujar las cinco pelotas
        this.balls.forEach(ball => ball.draw());

        // Dibujar las dos paletas
        this.paddle1.draw();
        this.paddle2.draw();

        // Línea central decorativa
        ctx.beginPath();
        ctx.setLineDash([10, 10]);
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.strokeStyle = "rgba(255,255,255,0.7)";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.setLineDash([]);
    }

    update() {
        // Movimiento de la paleta del jugador
        if (this.keys["ArrowUp"]) {
            this.paddle1.move("up");
        }

        if (this.keys["ArrowDown"]) {
            this.paddle1.move("down");
        }

        // Actualizar todas las pelotas
        this.balls.forEach(ball => {
            ball.move();

            // Colisión con la paleta del jugador
            if (
                ball.speedX < 0 &&
                ball.x - ball.radius <=
                    this.paddle1.x + this.paddle1.width &&
                ball.x + ball.radius >= this.paddle1.x &&
                ball.y + ball.radius >= this.paddle1.y &&
                ball.y - ball.radius <=
                    this.paddle1.y + this.paddle1.height
            ) {
                // Evitar que la pelota se quede dentro
                ball.x =
                    this.paddle1.x +
                    this.paddle1.width +
                    ball.radius;

                ball.speedX = Math.abs(ball.speedX);
            }

            // Colisión con la paleta de la computadora
            if (
                ball.speedX > 0 &&
                ball.x + ball.radius >= this.paddle2.x &&
                ball.x - ball.radius <=
                    this.paddle2.x + this.paddle2.width &&
                ball.y + ball.radius >= this.paddle2.y &&
                ball.y - ball.radius <=
                    this.paddle2.y + this.paddle2.height
            ) {
                // Rebote hacia la izquierda
                ball.x = this.paddle2.x - ball.radius;
                ball.speedX = -Math.abs(ball.speedX);
            }

            // Reiniciar las pelotas que salen lateralmente
            if (
                ball.x + ball.radius < 0 ||
                ball.x - ball.radius > canvas.width
            ) {
                ball.reset();
            }
        });

      
        // Buscar la pelota que llegará primero
        // al lado de la computadora
        let targetBall = null;
        let shortestTime = Infinity;

        this.balls.forEach(ball => {
            if (ball.speedX > 0) {
                const distance =
                    this.paddle2.x - ball.radius - ball.x;

                const time = distance / ball.speedX;

                if (time >= 0 && time < shortestTime) {
                    shortestTime = time;
                    targetBall = ball;
                }
            }
        });

        // Predecir la posición vertical de la pelota
        if (targetBall !== null) {
            const ball = targetBall;
            const height = canvas.height;
            const period = 2 * height;

            const futureY =
                ball.y + ball.speedY * shortestTime;

            // Considerar los rebotes en los bordes
            const foldedY =
                ((futureY % period) + period) % period;

            const predictedY =
                foldedY <= height
                    ? foldedY
                    : period - foldedY;

            // Limitar el objetivo para que la paleta
            // permanezca dentro del canvas
            const targetCenter = Math.max(
                this.paddle2.height / 2,
                Math.min(
                    predictedY,
                    height - this.paddle2.height / 2
                )
            );

            // La computadora se mueve hacia la pelota
            this.paddle2.autoMove(targetCenter);
        }

        // Calcular la posición vertical prevista
        if (targetBall !== null) {
            const ball = targetBall;

            const futureY =
                ball.y + ball.speedY * shortestTime;

            // Predecir los rebotes en los bordes verticales
            const height = canvas.height;
            const period = height * 2;

            const foldedY =
                ((futureY % period) + period) % period;

            const predictedY =
                foldedY <= height
                    ? foldedY
                    : period - foldedY;

            // Centrar la paleta en la trayectoria
            const targetCenter = Math.max(
                this.paddle2.height / 2,
                Math.min(
                    predictedY,
                    height - this.paddle2.height / 2
                )
            );

            this.paddle2.autoMove(targetCenter);
        }
    }

    // Capturar las teclas
    handleInput() {
        window.addEventListener("keydown", event => {
            if (
                event.key === "ArrowUp" ||
                event.key === "ArrowDown"
            ) {
                event.preventDefault();
            }

            this.keys[event.key] = true;
        });

        window.addEventListener("keyup", event => {
            this.keys[event.key] = false;
        });
    }

    // Ejecutar la animación
    run() {
        this.handleInput();

        const gameLoop = () => {
            this.update();
            this.draw();

            requestAnimationFrame(gameLoop);
        };

        gameLoop();
    }
}

// Crear y ejecutar el juego
const game = new Game();
game.run();
