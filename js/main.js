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

const colorList = ["orange", "blue", "green", "purple"];

const player = {
    x: 100,
    y: 0,
    width: 30,
    height: 40,
    speed: 2,
    dx: 0,
    dy: 0,
    gravity: 1,
    jump_force: 24,
    onGround: true,
    blockColor: "white"
};

const camera = {
    x: 0,
    y: 0
};

const hitboxOffsetX = 15;
const hitboxWidth = player.width - 2 * hitboxOffsetX;

const hitbox = {
    x: player.x + hitboxOffsetX,
    y: player.y,
    width: hitboxWidth,
    height: player.height
};

const keys = {};



document.addEventListener("keydown", (e) => {
    keys[e.key] = true;
});

document.addEventListener("keyup", (e) => {
    keys[e.key] = false;
});



function update() {

    previousY = player.y;
    previousX = player.x;

    if (keys["ArrowRight"]) {
        player.dx = player.speed;
    } else if (keys["ArrowLeft"]) {
        player.dx = -player.speed;
    } else {
        player.dx = 0;
    }

    //Gravedad
    player.dy += player.gravity;

    //Mover
    player.y += player.dy;
    player.x += player.dx;



    //Limites horizontales
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > worldWidth)
        player.x = worldWidth - player.width;

    //Ground reset
    player.onGround = false;

    //Colisiones
    platforms.forEach(platform => {
        if (platform.collision.type === "solid") {

            const isVerticallyColliding =
                player.y < platform.y + platform.height &&
                player.y + player.height > platform.y;

            const isHorizontallyColliding =
                player.x < platform.x + platform.width &&
                player.x + player.width > platform.x;

            if (isVerticallyColliding) {
                if (
                    player.dx >= 0 &&
                    previousX + player.width >= platform.x &&
                    previousX + player.width - player.dx < platform.x
                ) {
                    player.dx = 0
                    player.x = platform.x - player.width;
                }
                if (
                    player.dx <= 0 &&
                    previousX <= platform.x + platform.width &&
                    previousX - player.dx > platform.x + platform.width
                ) {
                    player.dx = 0
                    player.x = platform.x + platform.width;
                }
            }


            if (isHorizontallyColliding) {
                if (
                    player.dy >= 0 &&
                    previousY + player.height >= platform.y &&
                    previousY + player.height - player.dy < platform.y
                ) {
                    player.y = platform.y - player.height;
                    player.dy = 0;
                    player.onGround = true;
                }
                if (
                    player.dy <= 0 &&
                    player.y <= platform.y + platform.height &&
                    player.y - player.dy > platform.y + platform.height
                ) {
                    if (platform.x + platform.width -player.x  <= player.width*0.25) {
                        player.x = platform.x + platform.width;
                        return;
                    }
                    if (player.x + player.width - platform.x <= player.width*0.25){
                        player.x = platform.x - player.width;
                        return;
                    }
                    player.y = platform.y + platform.height;
                    player.dy = 0;
                }
            }
        }

    });
    //Salto (Solo si está en el suelo)
    if (keys["ArrowUp"] && player.onGround) {
        player.dy = -player.jump_force;
        player.onGround = false;
    }

    //Actualizacion de la posicion de la camara
    camera.x = Math.max(
        0,
        Math.min(worldWidth - canvas.width, player.x - canvas.width / 2)
    );
}
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = player.blockColor;
    ctx.fillRect(
        player.x - camera.x,
        player.y - camera.y,
        player.width,
        player.height
    );

    ctx.fillStyle = "blue";
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