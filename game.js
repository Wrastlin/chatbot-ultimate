// Game variables
let player;
let customers = [];
let docs = [];
let bugs = [];
let bullets = [];
let powerUps = [];
let score = {
    customers: 0,
    docs: 0,
    total: 0
};
let gameMap;
let powerUpActive = false;
let powerUpTimer = 0;
let activePowerUpType = null; // Type of active power-up
let gameState = "playing"; // playing, gameOver, enterName
let level = 1;
let levelGoal = 200; // Score needed to advance to next level (reduced from 300)
let specialDocChance = 0.3; // 30% chance for a special doc (increased from 20%)
let gameInitialized = false;
let framesSinceStart = 0;

// Leaderboard variables
let leaderboard = [];
let playerName = "";
let inputActive = false;
const MAX_LEADERBOARD_ENTRIES = 5;

// Add a temporary immunity flag and timer
let playerImmunity = false;
let immunityTimer = 0;
const IMMUNITY_DURATION = 180; // 3 seconds at 60fps

// Load leaderboard from localStorage if available
function loadLeaderboard() {
    const savedLeaderboard = localStorage.getItem('chatbaseHeroLeaderboard');
    if (savedLeaderboard) {
        leaderboard = JSON.parse(savedLeaderboard);
    }
}

// Save leaderboard to localStorage
function saveLeaderboard() {
    localStorage.setItem('chatbaseHeroLeaderboard', JSON.stringify(leaderboard));
    
    // Update leaderboard display in the HTML if it exists
    updateLeaderboardDisplay();
}

// Add score to leaderboard
function addScoreToLeaderboard(name, totalScore, levelReached) {
    leaderboard.push({
        name: name,
        score: totalScore,
        level: levelReached,
        date: new Date().toLocaleDateString()
    });
    
    // Sort leaderboard by score (highest first)
    leaderboard.sort((a, b) => b.score - a.score);
    
    // Keep only top scores
    if (leaderboard.length > MAX_LEADERBOARD_ENTRIES) {
        leaderboard = leaderboard.slice(0, MAX_LEADERBOARD_ENTRIES);
    }
    
    // Save to localStorage
    saveLeaderboard();
}

// Update leaderboard display in HTML
function updateLeaderboardDisplay() {
    const leaderboardContainer = document.getElementById('leaderboard-container');
    if (leaderboardContainer) {
        if (leaderboard.length === 0) {
            leaderboardContainer.innerHTML = '<p>Play the game to get on the leaderboard!</p>';
            return;
        }
        
        let html = '<table style="width:100%; text-align:left;"><tr><th>Rank</th><th>Name</th><th>Score</th><th>Level</th><th>Date</th></tr>';
        
        leaderboard.forEach((entry, index) => {
            html += `<tr>
                <td>${index + 1}</td>
                <td>${entry.name}</td>
                <td>${entry.score}</td>
                <td>${entry.level}</td>
                <td>${entry.date}</td>
            </tr>`;
        });
        
        html += '</table>';
        leaderboardContainer.innerHTML = html;
    }
}

// Constants
const PLAYER_SPEED = 6; // Increased from 5
const CUSTOMER_SPEED = 1.5; // Reduced from 2
const BUG_SPEED = 2; // Reduced from 3
const BULLET_SPEED = 10;
const INTERACTION_RANGE = 120; // Increased from 100
const DOC_POINTS = 15; // Increased from 10
const CUSTOMER_POINTS = 50;
const BUG_SPAWN_RATE = 0.005; // Reduced from 0.01
const DOC_SPAWN_RATE = 0.008; // Increased from 0.005
const CUSTOMER_SPAWN_RATE = 0.004; // Increased from 0.003
const POWER_UP_DURATION = 400; // Increased from 300 frames
const SPECIAL_DOC_POINTS = 30; // Increased from 25
const POWER_UP_SPAWN_RATE = 0.002; // Increased from 0.001

// Power-up types
const POWER_UP_TYPES = [
    {
        name: "Speed Boost",
        color: [0, 255, 0],
        effect: function(player) {
            player.speed = PLAYER_SPEED * 1.5;
        },
        reset: function(player) {
            player.speed = PLAYER_SPEED;
        }
    },
    {
        name: "Rapid Fire",
        color: [255, 0, 0],
        effect: function(player) {
            player.cooldown = 5; // Reduced cooldown for shooting
        },
        reset: function(player) {
            player.cooldown = 10;
        }
    },
    {
        name: "Shield",
        color: [0, 0, 255],
        effect: function(player) {
            player.shielded = true;
        },
        reset: function(player) {
            player.shielded = false;
        }
    },
    {
        name: "Customer Magnet",
        color: [255, 255, 0],
        effect: function(player) {
            INTERACTION_RANGE = 150; // Increased interaction range
        },
        reset: function(player) {
            INTERACTION_RANGE = 100;
        }
    }
];

// Setup function
function setup() {
    console.log("Setup function called");
    // Create canvas and set it to the parent element
    const canvas = createCanvas(800, 600);
    canvas.parent('game-canvas');
    
    // Expose p5 instance to window for message handling
    if (window.exposep5Instance) {
        window.exposep5Instance(this);
    }
    
    // Initialize game map
    gameMap = new GameMap(width, height);
    
    // Create a safe starting position for the player
    const safePosition = getSafeStartingPosition();
    player = new Player(safePosition.x, safePosition.y);
    
    // Grant temporary immunity
    playerImmunity = true;
    immunityTimer = IMMUNITY_DURATION;
    player.immune = true;
    player.immuneTimer = 180;
    
    // Initialize customers, docs, and bugs in safe positions
    for (let i = 0; i < 4; i++) {
        spawnCustomer();
    }
    
    for (let i = 0; i < 8; i++) {
        spawnDoc();
    }
    
    // Only spawn 1 bug initially
    spawnBug();
    
    // Initialize score display
    updateScoreDisplay();
    
    // Load leaderboard from localStorage
    loadLeaderboard();
    
    // Set game as initialized
    gameInitialized = true;
    console.log("Game initialized successfully");
}

