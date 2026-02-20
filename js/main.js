const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


const platforms = [];
let worldWidth = 2000;
let worldHeight = 600;

fetch("json/map1.json")
    .then(res => res.json())
    .then(data => {
         worldWidth = data.worldWidth;
         worldHeight = data.worldHeight;
        platforms.push(...data.platforms);
    });


const player = {
    x: 100,
    y: 0,
    width: 50,
    height: 50,
    speed: 5,
    dx: 0,
    dy: 0,
    gravity: 1,
    jump_force: 24,
    onGround: true,
};

const camera = {
    x: 0,
    y: 0
};

const keys = {};



document.addEventListener("keydown", (e) => {
    keys[e.key] = true;
});

document.addEventListener("keyup", (e) => {
    keys[e.key] = false;
});


function update() {

    let previousY = player.y;

    // INPUT HORIZONTAL
    if (keys["ArrowRight"]) {
        player.dx = player.speed;
    } else if (keys["ArrowLeft"]) {
        player.dx = -player.speed;
    } else {
        player.dx = 0;
    }

    // APLICAR GRAVEDAD
    player.dy += player.gravity;

    // MOVER
    player.y += player.dy;
    player.x += player.dx;

    // LIMITES HORIZONTALES
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > worldWidth)
        player.x = worldWidth - player.width;

    // RESET GROUND
    player.onGround = false;

    // COLISIONES
    platforms.forEach(platform => {

        const isHorizontallyColliding =
            player.x < platform.x + platform.width &&
            player.x + player.width > platform.x;

        if (!isHorizontallyColliding) return;

        if (
            player.dy >= 0 &&
            previousY + player.height <= platform.y &&
            player.y + player.height >= platform.y
        ) {
            player.y = platform.y - player.height;
            player.dy = 0;
            player.onGround = true;
        }
    });

    // SALTO (DESPUÉS de saber si está en el suelo)
    if (keys["ArrowUp"] && player.onGround) {
        player.dy = -player.jump_force;
        player.onGround = false;
    }

    camera.x = Math.max(
        0,
        Math.min(worldWidth - canvas.width, player.x - canvas.width / 2)
    );
}
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Jugador
    ctx.fillStyle = "cyan";
    ctx.fillRect(
        player.x - camera.x,
        player.y - camera.y,
        player.width,
        player.height
    );


    platforms.forEach(platform => {
        ctx.fillRect(
            platform.x - camera.x,
            platform.y - camera.y,
            platform.width,
            platform.height
        );
    });
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

window.onload = function() {
    gameLoop();
};