const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")
canvas.width = 1280
canvas.height = 720
ctx.imageSmoothingEnabled = true
const gravity = 1
friction = 1

const FPS = 1000 / 12
let lastTimestamp = 0
let deltaTime = 0

let loadedLevels = 0

const lvlURLs = [
    "Assets/Images/level 1 background.png", "Assets/Images/level 1 background.png"
]

const sprites = []

for (let i = 0; i < lvlURLs.length; i++) {
    sprites[i] = new Image()
    sprites[i].src = lvlURLs[i]
}

for (let i = 0; i < sprites.length; i++) {
    sprites[i].addEventListener("load", _ => {
        loadedLevels++
        if (loadedLevels === lvlURLs.length) {
            requestAnimationFrame(gameLoop)
            console.log("all loaded")
        }
    })
}


// winning square always goes first
// [0] = x position
// [1] = y position
// [2] = width
// [3] = height
// [4] = color / type

// [5] = has been touched, true or false (for deleting single use cubes)

const levels = {
    1: [
        [29, 16, 1.5, 1, "#0f0"],
        [0, 16, 5, 1, "#000"], [22, 16, 6, 1, "#000"], [5, 16, 1, 2, "#000"], [22, 16, 1, 2, "#000"],
        [7, 13, 2, 1, "#000"], [3, 10, 1, 1, "#000"], [7, 7, 2, 1, "#000"], [11, 3, 1, 1, "#000"],
        [14, 11, 1, 1, "#06f", true], [17, 3, 1, 5, "#f00"], [11, 4, 1, 8, "#f00"], [28, 3, 1, 13, "#f00"],
        [25, 13, 1, 1, "#000"], [27, 10, 1, 1, "#000"], [25, 7, 1, 1, "#000"], [27, 4, 1, 1, "#000"],
        [28, 16, 1, 1, "#f00"], [30.5, 16, 1.5, 1, "#f00"]
    ],
    2: [
        [1.5, 8, 1, 1, "#0f0"],
        [0, 16, 5, 1, "#000"], [5, 16, 1, 2, "#000"], [12, 10, 1.5, 1, "#06f", true], [6, 2, 2, 1, "#000"], 
        [11, 7.5, 1, 3.5, "#f00"], [11.5, 17, 0.5, 1, "#000"], [17, 17, 0.5, 1, "#000"], [20, 15, 2, 1, "#000"],
        [21, 12, 1, 3, "#f00"], [23, 17, 1, 1, "#06f", true],  [25, 9, 1, 1, "#06f", true], [21, 2, 1, 1, "#000"], 
        [19, 2, 0.5, 1, "#000"], [16.5, 2, 1, 1, "#000"], [14.5, 4, 2, 1, "#000"], [13.5, 5, 1, 6, "#f00"],
        
    ]
}

class Engine {
    constructor() {
        this.level = 1
        this.spawnpoint = {
            1: [80, 500],
            2: [80, 500]
        }
    }
    draw() {
        for (let i = 0; i < Object.keys(levels[this.level]).length; i++) {
            if (levels[this.level][i].length === 6) {
                if (levels[this.level][i][4] === "#06f" && levels[this.level][i][5] === false) {
                    continue
                }
            }
            ctx.fillStyle = levels[this.level][i][4]
            ctx.fillRect(levels[this.level][i][0] * 40, levels[this.level][i][1] * 40, levels[this.level][i][2] * 40, levels[this.level][i][3] * 40)
        }
    }
}

class Player {
    constructor(width, height, color, x, y) {
        this.width = width
        this.height = height
        this.x = x
        this.y = y
        this.xVel = 0
        this.yVel = 0
        this.color = color
        this.gravity = 1
    }
    draw() {
        ctx.fillStyle = this.color
        ctx.fillRect(this.x, this.y, this.width, this.height)
    }
    nextLevel() {
        engine.level++
        this.yVel = this.xVel = 0
        this.x = engine.spawnpoint[engine.level][0]
        this.y = engine.spawnpoint[engine.level][1]
    }
    reset() {
        for (let i = 1; i <= Object.keys(levels).length; i++) {
            for (let j = 0; j < Object.keys(levels[i]).length; j++) {
                if (levels[i][j][4] === "#06f") {
                    levels[i][j][5] = true
                }
            }
        }
        // engine.level = 1
        this.xVel = this.yVel = 0
        this.x = engine.spawnpoint[engine.level][0]
        this.y = engine.spawnpoint[engine.level][1]
    }
    update() {
        this.x += this.xVel
        this.y += this.yVel
        this.collision = collision(this, this.x, this.y)
        if (keys["ArrowRight"] || keys["KeyD"]) {
            if (this.xVel >= 7) {
                this.xVel = 7
            } else {
                this.xVel += 2
            }
        }
        if (keys["ArrowLeft"] || keys["KeyA"]) {
            if (this.xVel <= -7) {
                this.xVel = -7
            } else {
                this.xVel -= 2
            }
        }
        if (this.collision[3]) {
            if (keys["ArrowUp"] || keys["KeyW"] || keys["Space"]) {
                this.yVel = -18
            }
        }
        
        
        // this.yVel += gravity
        if (this.xVel > 0.6) {
            this.xVel -= friction
        }
        else if (this.xVel < -0.6) {
            this.xVel += friction
        } else  {
            this.xVel = 0
        }

        //
        //

        this.x = this.collision[0]
        this.y = this.collision[1]
        // jump boost
        if (this.collision[2] === "#06f" && this.collision[3]) {
            levels[engine.level][this.collision[4]][5] = false
            this.yVel = -26;
        } 
        // death
        if (this.collision[2] === "#f00") {
            this.reset()
        }
        // finish level
        if (this.collision[2] === "#0f0") {
            this.nextLevel()
        }

        if (keys["KeyR"]) {
            this.reset()
            console.log("br")
        }
    }
}





const engine = new Engine()
const player = new Player(40, 40, "#6677aa", engine.spawnpoint[engine.level][0], engine.spawnpoint[engine.level][1])

const keys = []

window.addEventListener("keydown", (e) => {
    keys[e.code] = true 
})
window.addEventListener("keyup", (e) => {
    keys[e.code] = false
})

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(sprites[engine.level - 1], 0, 0, canvas.width, canvas.height)
    engine.draw()
    player.draw()
    player.update()
    requestAnimationFrame(gameLoop)
}