// Function to find a safe starting position for the player
function getSafeStartingPosition() {
    // Default to center
    let position = {
        x: width / 2,
        y: height / 2
    };
    
    // Clear the center area to ensure it's safe
    gameMap.clearArea(position.x, position.y, 100);
    
    return position;
}

// Draw function - game loop
function draw() {
    // Clear background
    background(20, 34, 64);
    
    // Track startup frames
    framesSinceStart++;
    
    // Debug logging for the first few frames
    if (framesSinceStart <= 5) {
        console.log(`Frame ${framesSinceStart}: gameInitialized=${gameInitialized}, player exists=${player !== undefined}`);
    }
    
    // Safety check to prevent freezing
    if (!gameInitialized || !player) {
        console.log("Game not fully initialized, reinitializing...");
        setup();
        return;
    }
    
    // Game state handling
    if (gameState === "playing") {
        // Draw map
        gameMap.display();
        
        // Handle power-up timer
        if (powerUpActive) {
            powerUpTimer--;
            if (powerUpTimer <= 0) {
                powerUpActive = false;
                // Reset power-up effects
                if (activePowerUpType) {
                    activePowerUpType.reset(player);
                    activePowerUpType = null;
                }
            }
        }
        
        try {
            // Update and display game elements
            updateDocs();
            updateCustomers();
            updateBugs();
            updateBullets();
            updatePowerUps();
            
            // Update player (movement handled inside player.update())
            player.update();
            player.display();
            
            // Spawn new elements
            if (random() < DOC_SPAWN_RATE * (1 + (level * 0.1))) spawnDoc();
            if (random() < CUSTOMER_SPAWN_RATE * (1 + (level * 0.1))) spawnCustomer();
            if (random() < BUG_SPAWN_RATE * (1 + (level * 0.2))) spawnBug();
            if (random() < POWER_UP_SPAWN_RATE * level) spawnPowerUp();
            
            // Display power-up status
            if (powerUpActive && activePowerUpType) {
                fill(activePowerUpType.color[0], activePowerUpType.color[1], activePowerUpType.color[2], 100);
                noStroke();
                ellipse(player.x, player.y, INTERACTION_RANGE * 2);
                
                textAlign(CENTER);
                textSize(14);
                fill(activePowerUpType.color[0], activePowerUpType.color[1], activePowerUpType.color[2]);
                text(activePowerUpType.name + "!", player.x, player.y - 40);
                
                // Show timer
                const timeLeft = Math.ceil(powerUpTimer / 60); // Convert frames to seconds
                text(timeLeft + "s", player.x, player.y - 20);
            }
            
            // Display level info
            displayLevelInfo();
            
            // Check for level up
            if (score.total >= levelGoal) {
                levelUp();
            }
            
            // Update immunity timer
            if (playerImmunity) {
                immunityTimer--;
                if (immunityTimer <= 0) {
                    playerImmunity = false;
                }
            }
        } catch (error) {
            console.error("Error in game loop:", error);
            // Try to recover
            if (frameCount % 60 === 0) { // Only try every second to avoid infinite loop
                gameMap.clearArea(width/2, height/2, 200);
                player.x = width/2;
                player.y = height/2;
            }
        }
    } else if (gameState === "gameOver") {
        displayGameOver();
    } else if (gameState === "enterName") {
        displayEnterName();
    }
}

// Display level information
function displayLevelInfo() {
    fill(255);
    textAlign(LEFT);
    textSize(16);
    text("Level: " + level, 20, 30);
    
    // Progress bar to next level
    const progressWidth = 150;
    const progress = min(score.total / levelGoal, 1);
    
    stroke(100);
    strokeWeight(2);
    noFill();
    rect(20, 40, progressWidth, 15, 5);
    
    noStroke();
    fill(0, 200, 255);
    rect(20, 40, progressWidth * progress, 15, 5);
    
    fill(255);
    textSize(12);
    textAlign(CENTER);
    text(score.total + "/" + levelGoal, 20 + progressWidth/2, 53);
    
    // Display level description
    textAlign(LEFT);
    textSize(14);
    fill(200, 200, 200);
    
    let levelDescription = "";
    switch(level) {
        case 1:
            levelDescription = "Tutorial: Collect docs and help customers";
            break;
        case 2:
            levelDescription = "More bugs appear! Watch out!";
            break;
        case 3:
            levelDescription = "Bugs move faster now";
            break;
        case 4:
            levelDescription = "Power-ups appear more frequently";
            break;
        case 5:
            levelDescription = "Challenge level: Survive the bug swarm!";
            break;
        default:
            levelDescription = "Expert level: " + (level - 5);
    }
    
    text(levelDescription, 20, 75);
    
    // Display health
    textAlign(RIGHT);
    textSize(16);
    fill(255);
    text("Health: " + player.health + "%", width - 20, 30);
    
    // Health bar
    const healthWidth = 150;
    stroke(100);
    strokeWeight(2);
    noFill();
    rect(width - 20 - healthWidth, 40, healthWidth, 15, 5);
    
    noStroke();
    if (player.health > 60) {
        fill(0, 255, 0); // Green
    } else if (player.health > 30) {
        fill(255, 255, 0); // Yellow
    } else {
        fill(255, 0, 0); // Red
    }
    rect(width - 20 - healthWidth, 40, healthWidth * (player.health / 100), 15, 5);
}

