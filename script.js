const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d'); // 獲取 2D 繪圖環境
const scoreElement = document.getElementById('score');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreElement = document.getElementById('finalScore');
const restartButton = document.getElementById('restartButton');

// --- 常數設定 ---
const GRID_SIZE = 20; // 每格的大小 (同 Pygame 的 BLOCK_SIZE)
const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;
const GRID_WIDTH = CANVAS_WIDTH / GRID_SIZE;
const GRID_HEIGHT = CANVAS_HEIGHT / GRID_SIZE;

// 顏色
const BORDER_COLOR = '#333';
const BACKGROUND_COLOR = '#000000';
const SNAKE_COLOR = '#00FF00'; // 綠色
const FOOD_COLOR = '#FF5050'; // 紅色

// --- 遊戲狀態變數 ---
let snake = [];         // 蛇的身體，儲存 {x, y} 物件陣列
let dx = GRID_SIZE;     // x 方向速度 (一開始向右)
let dy = 0;             // y 方向速度
let food = { x: 0, y: 0 }; // 食物位置
let score = 0;
let changingDirection = false; // 防止在同一個 tick 內快速反向
let gameRunning = false;
let gameLoopTimeout; // 用於儲存 setTimeout 的 ID

// --- 輔助函式 ---

function clearCanvas() {
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawRect(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
    // 可以選擇性地加上邊框讓格子更明顯
    // ctx.strokeStyle = BORDER_COLOR;
    // ctx.strokeRect(x, y, GRID_SIZE, GRID_SIZE);
}

function drawSnakePart(snakePart) {
    drawRect(snakePart.x, snakePart.y, SNAKE_COLOR);
}

function drawSnake() {
    snake.forEach(drawSnakePart);
}

function drawFood() {
    drawRect(food.x, food.y, FOOD_COLOR);
}

function moveSnake() {
    // 計算新蛇頭的位置
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    // 將新蛇頭加到陣列開頭
    snake.unshift(head);

    // 檢查是否吃到食物
    const didEatFood = snake[0].x === food.x && snake[0].y === food.y;
    if (didEatFood) {
        score += 1;
        scoreElement.textContent = score;
        createFood(); // 重新生成食物
    } else {
        // 沒吃到食物，移除蛇尾
        snake.pop();
    }
}

function createFood() {
    let newFoodX, newFoodY;
    // 不斷生成新座標，直到找到一個不在蛇身上的位置
    while (true) {
        newFoodX = Math.floor(Math.random() * GRID_WIDTH) * GRID_SIZE;
        newFoodY = Math.floor(Math.random() * GRID_HEIGHT) * GRID_SIZE;

        let collision = false;
        for (let i = 0; i < snake.length; i++) {
            if (newFoodX === snake[i].x && newFoodY === snake[i].y) {
                collision = true;
                break;
            }
        }
        if (!collision) {
            break; // 找到有效位置，跳出迴圈
        }
    }
    food = { x: newFoodX, y: newFoodY };
}

function checkGameOver() {
    // 檢查撞牆
    const hitLeftWall = snake[0].x < 0;
    const hitRightWall = snake[0].x >= CANVAS_WIDTH;
    const hitTopWall = snake[0].y < 0;
    const hitBottomWall = snake[0].y >= CANVAS_HEIGHT;

    if (hitLeftWall || hitRightWall || hitTopWall || hitBottomWall) {
        return true;
    }

    // 檢查撞到自己 (從第二節開始檢查)
    for (let i = 1; i < snake.length; i++) {
        if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) {
            return true;
        }
    }

    return false;
}

