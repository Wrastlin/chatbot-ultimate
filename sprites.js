// Custom sprite definitions for Chatbase Hero game
// This file contains functions to draw custom sprites using p5.js

// Draw chatbot player sprite
function drawChatbotSprite(p, size) {
    // Base circle (chatbot face)
    fill(0, 180, 255);
    stroke(255);
    strokeWeight(size * 0.05);
    ellipse(0, 0, size, size);
    
    // Chat bubble shape on top
    fill(255);
    noStroke();
    beginShape();
    vertex(-size * 0.2, -size * 0.3);
    vertex(size * 0.3, -size * 0.3);
    vertex(size * 0.3, -size * 0.1);
    vertex(size * 0.1, -size * 0.1);
    vertex(0, size * 0.05);
    vertex(-size * 0.1, -size * 0.1);
    vertex(-size * 0.2, -size * 0.1);
    endShape(CLOSE);
    
    // Eyes
    fill(255);
    ellipse(-size * 0.15, 0, size * 0.2, size * 0.2);
    ellipse(size * 0.15, 0, size * 0.2, size * 0.2);
    
    // Pupils
    fill(0);
    ellipse(-size * 0.15, 0, size * 0.1, size * 0.1);
    ellipse(size * 0.15, 0, size * 0.1, size * 0.1);
}

// Draw customer sprite
function drawCustomerSprite(p, size) {
    // Body
    fill(255, 200, 100);
    stroke(50);
    strokeWeight(size * 0.03);
    ellipse(0, 0, size, size);
    
    // Face
    fill(255, 220, 180);
    ellipse(0, -size * 0.1, size * 0.6, size * 0.6);
    
    // Eyes
    fill(255);
    ellipse(-size * 0.1, -size * 0.1, size * 0.15, size * 0.15);
    ellipse(size * 0.1, -size * 0.1, size * 0.15, size * 0.15);
    
    // Pupils
    fill(50);
    ellipse(-size * 0.1, -size * 0.1, size * 0.07, size * 0.07);
    ellipse(size * 0.1, -size * 0.1, size * 0.07, size * 0.07);
    
    // Mouth
    noFill();
    stroke(50);
    strokeWeight(size * 0.03);
    arc(0, 0, size * 0.3, size * 0.3, 0, PI);
}

// Draw document sprite
function drawDocSprite(p, size) {
    // Document base
    fill(255);
    stroke(100);
    strokeWeight(size * 0.05);
    rect(-size/2, -size/2, size, size, size * 0.1);
    
    // Folded corner
    fill(220);
    beginShape();
    vertex(size/2 - size * 0.2, -size/2);
    vertex(size/2, -size/2 + size * 0.2);
    vertex(size/2, -size/2);
    endShape(CLOSE);
    
    // Text lines
    stroke(180);
    strokeWeight(size * 0.03);
    line(-size * 0.3, -size * 0.2, size * 0.3, -size * 0.2);
    line(-size * 0.3, 0, size * 0.3, 0);
    line(-size * 0.3, size * 0.2, size * 0.2, size * 0.2);
    
    // Chatbase logo hint
    fill(0, 180, 255);
    noStroke();
    ellipse(-size * 0.2, -size * 0.3, size * 0.15, size * 0.15);
}

// Draw bug sprite
function drawBugSprite(p, size) {
    // Bug body
    fill(255, 50, 50);
    stroke(50);
    strokeWeight(size * 0.05);
    ellipse(0, 0, size, size * 0.8);
    
    // Bug eyes
    fill(0);
    noStroke();
    ellipse(-size * 0.2, -size * 0.1, size * 0.15, size * 0.15);
    ellipse(size * 0.2, -size * 0.1, size * 0.15, size * 0.15);
    
    // Antennae
    stroke(50);
    strokeWeight(size * 0.03);
    line(-size * 0.1, -size * 0.3, -size * 0.2, -size * 0.5);
    line(size * 0.1, -size * 0.3, size * 0.2, -size * 0.5);
    fill(0);
    noStroke();
    ellipse(-size * 0.2, -size * 0.5, size * 0.08, size * 0.08);
    ellipse(size * 0.2, -size * 0.5, size * 0.08, size * 0.08);
    
    // Legs
    stroke(50);
    strokeWeight(size * 0.03);
    // Left legs
    line(-size * 0.5, 0, -size * 0.3, 0);
    line(-size * 0.5, -size * 0.2, -size * 0.3, -size * 0.1);
    line(-size * 0.5, size * 0.2, -size * 0.3, size * 0.1);
    // Right legs
    line(size * 0.5, 0, size * 0.3, 0);
    line(size * 0.5, -size * 0.2, size * 0.3, -size * 0.1);
    line(size * 0.5, size * 0.2, size * 0.3, size * 0.1);
}

// Draw bullet sprite
function drawBulletSprite(p, size) {
    // Bullet core
    fill(0, 200, 255);
    noStroke();
    ellipse(0, 0, size, size);
    
    // Glow effect
    fill(0, 200, 255, 100);
    ellipse(0, 0, size * 1.5, size * 1.5);
    
    // Highlight
    fill(255, 255, 255, 200);
    ellipse(-size * 0.2, -size * 0.2, size * 0.3, size * 0.3);
}

// Draw power-up sprite
function drawPowerUpSprite(p, size) {
    // Base
    fill(255, 215, 0); // Gold color
    stroke(255, 150, 0);
    strokeWeight(size * 0.05);
    ellipse(0, 0, size, size);
    
    // AI symbol
    textSize(size * 0.6);
    textAlign(CENTER, CENTER);
    fill(0);
    noStroke();
    text("AI", 0, 0);
    
    // Glow
    noFill();
    stroke(255, 255, 0, 150);
    strokeWeight(size * 0.1);
    ellipse(0, 0, size * 1.2, size * 1.2);
} 