// Level up function
function levelUp() {
    level++;
    levelGoal = levelGoal * 1.4; // Reduced multiplier from 1.5
    
    // Increase difficulty based on level
    switch(level) {
        case 2:
            // More bugs
            for (let i = 0; i < 2; i++) { // Reduced from 3
                spawnBug();
            }
            break;
        case 3:
            // Faster bugs
            BUG_SPEED += 0.5; // Reduced from 1
            break;
        case 4:
            // More power-ups
            for (let i = 0; i < 3; i++) {
                spawnPowerUp();
            }
            break;
        case 5:
            // Bug swarm
            for (let i = 0; i < 3; i++) { // Reduced from 5
                spawnBug();
            }
            BUG_SPEED += 0.5;
            break;
        default:
            // Higher levels: increase all difficulties
            BUG_SPEED += 0.2; // Reduced from 0.3
            for (let i = 0; i < Math.min(level, 8); i++) { // Reduced from 10
                spawnBug();
            }
    }
    
    // Spawn bonus docs and customers
    for (let i = 0; i < 4; i++) { // Increased from 3
        spawnDoc(true); // Spawn special docs as reward
    }
    
    // Visual effect for level up
    displayLevelUpMessage();
}

// Display level up message
function displayLevelUpMessage() {
    // Create a div for the level up message
    const levelUpDiv = document.createElement('div');
    levelUpDiv.style.position = 'absolute';
    levelUpDiv.style.top = '50%';
    levelUpDiv.style.left = '50%';
    levelUpDiv.style.transform = 'translate(-50%, -50%)';
    levelUpDiv.style.backgroundColor = 'rgba(0, 200, 255, 0.8)';
    levelUpDiv.style.color = 'white';
    levelUpDiv.style.padding = '20px';
    levelUpDiv.style.borderRadius = '10px';
    levelUpDiv.style.fontSize = '24px';
    levelUpDiv.style.fontWeight = 'bold';
    levelUpDiv.style.textAlign = 'center';
    levelUpDiv.style.zIndex = '1000';
    levelUpDiv.style.boxShadow = '0 0 20px rgba(0, 200, 255, 0.5)';
    
    levelUpDiv.innerHTML = `
        <div>LEVEL UP!</div>
        <div style="font-size: 36px;">Level ${level}</div>
    `;
    
    document.body.appendChild(levelUpDiv);
    
    // Remove the div after 2 seconds
    setTimeout(() => {
        document.body.removeChild(levelUpDiv);
    }, 2000);
}

// Game over display
function displayGameOver() {
    background('#0a1930');
    
    fill(255);
    textSize(48);
    textAlign(CENTER, CENTER);
    text("GAME OVER", width/2, height/2 - 100);
    
    textSize(24);
    text("Final Score: " + score.total, width/2, height/2 - 40);
    text("Level Reached: " + level, width/2, height/2);
    
    textSize(18);
    text("Press ENTER to save your score", width/2, height/2 + 50);
    text("Press SPACE to play again without saving", width/2, height/2 + 80);
    
    // Check for key presses
    if (keyIsDown(13)) { // Enter key
        gameState = "enterName";
        playerName = ""; // Reset player name
        inputActive = true;
    } else if (keyIsDown(32)) { // Space bar
        restartGame();
    }
}

// Enter name screen
function displayEnterName() {
    background('#0a1930');
    
    fill(255);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("New High Score!", width/2, height/2 - 100);
    
    textSize(24);
    text("Enter Your Name:", width/2, height/2 - 40);
    
    // Draw input box
    fill('#132240');
    stroke(0, 200, 255);
    strokeWeight(2);
    rect(width/2 - 150, height/2 - 10, 300, 50, 5);
    
    // Draw entered name
    fill(255);
    noStroke();
    textAlign(CENTER, CENTER);
    text(playerName + (frameCount % 60 < 30 ? "|" : ""), width/2, height/2 + 15);
    
    // Instructions
    textSize(16);
    text("Press ENTER to save", width/2, height/2 + 70);
    
    // Handle keyboard input
    if (inputActive) {
        // This is handled in the keyPressed function
    }
}

// Restart game function
function restartGame() {
    // Reset game variables
    customers = [];
    docs = [];
    bugs = [];
    bullets = [];
    powerUps = [];
    score = {
        customers: 0,
        docs: 0,
        total: 0
    };
    powerUpActive = false;
    powerUpTimer = 0;
    gameState = "playing";
    level = 1;
    levelGoal = 200;
    
    // Create player
    player = new Player(width / 2, height / 2);
    
    // Initialize game elements
    for (let i = 0; i < 4; i++) { // Increased from 3
        spawnCustomer();
    }
    
    for (let i = 0; i < 8; i++) { // Increased from 5
        spawnDoc();
    }
    
    for (let i = 0; i < 1; i++) { // Reduced from 2
        spawnBug();
    }
    
    // Update score display
    updateScoreDisplay();
}

// Game Map class
class GameMap {
    constructor(w, h) {
        this.width = w;
        this.height = h;
        this.obstacles = [];
        this.cellSize = 50; // Size of each grid cell
        this.generateObstacles();
        
        // Ensure center is clear
        this.clearArea(this.width / 2, this.height / 2, 100);
    }
    
