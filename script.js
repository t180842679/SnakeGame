document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const canvas = document.getElementById('game-board');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('high-score');
    const gameTimeElement = document.getElementById('game-time');
    const startButton = document.getElementById('start-btn');
    const pauseButton = document.getElementById('pause-btn');
    const restartButton = document.getElementById('restart-btn');
    const speedSlider = document.getElementById('speed-slider');
    const speedValueDisplay = document.getElementById('speed-value');
    const sizeSelect = document.getElementById('size-select');
    const colorSelect = document.getElementById('color-select');

    // 游戏参数
    const gridSize = 20;
    let canvasSize = parseInt(sizeSelect.value);
    let tileCount = canvasSize / gridSize;
    let speed = parseInt(speedSlider.value);
    let baseSpeed = speed; // 保存初始速度值
    let backgroundColor = colorSelect.value;
    
    // 游戏时间相关
    let gameStartTime = 0;
    let gameTime = 0;
    let gameTimeInterval;
    
    // 食物相关
    const foodColors = {
        white: { color: 'white', points: 1, probability: 100 },
        yellow: { color: '#ffeb3b', points: 2, probability: 60 },
        orange: { color: '#ff9800', points: 3, probability: 40 },
        red: { color: '#f44336', points: 4, probability: 20 }
    };
    
    // 调整画布大小并保持响应式
    function updateCanvasSize() {
        const containerWidth = document.querySelector('.game-container').clientWidth - 40; // 减去padding
        canvasSize = Math.min(parseInt(sizeSelect.value), containerWidth);
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        tileCount = canvasSize / gridSize;
    }
    
    // 初始调整画布大小
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // 游戏状态
    let gameRunning = false;
    let gamePaused = false;
    let gameOver = false;
    let score = 0;
    let highScore = localStorage.getItem('snakeHighScore') || 0;
    highScoreElement.textContent = highScore;
    
    // 速度提升配置
    const speedIncreaseThreshold = 50; // 每得50分提升一次速度
    const speedIncreaseAmount = 0.5; // 每次提升的速度值
    
    // 当前食物类型
    let currentFoodType = 'white';

    // 蛇的初始位置和速度
    let snake = [
        { x: 5, y: 5 }
    ];
    let velocityX = 0;
    let velocityY = 0;
    let nextVelocityX = 0;
    let nextVelocityY = 0;

    // 食物位置和类型
    let food = generateFood();

    // 游戏循环
    let gameInterval;

    // 初始化游戏
    function init() {
        // 更新画布大小
        updateCanvasSize();
        
        // 更新背景颜色
        backgroundColor = colorSelect.value;
        
        snake = [{ x: 5, y: 5 }];
        velocityX = 0;
        velocityY = 0;
        nextVelocityX = 0;
        nextVelocityY = 0;
        score = 0;
        scoreElement.textContent = score;
        // 游戏开始时强制生成白色食物
        food = generateFood(true);
        gameOver = false;
        gameTime = 0;
        gameTimeElement.textContent = '00:00';
        speed = baseSpeed; // 重置为初始速度
        speedValueDisplay.textContent = speed;
        drawGame();
    }

    // 开始游戏
    function startGame() {
        if (gameRunning) return;
        gameRunning = true;
        gamePaused = false;
        gameStartTime = Date.now();
        gameInterval = setInterval(drawGame, 1000 / speed);
        gameTimeInterval = setInterval(updateGameTime, 1000);
        startButton.disabled = true;
        pauseButton.disabled = false;
        speedSlider.disabled = true; // 游戏开始后禁用速度调整
        sizeSelect.disabled = true; // 游戏开始后禁用大小调整
        colorSelect.disabled = true; // 游戏开始后禁用颜色调整
    }
    
    // 更新游戏时间
    function updateGameTime() {
        if (!gameRunning || gamePaused || gameOver) return;
        gameTime = Math.floor((Date.now() - gameStartTime) / 1000);
        const minutes = Math.floor(gameTime / 60).toString().padStart(2, '0');
        const seconds = (gameTime % 60).toString().padStart(2, '0');
        gameTimeElement.textContent = `${minutes}:${seconds}`;
    }

    // 暂停游戏
    function pauseGame() {
        if (!gameRunning || gameOver) return;
        gamePaused = !gamePaused;
        pauseButton.textContent = gamePaused ? '继续' : '暂停';
        if (gamePaused) {
            clearInterval(gameInterval);
            clearInterval(gameTimeInterval);
        } else {
            gameInterval = setInterval(drawGame, 1000 / speed);
            gameTimeInterval = setInterval(updateGameTime, 1000);
            gameStartTime = Date.now() - (gameTime * 1000); // 调整开始时间，保持游戏时间连续
        }
    }

    // 重新开始游戏
    function restartGame() {
        clearInterval(gameInterval);
        clearInterval(gameTimeInterval);
        init();
        gameRunning = false;
        gamePaused = false;
        pauseButton.textContent = '暂停';
        startButton.disabled = false;
        pauseButton.disabled = true;
        speedSlider.disabled = false; // 重新启用速度调整
        sizeSelect.disabled = false; // 重新启用大小调整
        colorSelect.disabled = false; // 重新启用颜色调整
    }

    // 生成食物
    function generateFood(forceWhite = false) {
        let newFood;
        let foodOnSnake;
        
        do {
            foodOnSnake = false;
            newFood = {
                x: Math.floor(Math.random() * tileCount),
                y: Math.floor(Math.random() * tileCount)
            };
            
            // 检查食物是否在蛇身上
            for (let i = 0; i < snake.length; i++) {
                if (snake[i].x === newFood.x && snake[i].y === newFood.y) {
                    foodOnSnake = true;
                    break;
                }
            }
        } while (foodOnSnake);
        
        // 确定食物类型
        determineFoodType(forceWhite);
        
        return newFood;
    }
    
    // 确定食物类型
    function determineFoodType(forceWhite = false) {
        // 如果强制白色，直接设置为白色
        if (forceWhite) {
            currentFoodType = 'white';
            return;
        }
        
        const rand = Math.random() * 100;
        
        if (rand <= foodColors.red.probability) {
            currentFoodType = 'red';
        } else if (rand <= foodColors.orange.probability) {
            currentFoodType = 'orange';
        } else if (rand <= foodColors.yellow.probability) {
            currentFoodType = 'yellow';
        } else {
            currentFoodType = 'white';
        }
    }

    // 绘制游戏
    function drawGame() {
        if (gamePaused || gameOver) return;

        // 更新蛇的位置
        velocityX = nextVelocityX;
        velocityY = nextVelocityY;
        
        // 移动蛇
        const head = { x: snake[0].x + velocityX, y: snake[0].y + velocityY };
        snake.unshift(head);

        // 检查是否吃到食物
        if (head.x === food.x && head.y === food.y) {
            // 根据食物类型增加分数
            const points = foodColors[currentFoodType].points;
            score += points;
            scoreElement.textContent = score;
            food = generateFood();
            
            // 根据得分自动提升速度
            if (score % speedIncreaseThreshold === 0) {
                speed += speedIncreaseAmount;
                speedValueDisplay.textContent = speed.toFixed(1);
                clearInterval(gameInterval);
                gameInterval = setInterval(drawGame, 1000 / speed);
            }
        } else {
            snake.pop();
        }

        // 检查碰撞
        if (checkCollision()) {
            gameOver = true;
            gameRunning = false;
            clearInterval(gameInterval);
            clearInterval(gameTimeInterval);
            startButton.disabled = false;
            pauseButton.disabled = true;
            speedSlider.disabled = false; // 重新启用速度调整
            sizeSelect.disabled = false; // 重新启用大小调整
            colorSelect.disabled = false; // 重新启用颜色调整
            
            // 更新最高分
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('snakeHighScore', highScore);
                highScoreElement.textContent = highScore;
            }
            
            // 绘制游戏结束画面
            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'red';
            ctx.font = '40px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('游戏结束!', canvas.width / 2, canvas.height / 2 - 30);
            ctx.font = '20px Arial';
            ctx.fillStyle = 'white';
            ctx.fillText(`得分: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
            
            // 根据得分显示不同的提示语
            let message = '';
            if (score < 10) {
                message = '继续努力，你可以做得更好！';
            } else if (score < 30) {
                message = '不错的尝试，再接再厉！';
            } else if (score < 50) {
                message = '很棒的表现，你已经很熟练了！';
            } else if (score < 100) {
                message = '太厉害了，你是贪吃蛇高手！';
            } else {
                message = '神级表现！挑战自己的极限吧！';
            }
            ctx.fillText(message, canvas.width / 2, canvas.height / 2 + 40);
            return;
        }

        // 清除画布
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 绘制食物
        ctx.fillStyle = foodColors[currentFoodType].color;
        ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);

        // 绘制蛇
        ctx.fillStyle = 'lime';
        for (let i = 0; i < snake.length; i++) {
            // 蛇头绘制为不同颜色
            if (i === 0) {
                ctx.fillStyle = '#00cc00';
            } else {
                ctx.fillStyle = 'lime';
            }
            ctx.fillRect(snake[i].x * gridSize, snake[i].y * gridSize, gridSize - 1, gridSize - 1);
        }
    }

    // 检查碰撞
    function checkCollision() {
        const head = snake[0];
        
        // 检查是否撞墙
        if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
            return true;
        }
        
        // 检查是否撞到自己
        for (let i = 1; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                return true;
            }
        }
        
        return false;
    }

    // 键盘控制
    document.addEventListener('keydown', (e) => {
        // 防止方向键滚动页面
        if ([37, 38, 39, 40].includes(e.keyCode)) {
            e.preventDefault();
        }
        
        // 只有在游戏运行时才接受键盘输入
        if (!gameRunning || gamePaused || gameOver) return;
        
        // 左箭头
        if (e.keyCode === 37 && velocityX !== 1) {
            nextVelocityX = -1;
            nextVelocityY = 0;
        }
        // 上箭头
        else if (e.keyCode === 38 && velocityY !== 1) {
            nextVelocityX = 0;
            nextVelocityY = -1;
        }
        // 右箭头
        else if (e.keyCode === 39 && velocityX !== -1) {
            nextVelocityX = 1;
            nextVelocityY = 0;
        }
        // 下箭头
        else if (e.keyCode === 40 && velocityY !== -1) {
            nextVelocityX = 0;
            nextVelocityY = 1;
        }
    });

    // 按钮事件监听
    startButton.addEventListener('click', startGame);
    pauseButton.addEventListener('click', pauseGame);
    restartButton.addEventListener('click', restartGame);
    
    // 速度滑块事件监听
    speedSlider.addEventListener('input', function() {
        const newSpeed = parseInt(this.value);
        speedValueDisplay.textContent = newSpeed;
        speed = newSpeed;
        baseSpeed = newSpeed; // 更新基础速度
        
        // 如果游戏正在运行，更新游戏速度
        if (gameRunning && !gamePaused) {
            clearInterval(gameInterval);
            gameInterval = setInterval(drawGame, 1000 / speed);
        }
    });
    
    // 游戏区域大小选择事件监听
    sizeSelect.addEventListener('change', function() {
        if (!gameRunning) {
            updateCanvasSize();
            init();
        }
    });
    
    // 背景颜色选择事件监听
    colorSelect.addEventListener('change', function() {
        if (!gameRunning) {
            // 检查背景色与食物颜色的对比度
            const bgColor = this.value;
            // 如果背景色太接近某些食物颜色，提供更好的对比色
            if (bgColor === '#1a1a2e') {
                // 深蓝色背景，调整食物颜色亮度
                foodColors.white.color = '#ffffff';
                foodColors.yellow.color = '#ffff00';
                foodColors.orange.color = '#ffa500';
                foodColors.red.color = '#ff5252';
            } else if (bgColor === '#3c1642') {
                // 深紫色背景，调整食物颜色亮度
                foodColors.white.color = '#ffffff';
                foodColors.yellow.color = '#ffff00';
                foodColors.orange.color = '#ffa500';
                foodColors.red.color = '#ff5252';
            } else {
                // 恢复默认颜色
                foodColors.white.color = 'white';
                foodColors.yellow.color = '#ffeb3b';
                foodColors.orange.color = '#ff9800';
                foodColors.red.color = '#f44336';
            }
            backgroundColor = bgColor;
            init();
        }
    });

    // 初始化游戏
    init();
    pauseButton.disabled = true;
});