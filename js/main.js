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
    y: canvas.height - 100,
    width: 50,
    height: 50,
    speed: 5,
    dx: 0,
    dy: 0,
    gravity: 2,
    jump_force: 30,
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
    if (keys["ArrowRight"]) {
        player.dx = player.speed;
    } else if (keys["ArrowLeft"]) {
        player.dx = -player.speed;
    } else {
        player.dx = 0;
    }
    if (keys["ArrowUp"] && player.onGround) {
        player.dy = -player.jump_force;
        player.onGround = false;
    }

    player.dy += player.gravity;

    player.x += player.dx;
    player.y += player.dy;

    if (player.y + player.height >= canvas.height - 50) {
        player.y = canvas.height - 50 - player.height;
        player.dy = 0;
        player.onGround = true;
    }

    if (player.x < 0) player.x = 0;
    if (player.x + player.width > worldWidth)
        player.x = worldWidth - player.width;

    camera.x = Math.max(
        0,
        Math.min(worldWidth - canvas.width, player.x - canvas.width / 2)
    );

    platforms.forEach(platform => {
        if (
            player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y + player.height < platform.y + platform.height &&
            player.y + player.height + player.dy >= platform.y
        ) {
            player.y = platform.y - player.height;
            player.dy = 0;
            player.onGround = true;
        }
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Piso
    ctx.fillStyle = "white";
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);

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

gameLoop();