    generateObstacles() {
        // Clear existing obstacles
        this.obstacles = [];
        
        try {
            // Create a grid-based approach for more controlled obstacle placement
            const gridCols = Math.floor(this.width / this.cellSize);
            const gridRows = Math.floor(this.height / this.cellSize);
            
            // Define regions for obstacles (avoid center)
            const regions = [
                { startCol: 0, endCol: Math.floor(gridCols * 0.3), startRow: 0, endRow: Math.floor(gridRows * 0.3) }, // Top-left
                { startCol: Math.floor(gridCols * 0.7), endCol: gridCols, startRow: 0, endRow: Math.floor(gridRows * 0.3) }, // Top-right
                { startCol: 0, endCol: Math.floor(gridCols * 0.3), startRow: Math.floor(gridRows * 0.7), endRow: gridRows }, // Bottom-left
                { startCol: Math.floor(gridCols * 0.7), endCol: gridCols, startRow: Math.floor(gridRows * 0.7), endRow: gridRows } // Bottom-right
            ];
            
            // Add fewer obstacles in each region
            regions.forEach(region => {
                const obstacleCount = Math.floor(random(2, 4)); // Reduced from 3-6
                
                for (let i = 0; i < obstacleCount; i++) {
                    const col = Math.floor(random(region.startCol, region.endCol));
                    const row = Math.floor(random(region.startRow, region.endRow));
                    
                    const x = col * this.cellSize;
                    const y = row * this.cellSize;
                    
                    // Smaller obstacles
                    const w = random(20, 50); // Reduced from 30-70
                    const h = random(20, 50); // Reduced from 30-70
                    
                    // Add obstacle if not too close to center - increase safe zone
                    const distToCenter = dist(x, y, this.width / 2, this.height / 2);
                    if (distToCenter > 200) { // Increased from 150
                        this.obstacles.push({ x, y, w, h });
                    }
                }
            });
            
            // Add fewer scattered obstacles
            const scatteredCount = Math.floor(random(3, 6)); // Reduced from 5-10
            for (let i = 0; i < scatteredCount; i++) {
                const x = random(this.width);
                const y = random(this.height);
                
                // Smaller size
                const w = random(20, 40); // Reduced
                const h = random(20, 40); // Reduced
                
                // Add obstacle if not too close to center - increase safe zone
                const distToCenter = dist(x, y, this.width / 2, this.height / 2);
                if (distToCenter > 200) { // Increased from 150
                    this.obstacles.push({ x, y, w, h });
                }
            }
            
            // Ensure a clear center area
            this.clearArea(this.width / 2, this.height / 2, 200); // Increased safety radius
        } catch (error) {
            console.error("Error generating obstacles:", error);
            // Emergency fallback - just clear everything
            this.obstacles = [];
        }
    }
    
    display() {
        // Draw obstacles
        fill(100, 100, 100);
        stroke(50, 50, 50);
        strokeWeight(2);
        
        for (let obstacle of this.obstacles) {
            rect(obstacle.x, obstacle.y, obstacle.w, obstacle.h, 5);
        }
    }
    
    checkCollision(x, y, w, h) {
        // Check if position is outside canvas
        if (x < 0 || x + w > this.width || y < 0 || y + h > this.height) {
            return true;
        }
        
        // Check collision with obstacles
        for (let obstacle of this.obstacles) {
            if (x + w > obstacle.x && x < obstacle.x + obstacle.w &&
                y + h > obstacle.y && y < obstacle.y + obstacle.h) {
                return true;
            }
        }
        
        return false;
    }
    
    clearArea(x, y, size) {
        // Remove obstacles that intersect with the specified area
        this.obstacles = this.obstacles.filter(obstacle => {
            const centerX = obstacle.x + obstacle.w / 2;
            const centerY = obstacle.y + obstacle.h / 2;
            const distance = dist(x, y, centerX, centerY);
            return distance > size / 2;
        });
    }
}

