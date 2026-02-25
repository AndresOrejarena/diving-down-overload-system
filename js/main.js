const BASE_WIDTH = 1024;
const BASE_HEIGHT = 576;
const deadZoneWidth = 400;

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;


function resize() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const scale = Math.min(
        windowWidth / BASE_WIDTH,
        windowHeight / BASE_HEIGHT
    );

    const scaledWidth = BASE_WIDTH * scale;
    const scaledHeight = BASE_HEIGHT * scale;

    canvas.width = BASE_WIDTH;
    canvas.height = BASE_HEIGHT;

    canvas.style.position = "absolute";
    canvas.style.width = scaledWidth + "px";
    canvas.style.height = scaledHeight + "px";

    canvas.style.position = "absolute";
    canvas.style.left = (windowWidth - scaledWidth) / 2 + "px";
    canvas.style.top = (windowHeight - scaledHeight) / 2 + "px";}

window.addEventListener("resize", resize);
resize();


const platforms = [];
let worldWidth = 2000;
let worldHeight = 600;
const spritesheet = new Image()
spritesheet.src = "media/html.png";

spritesheet.onload = () => {
    fetch("json/map1.json")
        .then(res => res.json())
        .then(data => {

            worldWidth = data.worldWidth;
            worldHeight = data.worldHeight;
            platforms.push(...data.platforms);
            currentLevel = new Level(data, spritesheet);

            requestAnimationFrame(gameLoop);
        });
};

class Level {
    constructor(data, spritesheet) {
        this.worldWidth = data.worldWidth;
        this.worldHeight = data.worldHeight;
        this.platforms = data.platforms;
        this.tileSize = 20;
        this.spritesheet = spritesheet;

        this.buildStaticCanvas();
    }

    buildStaticCanvas() {
        this.canvas = document.createElement("canvas");
        this.canvas.width = this.worldWidth;
        this.canvas.height = this.worldHeight;

        this.ctx = this.canvas.getContext("2d");
        this.ctx.imageSmoothingEnabled = false;

        this.renderPlatforms();
    }

    drawPlatform(p) {
        const tilesX = Math.ceil(p.width / this.tileSize);
        const tilesY = Math.ceil(p.height / this.tileSize);

        for (let y = 0; y < tilesY; y++) {
            for (let x = 0; x < tilesX; x++) {

                const worldX = p.x + x * this.tileSize;
                const worldY = p.y + y * this.tileSize;

                const sprite = this.getSpriteForPosition(x, y, tilesX, tilesY);

                this.ctx.drawImage(
                    this.spritesheet,
                    sprite.sx,
                    sprite.sy,
                    this.tileSize,
                    this.tileSize,
                    worldX,
                    worldY,
                    this.tileSize,
                    this.tileSize
                );
            }
        }
    }

    renderPlatforms() {
        for (const p of this.platforms) {
            this.drawPlatform(p);
        }
    }

    getSpriteForPosition(x, y, maxX, maxY) {
        if (maxX >= 2 && maxY >= 2) {
            if (x === 0 && y === 0) return {sx: 0, sy: 0};
            if (x === maxX - 1 && y === maxY - 1) return {sx: 20, sy: 20};
            if (x === maxX - 1 && y === 0) return {sx: 20, sy: 0};
            if (x === 0 && y === maxY - 1) return {sx: 0, sy: 20};
            if ((x > 0 && x < maxX - 1) && y === 0) return {sx: 0, sy: 40}
            if ((x > 0 && x < maxX - 1) && y === maxY - 1) return {sx: 0, sy: 60}
            if (x === 0 && (y > 0 && y < maxY - 1)) return {sx: 20, sy: 40}
            if (x === maxX - 1 && (y > 0 && y < maxY - 1)) return {sx: 20, sy: 60}

            return {sx: 0, sy: 140};
        }
        else{
            if (maxX > maxY){
                if (x === 0) return {sx: 0, sy: 80};
                if (x === maxX -1) return {sx:20, sy: 80};
                else return {sx: 0, sy: 120}
            }
            else{
                if (y === 0) return {sx: 0, sy: 100};
                if (y === maxY -1) return {sx:20, sy: 100};
                else return {sx: 20, sy: 120}
            }
        }
    }


    draw(ctx, camera) {
        ctx.drawImage(this.canvas, -camera.x, -camera.y);
    }
}


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

let crouchOffset = 0;
const maxCrouchOffset = BASE_HEIGHT / 4;

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
        crouchOffset += dt * (maxCrouchOffset);
        if (RemoveCroachingHeigh) {
            player.height /= 2;
            player.y += player.height;
            RemoveCroachingHeigh = false;
            player.speed /= 2;
        }
    } else if (!keys["ArrowDown"] && player.onGround) {
        crouchOffset -= dt * (maxCrouchOffset);
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


    crouchOffset = Math.max(0, Math.min(maxCrouchOffset, crouchOffset));

    if (player.jumpBuffer > 0 && player.coyoteTime > 0) {

        player.jumpBuffer = 0;
        player.coyoteTime = 0;
        player.dy = -player.jump_force;
        player.onGround = false;
    }

    player.jumpBuffer = Math.max(player.jumpBuffer - dt, 0);


    const leftDeadZone = camera.x + (BASE_WIDTH - deadZoneWidth) ;
    const rightDeadZone = camera.x + deadZoneWidth;
    const LeftX = player.x > leftDeadZone;
    const RightX = player.x < rightDeadZone;
    if (RightX || LeftX) {
        if (LeftX) {
            camera.x = Math.max(
                0,
                Math.round(Math.min(worldWidth - BASE_WIDTH, player.x - BASE_WIDTH + deadZoneWidth))
            );
        }
        else{
            camera.x = Math.max(
                0,
                Math.round(Math.min(worldWidth - BASE_WIDTH, player.x -deadZoneWidth))
            );
        }
    }

    camera.y = Math.max(0,
        Math.round(Math.min(worldHeight - BASE_HEIGHT, player.y + player.width/2*RemoveCroachingHeigh - BASE_HEIGHT / 2 + crouchOffset))
    )
    console.log(player.y + player.width/2*RemoveCroachingHeigh - BASE_HEIGHT / 2 + crouchOffset)

}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);


    currentLevel.draw(ctx, camera);
    ctx.fillStyle = player.blockColor;
    ctx.fillRect(
        Math.round(player.x - camera.x),
        player.y - camera.y,
        player.width,
        player.height
    );
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