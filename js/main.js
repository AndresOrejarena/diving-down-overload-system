const BASE_WIDTH = 1280;
const BASE_HEIGHT = 720;

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");



function resize() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const scale = Math.min(
        windowWidth / BASE_WIDTH,
        windowHeight / BASE_HEIGHT
    );

    const scaledWidth = BASE_WIDTH * scale;
    const scaledHeight = BASE_HEIGHT * scale;

    canvas.width = scaledWidth;
    canvas.height = scaledHeight;

    canvas.style.position = "absolute";
    canvas.style.left = (windowWidth - scaledWidth) / 2 + "px";
    canvas.style.top = (windowHeight - scaledHeight) / 2 + "px";

    ctx.setTransform(scale, 0, 0, scale, 0, 0);
}

window.addEventListener("resize", resize);
resize();


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


let RemoveCroachingHeigh = true;

const player = {
    x: 100,
    y: 0,
    width: 30,
    height: 40,
    speed: 6*60,
    dx: 0,
    dy: 0,
    gravity: 2000,
    jump_force: 1000,
    onGround: true,
    blockColor: "black",
    coyoteTime: 0,
    coyoteDuration: 0.1,
    jumpBuffer: 0,
    jumpBufferDuration: 0.1 ,
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



function update(dt) {

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
    player.dy += player.gravity*dt;

    //Ground reset
    player.onGround = false;

    //Mover
    player.y += player.dy*dt;
    const moveY = player.y - previousY;
    platforms.forEach(platform => {
        if (platform.collision.type === "solid"){
            const isHorizontallyColliding =
                player.x < platform.x + platform.width &&
                player.x + player.width > platform.x;

            if (isHorizontallyColliding) {
                if (
                    moveY > 0 &&
                    previousY + player.height <= platform.y &&
                    player.y + player.height >= platform.y
                ) {
                    player.y = platform.y - player.height;
                    player.dy = 0;
                    player.onGround = true;
                }
                if (
                    moveY < 0 &&
                    previousY >= platform.y + platform.height &&
                    player.y <= platform.y + platform.height
                ) {
                    if (platform.x + platform.width - player.x <= player.width * 0.25) {
                        player.x = platform.x + platform.width;
                        return;
                    }
                    if (player.x + player.width - platform.x <= player.width * 0.25) {
                        player.x = platform.x - player.width;
                        return;
                    }
                    player.y = platform.y + platform.height;
                    player.dy = 0;
                }
            }
        }
    });

    player.x += player.dx*dt;
    const moveX = player.x - previousX;
    platforms.forEach(platform => {
        if (platform.collision.type === "solid") {
            const isVerticallyColliding =
                player.y < platform.y + platform.height &&
                player.y + player.height > platform.y;

            if (isVerticallyColliding) {
                if (
                    moveX > 0 &&
                    previousX + player.width <= platform.x &&
                    player.x + player.width >= platform.x
                ) {
                    player.dx = 0
                    player.x = platform.x - player.width;
                }
                if (
                    moveX < 0 &&
                    previousX >= platform.x + platform.width &&
                    player.x <= platform.x + platform.width
                ) {
                    player.dx = 0
                    player.x = platform.x + platform.width;
                }
            }
        }
    });

    //Limites horizontales
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > worldWidth)
        player.x = worldWidth - player.width;


    //Colisiones
    if (player.onGround && keys["ArrowDown"]) {
        if (RemoveCroachingHeigh) {
            player.height /= 2;
            player.y += player.height;
            RemoveCroachingHeigh = false;
            player.speed /= 2;
        }
    } else if (!keys["ArrowDown"] && player.onGround) {
        if (!RemoveCroachingHeigh) {
            let canGetUp = true;
            const newHeight = player.height * 2;
            const newY = player.y - player.height;

            for (let platform of platforms) {

                if (platform.collision.type !== "solid") continue;

                const wouldCollide =
                    player.x < platform.x + platform.width &&
                    player.x + player.width > platform.x &&
                    newY < platform.y + platform.height &&
                    newY + newHeight > platform.y;

                if (wouldCollide) {
                    canGetUp = false;
                    break;
                }
            }
            if (canGetUp) {
                player.y = newY;
                player.height = newHeight;
                RemoveCroachingHeigh = true;
                player.speed *= 2;
            }
        }
    }


    if (player.onGround) {
        player.coyoteTime = player.coyoteDuration;
    } else {
        player.coyoteTime -= dt;
    }
    if (keys["ArrowUp"]) {
        player.jumpBuffer = player.jumpBufferDuration;
    }

    if (player.jumpBuffer > 0 && player.coyoteTime > 0) {

        player.jumpBuffer = 0;
        player.coyoteTime = 0;
        player.dy = -player.jump_force;
        player.onGround = false;
    }

    player.jumpBuffer = Math.max(player.jumpBuffer - dt, 0);

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
        )
    });
}

let lastTime = 0;

function gameLoop(currentTime) {

    let deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    deltaTime = Math.min(deltaTime, 0.016);
    update(deltaTime);
    draw();

    requestAnimationFrame(gameLoop);
}

window.onload = function () {
    requestAnimationFrame(gameLoop);
};