// Player class
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 50;
        this.speed = PLAYER_SPEED;
        this.angle = 0;
        this.interactionProgress = {};
        this.cooldown = 0;
        this.health = 100; // Player health
        this.shielded = false;
        this.lastMoveTime = Date.now(); // Track last successful movement
        this.immune = true; // Start with immunity
        this.immuneTimer = 180; // 3 seconds at 60fps
    }
    
    update() {
        // Handle movement in a more robust way
        this.handleMovement();
        
        // Update angle to face mouse
        this.angle = atan2(mouseY - this.y, mouseX - this.x);
        
        // Handle shooting
        if (mouseIsPressed && this.cooldown <= 0) {
            this.shoot();
            this.cooldown = 10; // 10 frames cooldown
        }
        
        if (this.cooldown > 0) {
            this.cooldown--;
        }
        
        // Update immunity
        if (this.immune) {
            this.immuneTimer--;
            if (this.immuneTimer <= 0) {
                this.immune = false;
            }
        }
        
        // Special ability (power-up)
        if (keyIsDown(32) && !powerUpActive && score.docs >= 5) { // Space bar
            powerUpActive = true;
            powerUpTimer = POWER_UP_DURATION;
            score.docs -= 5; // Consume 5 docs for power-up
            
            // Apply customer magnet power-up
            activePowerUpType = POWER_UP_TYPES[3]; // Customer Magnet
            activePowerUpType.effect(this);
            
            updateScoreDisplay();
        }
        
        // Check for customer interactions
        this.checkCustomerInteractions();
        
        // Check for doc collection
        this.checkDocCollection();
        
        // Display health bar
        this.displayHealth();
    }
    
    handleMovement() {
        let dx = 0;
        let dy = 0;
        let moved = false;
        
        // Get movement input
        if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) dx -= this.speed; // Left or A
        if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) dx += this.speed; // Right or D
        if (keyIsDown(UP_ARROW) || keyIsDown(87)) dy -= this.speed; // Up or W
        if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) dy += this.speed; // Down or S
        
        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            dx = (dx / length) * this.speed;
            dy = (dy / length) * this.speed;
        }
        
        // Try horizontal movement first
        if (dx !== 0) {
            if (!gameMap.checkCollision(this.x + dx, this.y, this.width, this.height)) {
                this.x += dx;
                moved = true;
            } else {
                // Try to slide along walls
                const slideAmount = 5;
                if (!gameMap.checkCollision(this.x + dx, this.y - slideAmount, this.width, this.height)) {
                    this.x += dx;
                    this.y -= slideAmount;
                    moved = true;
                } else if (!gameMap.checkCollision(this.x + dx, this.y + slideAmount, this.width, this.height)) {
                    this.x += dx;
                    this.y += slideAmount;
                    moved = true;
                }
            }
        }
        
        // Try vertical movement
        if (dy !== 0) {
            if (!gameMap.checkCollision(this.x, this.y + dy, this.width, this.height)) {
                this.y += dy;
                moved = true;
            } else {
                // Try to slide along walls
                const slideAmount = 5;
                if (!gameMap.checkCollision(this.x - slideAmount, this.y + dy, this.width, this.height)) {
                    this.x -= slideAmount;
                    this.y += dy;
                    moved = true;
                } else if (!gameMap.checkCollision(this.x + slideAmount, this.y + dy, this.width, this.height)) {
                    this.x += slideAmount;
                    this.y += dy;
                    moved = true;
                }
            }
        }
        
        // Check if player is stuck
        if ((dx !== 0 || dy !== 0) && !moved) {
            // If player hasn't moved for 2 seconds, try to unstuck
            if (Date.now() - this.lastMoveTime > 2000) {
                // Try to teleport slightly away from current position
                for (let i = 0; i < 8; i++) {
                    const angle = i * (Math.PI / 4);
                    const testX = this.x + Math.cos(angle) * this.width;
                    const testY = this.y + Math.sin(angle) * this.width;
                    
                    if (!gameMap.checkCollision(testX, testY, this.width, this.height)) {
                        this.x = testX;
                        this.y = testY;
                        moved = true;
                        break;
                    }
                }
                
                // If still stuck, clear area around player
                if (!moved) {
                    gameMap.clearArea(this.x, this.y, this.width * 2);
                }
            }
        } else if (moved) {
            this.lastMoveTime = Date.now();
        }
    }
    
    checkCustomerInteractions() {
        for (let i = 0; i < customers.length; i++) {
            const customer = customers[i];
            const distance = dist(this.x, this.y, customer.x, customer.y);
            
            if (distance < INTERACTION_RANGE) {
                // Initialize progress if not already
                if (!this.interactionProgress[customer.id]) {
                    this.interactionProgress[customer.id] = 0;
                }
                
                // Increase interaction progress
                this.interactionProgress[customer.id] += (powerUpActive && activePowerUpType && activePowerUpType.name === "Customer Magnet" ? 2 : 1);
                
                // Visual feedback
                stroke(0, 200, 255);
                strokeWeight(2);
                noFill();
                const progressRadius = map(this.interactionProgress[customer.id], 0, 100, 20, 40);
                ellipse(customer.x, customer.y, progressRadius * 2);
                
                // Check if interaction is complete
                if (this.interactionProgress[customer.id] >= 100) {
                    // Customer gained!
                    score.customers++;
                    score.total += CUSTOMER_POINTS;
                    updateScoreDisplay();
                    
                    // Remove customer
                    customers.splice(i, 1);
                    delete this.interactionProgress[customer.id];
                    i--;
                    
                    // Spawn a new customer
                    setTimeout(spawnCustomer, 2000);
                    
                    // Heal player a bit
                    this.health = min(100, this.health + 5);
                }
            } else if (this.interactionProgress[customer.id]) {
                // Decrease progress when out of range
                this.interactionProgress[customer.id] -= 0.5;
                if (this.interactionProgress[customer.id] <= 0) {
                    delete this.interactionProgress[customer.id];
                }
            }
        }
    }
    
    checkDocCollection() {
        for (let i = 0; i < docs.length; i++) {
            const doc = docs[i];
            const distance = dist(this.x, this.y, doc.x, doc.y);
            
            if (distance < this.width) {
                // Collect document
                score.docs++;
                
                // Check if it's a special doc
                if (doc.isSpecial) {
                    score.total += SPECIAL_DOC_POINTS;
                    // Special effect for special doc
                    this.health = min(100, this.health + 10); // Heal more with special docs
                } else {
                    score.total += DOC_POINTS;
                }
                
                updateScoreDisplay();
                
                // Remove doc
                docs.splice(i, 1);
                i--;
                
                // Visual effect for doc collection
                // (would add particle effect here in a more complete implementation)
            }
        }
    }
    
    displayHealth() {
        // Health bar above player
        const barWidth = this.width;
        const barHeight = 8;
        const x = this.x - barWidth / 2;
        const y = this.y - this.height / 2 - 15;
        
        // Background
        noStroke();
        fill(100);
        rect(x, y, barWidth, barHeight, 4);
        
        // Health
        if (this.health > 60) {
            fill(0, 255, 0); // Green
        } else if (this.health > 30) {
            fill(255, 255, 0); // Yellow
        } else {
            fill(255, 0, 0); // Red
        }
        
        rect(x, y, barWidth * (this.health / 100), barHeight, 4);
    }
    
    display() {
        push();
        translate(this.x, this.y);
        rotate(this.angle);
        
        // Draw immunity effect if active
        if (playerImmunity) {
            // Pulsing shield effect
            noFill();
            stroke(0, 200, 255, 150 + sin(frameCount * 0.1) * 100);
            strokeWeight(3);
            ellipse(0, 0, this.width * 1.5, this.width * 1.5);
        }
        
        // Draw shield if active
        if (this.shielded) {
            noFill();
            stroke(0, 255, 200, 150 + sin(frameCount * 0.1) * 100);
            strokeWeight(3);
            ellipse(0, 0, this.width * 1.3, this.width * 1.3);
        }
        
        // Draw "gun" when power-up is active
        if (powerUpActive && activePowerUpType && activePowerUpType.name === "Rapid Fire") {
            fill(255, 0, 0);
            rect(this.width / 2 - 5, -5, 20, 10);
        }
        
        // Draw player
        drawChatbotSprite(window._renderer, this.width);
        
        pop();
        
        // Display health bar
        this.displayHealth();
    }
    
    shoot() {
        const bullet = {
            x: this.x + cos(this.angle) * 30,
            y: this.y + sin(this.angle) * 30,
            angle: this.angle,
            speed: BULLET_SPEED,
            width: 10,
            height: 10
        };
        
        bullets.push(bullet);
    }
    
    takeDamage(amount) {
        // Check for immunity
        if (this.immune || playerImmunity) {
            // Create a shield effect but no damage
            createCollisionEffect(this.x, this.y);
            return; // No damage during immunity
        }
        
        // Apply shield if active
        if (this.shielded) {
            createCollisionEffect(this.x, this.y);
            this.shielded = false;
            return;
        }
        
        this.health -= amount;
        score.total = Math.max(0, score.total - 10); // Ensure score doesn't go negative
        updateScoreDisplay();
        
        if (this.health <= 0) {
            gameState = "gameOver";
        }
        
        // Visual feedback
        screenShake();
        createCollisionEffect(this.x, this.y);
    }
}

