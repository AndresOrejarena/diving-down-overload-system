const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const player = {
    x: 100,
    y: canvas.height - 100,
    width: 50,
    height: 50,
    speed: 5,
    dx: 0
};

const keys = {};

document.addEventListener("keydown", (e) => {
    keys[e.key] = true;
});

document.addEventListener("keyup", (e) => {
    keys[e.key] = false;
});

function update() {
    // Movimiento horizontal
    if (keys["ArrowRight"]) {
        player.dx = player.speed;
    } else if (keys["ArrowLeft"]) {
        player.dx = -player.speed;
    } else {
        player.dx = 0;
    }

    player.x += player.dx;

    // Limites de pantalla
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width)
        player.x = canvas.width - player.width;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Piso
    ctx.fillStyle = "white";
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);

    // Jugador
    ctx.fillStyle = "cyan";
    ctx.fillRect(player.x, player.y, player.width, player.height);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