function changeDirection(event) {
    // W = 87, A = 65, S = 83, D = 68 (也可以用)
    const LEFT_KEY = 37;
    const RIGHT_KEY = 39;
    const UP_KEY = 38;
    const DOWN_KEY = 40;
    const ENTER_KEY = 13; // Enter 鍵用於重新開始

    // 如果遊戲結束，只監聽 Enter
    if (!gameRunning && event.keyCode === ENTER_KEY) {
        startGame();
        return;
    }
    // 如果遊戲進行中，但正在轉向中，或遊戲未開始，則忽略方向鍵
    if (!gameRunning || changingDirection) return;

    changingDirection = true; // 標記正在轉向

    const keyPressed = event.keyCode;
    const goingUp = dy === -GRID_SIZE;
    const goingDown = dy === GRID_SIZE;
    const goingRight = dx === GRID_SIZE;
    const goingLeft = dx === -GRID_SIZE;

    // 根據按下的鍵和目前方向，決定新方向 (防止 180 度迴轉)
    if (keyPressed === LEFT_KEY && !goingRight) {
        dx = -GRID_SIZE;
        dy = 0;
    } else if (keyPressed === UP_KEY && !goingDown) {
        dx = 0;
        dy = -GRID_SIZE;
    } else if (keyPressed === RIGHT_KEY && !goingLeft) {
        dx = GRID_SIZE;
        dy = 0;
    } else if (keyPressed === DOWN_KEY && !goingUp) {
        dx = 0;
        dy = GRID_SIZE;
    } else {
        // 如果按了無效鍵 (例如，向右時按右)，不算作一次有效的轉向
        changingDirection = false;
    }
}

// --- 遊戲主迴圈 ---
function gameLoop() {
    if (!gameRunning) return; // 如果遊戲結束，停止迴圈

    // 設置一個延遲，讓下一次方向改變生效
    gameLoopTimeout = setTimeout(() => {
        changingDirection = false; // 允許下一次方向改變
        clearCanvas();
        drawFood();
        moveSnake();
        drawSnake();

        // 檢查遊戲是否結束
        if (checkGameOver()) {
            gameRunning = false;
            finalScoreElement.textContent = score; // 更新最終分數
            gameOverScreen.style.display = 'flex'; // 顯示結束畫面
        } else {
            gameLoop(); // 繼續下一個迴圈
        }
    }, 150); // 控制遊戲速度 (毫秒，數字越小越快)
}

// --- 啟動遊戲 ---
function startGame() {
    // 重置遊戲狀態
    snake = [
        { x: Math.floor(GRID_WIDTH / 2) * GRID_SIZE, y: Math.floor(GRID_HEIGHT / 2) * GRID_SIZE }, // 初始蛇頭在中間
        { x: (Math.floor(GRID_WIDTH / 2) - 1) * GRID_SIZE, y: Math.floor(GRID_HEIGHT / 2) * GRID_SIZE }, // 初始第二節
        { x: (Math.floor(GRID_WIDTH / 2) - 2) * GRID_SIZE, y: Math.floor(GRID_HEIGHT / 2) * GRID_SIZE }  // 初始第三節
    ];
    dx = GRID_SIZE; // 初始向右
    dy = 0;
    score = 0;
    scoreElement.textContent = score;
    changingDirection = false;
    gameRunning = true;
    gameOverScreen.style.display = 'none'; // 隱藏結束畫面
    clearTimeout(gameLoopTimeout); // 清除可能存在的舊計時器

    createFood(); // 創建初始食物
    gameLoop();   // 開始遊戲迴圈
}

// --- 事件監聽 ---
document.addEventListener('keydown', changeDirection);
restartButton.addEventListener('click', startGame);

// --- 初始啟動 ---
// 可以選擇一開始就顯示開始畫面，或直接開始遊戲
// 這裡我們先顯示一個提示，讓玩家按 Enter 開始
clearCanvas(); // 清理一下畫布
ctx.fillStyle = "white";
ctx.font = "20px 'Microsoft JhengHei', '微軟正黑體', sans-serif";
ctx.textAlign = "center";
ctx.fillText("按 Enter 鍵開始遊戲", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
ctx.font = "16px 'Microsoft JhengHei', '微軟正黑體', sans-serif";
ctx.fillText("(使用方向鍵控制)", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);

// 或者，如果你想一打開就開始遊戲，取消註解下面的 startGame()
// startGame();