// Update functions for game elements
function updateDocs() {
    for (let doc of docs) {
        // Simple floating animation
        doc.y += sin(frameCount * 0.05 + doc.offset) * 0.5;
        
        // Display doc using custom sprite
        push();
        translate(doc.x, doc.y);
        
        // Draw special doc with different color
        if (doc.isSpecial) {
            // Gold glow for special docs
            noStroke();
            fill(255, 215, 0, 50);
            ellipse(0, 0, doc.width * 1.5, doc.width * 1.5);
        }
        
        drawDocSprite(window._renderer, doc.width);
        pop();
    }
}

function updateCustomers() {
    for (let customer of customers) {
        // Move towards a random direction, changing occasionally
        if (frameCount % 60 === 0 || random() < 0.01) {
            customer.angle = random(TWO_PI);
        }
        
        // Calculate movement
        const dx = cos(customer.angle) * customer.speed;
        const dy = sin(customer.angle) * customer.speed;
        
        // Check collision before moving
        if (!gameMap.checkCollision(customer.x + dx, customer.y, customer.width, customer.height)) {
            customer.x += dx;
        } else {
            // Bounce off obstacles
            customer.angle = random(TWO_PI);
        }
        
        if (!gameMap.checkCollision(customer.x, customer.y + dy, customer.width, customer.height)) {
            customer.y += dy;
        } else {
            // Bounce off obstacles
            customer.angle = random(TWO_PI);
        }
        
        // Display customer using custom sprite
        push();
        translate(customer.x, customer.y);
        drawCustomerSprite(window._renderer, customer.width);
        pop();
        
        // Show "?" bubble above customer
        fill(255);
        stroke(0);
        ellipse(customer.x + 15, customer.y - 25, 20, 20);
        fill(0);
        textSize(14);
        textAlign(CENTER, CENTER);
        text("?", customer.x + 15, customer.y - 25);
    }
}

function updateBugs() {
    for (let i = 0; i < bugs.length; i++) {
        const bug = bugs[i];
        
        // Move towards player
        const angle = atan2(player.y - bug.y, player.x - bug.x);
        bug.x += cos(angle) * bug.speed;
        bug.y += sin(angle) * bug.speed;
        
        // Display bug using custom sprite
        push();
        translate(bug.x, bug.y);
        drawBugSprite(window._renderer, bug.width);
        pop();
        
        // Check collision with player
        const distance = dist(bug.x, bug.y, player.x, player.y);
        if (distance < (bug.width + player.width) / 2) {
            // Player takes damage
            player.takeDamage(5); // Reduced from 10
            
            // Score penalty
            score.total = max(0, score.total - 10); // Reduced from 20
            updateScoreDisplay();
            
            // Remove bug
            bugs.splice(i, 1);
            i--;
            
            // Spawn a new bug
            setTimeout(spawnBug, 3000); // Increased from 2000
            
            // Visual effect for collision
            createCollisionEffect(player.x, player.y);
            
            // Screen shake effect
            if (!player.shielded) {
                screenShake();
            }
        }
        
        // Check collision with bullets
        for (let j = 0; j < bullets.length; j++) {
            const bullet = bullets[j];
            const bulletDistance = dist(bug.x, bug.y, bullet.x, bullet.y);
            
            if (bulletDistance < (bug.width + bullet.width) / 2) {
                // Bug hit!
                bugs.splice(i, 1);
                i--;
                
                // Remove bullet
                bullets.splice(j, 1);
                j--;
                
                // Add points for killing a bug
                score.total += 10; // Increased from 5
                updateScoreDisplay();
                
                // Spawn a new bug
                setTimeout(spawnBug, 4000); // Increased from 3000
                
                // Visual effect for hit
                createBugDeathEffect(bug.x, bug.y);
                break;
            }
        }
    }
}

function updateBullets() {
    for (let i = 0; i < bullets.length; i++) {
        const bullet = bullets[i];
        
        // Move bullet
        bullet.x += cos(bullet.angle) * bullet.speed;
        bullet.y += sin(bullet.angle) * bullet.speed;
        
        // Display bullet using custom sprite
        push();
        translate(bullet.x, bullet.y);
        drawBulletSprite(window._renderer, bullet.width);
        pop();
        
        // Check if bullet is out of bounds
        if (bullet.x < 0 || bullet.x > width || bullet.y < 0 || bullet.y > height) {
            bullets.splice(i, 1);
            i--;
            continue;
        }
        
        // Check collision with obstacles
        if (gameMap.checkCollision(bullet.x, bullet.y, bullet.width, bullet.height)) {
            bullets.splice(i, 1);
            i--;
        }
    }
}

// Update power-ups
function updatePowerUps() {
    for (let i = 0; i < powerUps.length; i++) {
        const powerUp = powerUps[i];
        
        // Simple floating animation
        powerUp.y += sin(frameCount * 0.05 + powerUp.offset) * 0.5;
        
        // Display power-up
        push();
        translate(powerUp.x, powerUp.y);
        
        // Draw power-up with its color
        fill(powerUp.type.color[0], powerUp.type.color[1], powerUp.type.color[2]);
        stroke(255);
        strokeWeight(2);
        ellipse(0, 0, powerUp.width, powerUp.width);
        
        // Draw power-up icon/symbol
        fill(255);
        textSize(powerUp.width * 0.5);
        textAlign(CENTER, CENTER);
        text("P", 0, 0);
        
        pop();
        
        // Check if player collected the power-up
        const distance = dist(player.x, player.y, powerUp.x, powerUp.y);
        if (distance < player.width / 2 + powerUp.width / 2) {
            // Activate power-up
            activatePowerUp(powerUp.type);
            
            // Remove power-up
            powerUps.splice(i, 1);
            i--;
        }
    }
}

// Activate power-up
function activatePowerUp(powerUpType) {
    // If there's an active power-up, reset its effects
    if (powerUpActive && activePowerUpType) {
        activePowerUpType.reset(player);
    }
    
    // Set new power-up
    powerUpActive = true;
    powerUpTimer = POWER_UP_DURATION;
    activePowerUpType = powerUpType;
    
    // Apply power-up effect
    powerUpType.effect(player);
    
    // Visual effect for power-up activation
    // (would add particle effect here in a more complete implementation)
}

// Spawn functions
function spawnCustomer() {
    let validPosition = false;
    let x, y;
    let attempts = 0;
    
    while (!validPosition && attempts < 20) {
        x = random(width);
        y = random(height);
        
        // Check if position is valid (not inside a wall)
        if (!gameMap.checkCollision(x, y, 40, 40)) {
            validPosition = true;
        }
        
        attempts++;
    }
    
    // If we couldn't find a valid position, use a position near the player
    if (!validPosition) {
        const angle = random(TWO_PI);
        x = player.x + cos(angle) * 200;
        y = player.y + sin(angle) * 200;
        
        // Ensure within bounds
        x = constrain(x, 50, width - 50);
        y = constrain(y, 50, height - 50);
        
        // Clear area if needed
        gameMap.clearArea(x, y, 50);
    }
    
    const customer = {
        id: Date.now() + random(1000),
        x: x,
        y: y,
        width: 40,
        height: 40,
        speed: CUSTOMER_SPEED,
        angle: random(TWO_PI)
    };
    
    customers.push(customer);
}

function spawnDoc(forceSpecial = false) {
    const isSpecial = forceSpecial || random() < specialDocChance;
    
    let validPosition = false;
    let x, y;
    let attempts = 0;
    
    while (!validPosition && attempts < 20) {
        x = random(width);
        y = random(height);
        
        // Check if position is valid (not inside a wall)
        if (!gameMap.checkCollision(x, y, 30, 30)) {
            validPosition = true;
        }
        
        attempts++;
    }
    
    // If we couldn't find a valid position, use a position near the player
    if (!validPosition) {
        const angle = random(TWO_PI);
        x = player.x + cos(angle) * 150;
        y = player.y + sin(angle) * 150;
        
        // Ensure within bounds
        x = constrain(x, 30, width - 30);
        y = constrain(y, 30, height - 30);
    }
    
    const doc = {
        x: x,
        y: y,
        width: 30,
        height: 30,
        offset: random(TWO_PI), // For floating animation
        isSpecial: isSpecial
    };
    
    docs.push(doc);
}

function spawnBug() {
    // Spawn bug at the edge of the screen
    let x, y;
    if (random() < 0.5) {
        x = random() < 0.5 ? 0 : width;
        y = random(height);
    } else {
        x = random(width);
        y = random() < 0.5 ? 0 : height;
    }
    
    const bug = {
        x: x,
        y: y,
        width: 40,
        height: 40,
        speed: BUG_SPEED
    };
    
    bugs.push(bug);
}

function spawnPowerUp() {
    const powerUpType = POWER_UP_TYPES[Math.floor(random(POWER_UP_TYPES.length))];
    
    const powerUp = {
        x: random(width),
        y: random(height),
        width: 30,
        height: 30,
        offset: random(TWO_PI), // For floating animation
        type: powerUpType
    };
    
    // Make sure power-up doesn't spawn inside an obstacle
    while (gameMap.checkCollision(powerUp.x, powerUp.y, powerUp.width, powerUp.height)) {
        powerUp.x = random(width);
        powerUp.y = random(height);
    }
    
    powerUps.push(powerUp);
}

// Helper functions
function updateScoreDisplay() {
    document.getElementById('customer-count').textContent = score.customers;
    document.getElementById('docs-count').textContent = score.docs;
    document.getElementById('total-score').textContent = score.total;
}

// Window resize handler
function windowResized() {
    resizeCanvas(windowWidth * 0.9, 600);
}

// Improve keyboard handling
function keyPressed() {
    if (gameState === "enterName" && inputActive) {
        if (keyCode === ENTER) {
            // Save score to leaderboard
            if (playerName.trim() !== "") {
                addScoreToLeaderboard(playerName, score.total, level);
                gameState = "playing";
                restartGame();
            }
        } else if (keyCode === BACKSPACE) {
            // Remove last character
            playerName = playerName.slice(0, -1);
            return false; // Prevent browser back navigation
        } else if (keyCode >= 32 && keyCode <= 126 && playerName.length < 15) {
            // Add character (only printable ASCII)
            playerName += key;
        }
    }
    return true;
}

// Create visual effect for collision
function createCollisionEffect(x, y) {
    // Create a div for the collision effect
    const collisionDiv = document.createElement('div');
    collisionDiv.style.position = 'absolute';
    collisionDiv.style.top = y + 'px';
    collisionDiv.style.left = x + 'px';
    collisionDiv.style.width = '100px';
    collisionDiv.style.height = '100px';
    collisionDiv.style.transform = 'translate(-50%, -50%)';
    collisionDiv.style.backgroundColor = player.shielded ? 'rgba(0, 100, 255, 0.5)' : 'rgba(255, 0, 0, 0.5)';
    collisionDiv.style.borderRadius = '50%';
    collisionDiv.style.zIndex = '900';
    collisionDiv.style.pointerEvents = 'none';
    
    // Animation
    collisionDiv.style.animation = 'collision 0.5s forwards';
    
    // Add animation style if not already added
    if (!document.getElementById('collision-animation')) {
        const style = document.createElement('style');
        style.id = 'collision-animation';
        style.innerHTML = `
            @keyframes collision {
                0% { opacity: 1; width: 20px; height: 20px; }
                100% { opacity: 0; width: 100px; height: 100px; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(collisionDiv);
    
    // Remove the div after animation completes
    setTimeout(() => {
        document.body.removeChild(collisionDiv);
    }, 500);
}

// Create visual effect for bug death
function createBugDeathEffect(x, y) {
    // Create a div for the bug death effect
    const deathDiv = document.createElement('div');
    deathDiv.style.position = 'absolute';
    deathDiv.style.top = y + 'px';
    deathDiv.style.left = x + 'px';
    deathDiv.style.width = '50px';
    deathDiv.style.height = '50px';
    deathDiv.style.transform = 'translate(-50%, -50%)';
    deathDiv.style.backgroundColor = 'rgba(255, 50, 50, 0.7)';
    deathDiv.style.borderRadius = '50%';
    deathDiv.style.zIndex = '900';
    deathDiv.style.pointerEvents = 'none';
    
    // Animation
    deathDiv.style.animation = 'bugDeath 0.5s forwards';
    
    // Add animation style if not already added
    if (!document.getElementById('bug-death-animation')) {
        const style = document.createElement('style');
        style.id = 'bug-death-animation';
        style.innerHTML = `
            @keyframes bugDeath {
                0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.5); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(deathDiv);
    
    // Remove the div after animation completes
    setTimeout(() => {
        document.body.removeChild(deathDiv);
    }, 500);
}

// Screen shake effect
function screenShake() {
    const gameCanvas = document.getElementById('game-canvas');
    if (gameCanvas) {
        gameCanvas.style.animation = 'shake 0.5s';
        
        // Add animation style if not already added
        if (!document.getElementById('shake-animation')) {
            const style = document.createElement('style');
            style.id = 'shake-animation';
            style.innerHTML = `
                @keyframes shake {
                    0% { transform: translate(0, 0); }
                    10% { transform: translate(-5px, -5px); }
                    20% { transform: translate(5px, 5px); }
                    30% { transform: translate(-5px, 5px); }
                    40% { transform: translate(5px, -5px); }
                    50% { transform: translate(-5px, 0); }
                    60% { transform: translate(5px, 0); }
                    70% { transform: translate(0, 5px); }
                    80% { transform: translate(0, -5px); }
                    90% { transform: translate(-2px, 2px); }
                    100% { transform: translate(0, 0); }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Remove animation class after it completes
        setTimeout(() => {
            gameCanvas.style.animation = '';
        }, 500);
    }
}

// Simplify and fix the resetGame function
function resetGame() {
    console.log("Resetting game...");
    
    // Reset game state
    gameState = "playing";
    
    // Reset score
    score = {
        customers: 0,
        docs: 0,
        total: 0
    };
    
    // Reset level
    level = 1;
    levelGoal = 200;
    
    // Clear all game objects
    customers = [];
    docs = [];
    bugs = [];
    bullets = [];
    powerUps = [];
    
    // Create new game map
    gameMap = new GameMap(width, height);
    
    // Create player at center with guaranteed clear area
    const safePosition = getSafeStartingPosition();
    player = new Player(safePosition.x, safePosition.y);
    
    // Give player temporary immunity
    playerImmunity = true;
    immunityTimer = IMMUNITY_DURATION;
    player.immune = true;
    player.immuneTimer = 180; // 3 seconds
    
    // Spawn initial game objects
    for (let i = 0; i < 4; i++) {
        spawnCustomer();
    }
    
    for (let i = 0; i < 8; i++) {
        spawnDoc();
    }
    
    spawnBug();
    
    // Reset UI
    updateScoreDisplay();
    
    // Set game as initialized
    gameInitialized = true;
    
    console.log("Game reset complete");
}

// Add window error handling to help diagnose issues
window.addEventListener('error', function(event) {
    console.error('Global error caught:', event.error);
}); 