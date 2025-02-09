import { detectCollision, resolveCollision, detectSwordPickup } from './Physics';
import Box from './Box';
import Sword from './Sword';

export default class GameState {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = 800;
    this.canvasHeight = 600;
    
    const boxSize = 80;
    const swordSize = 48;
    
    // Load background images
    this.blueBackground = new Image();
    this.blueBackground.src = './src/assets/wawrzyn_bg.jpg';
    this.redBackground = new Image();
    this.redBackground.src = './src/assets/mlody_bg.png';

    // Initialize audio
    this.blueBGM = new Audio('./src/assets/wawrzyn.mp4');
    this.redBGM = new Audio('./src/assets/mlody.mp3');
    
    // Configure audio
    this.blueBGM.loop = true;
    this.redBGM.loop = true;
    this.blueBGM.volume = 0.5;
    this.redBGM.volume = 0.5;
    
    // Track current playing music
    this.currentBGM = null;
    
    const topPadding = 70;
    
    this.boxes = [
      new Box(
        this.canvasWidth * 0.25 - boxSize/2,
        this.canvasHeight * 0.5 - boxSize/2 + topPadding,
        boxSize, 
        'blue', 
        7, 
        0.02
      ),
      new Box(
        this.canvasWidth * 0.75 - boxSize/2,
        this.canvasHeight * 0.5 - boxSize/2 + topPadding,
        boxSize, 
        'red', 
        7, 
        0.02
      )
    ];
    
    this.sword = new Sword(
      this.canvasWidth/2 - swordSize/2,
      this.canvasHeight/2 - swordSize/2 + topPadding,
      swordSize
    );
  }

  update(onUpdate) {
    // Remove dead boxes
    this.boxes = this.boxes.filter(box => !box.isDead);

    // Check for game over
    if (this.boxes.length <= 1) {
      const winner = this.boxes[0];
      if (winner) {
        console.log(`${winner.color} box wins!`);
        // Stop any playing music
        this.stopAllMusic();
      }
    }

    this.sword.update();

    // Check for sword pickup and handle music
    this.boxes.forEach((box) => {
      if (!box.hasSword && this.sword.canBePickedUp()) {
        const pickupEdge = detectSwordPickup(box, this.sword);
        if (pickupEdge) {
          if (this.sword.attachTo(box, pickupEdge)) {
            box.hasSword = true;
            box.sword = this.sword;
            // Play appropriate music when sword is picked up
            this.handleMusic(box.color);
          }
        }
      }
    });

    // If no box has the sword, stop the music
    if (!this.boxes.some(box => box.hasSword)) {
      this.stopAllMusic();
    }

    // Move boxes
    this.boxes.forEach((box) => {
      box.move(this.canvasWidth, this.canvasHeight);
    });

    // Check for collisions between boxes
    if (this.boxes.length >= 2) {
      if (detectCollision(this.boxes[0], this.boxes[1])) {
        resolveCollision(this.boxes[0], this.boxes[1]);
      }
    }

    if (onUpdate) {
      const gameState = {
        hp: this.boxes.map(box => ({
          color: box.color,
          hp: box.hp
        }))
      };
      onUpdate(gameState);
    }
  }

  // New methods for music handling
  handleMusic(boxColor) {
    this.stopAllMusic();
    
    if (boxColor === 'blue') {
      this.blueBGM.currentTime = 0;
      this.blueBGM.play().catch(e => console.log('Audio play failed:', e));
      this.currentBGM = this.blueBGM;
    } else if (boxColor === 'red') {
      this.redBGM.currentTime = 0;
      this.redBGM.play().catch(e => console.log('Audio play failed:', e));
      this.currentBGM = this.redBGM;
    }
  }

  stopAllMusic() {
    this.blueBGM.pause();
    this.blueBGM.currentTime = 0;
    this.redBGM.pause();
    this.redBGM.currentTime = 0;
    this.currentBGM = null;
  }

  draw(ctx) {
    const barHeight = 30;
    const barWidth = this.canvasWidth / 3;
    const padding = 20;
    
    // Clear the game area
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    // Draw background effect based on which box has the sword
    const blueBox = this.boxes.find(box => box.color === 'blue');
    const redBox = this.boxes.find(box => box.color === 'red');
    
    if (blueBox?.hasSword || redBox?.hasSword) {
      ctx.save();
      ctx.globalAlpha = 0.3; // Slightly more visible
      
      // Determine which background to use
      const backgroundImage = blueBox?.hasSword ? this.blueBackground : this.redBackground;
      
      // Draw background with a slight animation
      const time = Date.now() / 1000;
      const scale = 1.1 + Math.sin(time) * 0.05; // Subtle pulsing effect
      
      // Calculate centered background position
      const bgWidth = this.canvasWidth * scale;
      const bgHeight = this.canvasHeight * scale;
      const bgX = (this.canvasWidth - bgWidth) / 2;
      const bgY = (this.canvasHeight - bgHeight) / 2;
      
      if (backgroundImage.complete) {
        ctx.drawImage(
          backgroundImage,
          bgX,
          bgY,
          bgWidth,
          bgHeight
        );
      }
      ctx.restore();
    }

    // Draw HP bars
    // Blue box HP bar
    if (blueBox) {
      ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
      ctx.fillRect(padding, padding, barWidth, barHeight);
      
      ctx.fillStyle = 'rgba(0, 0, 255, 0.8)';
      const blueHpWidth = (blueBox.hp / blueBox.maxHp) * barWidth;
      ctx.fillRect(padding, padding, blueHpWidth, barHeight);
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.ceil(blueBox.hp)} HP`, padding + barWidth/2, padding + barHeight/1.5);
    }
    
    // Red box HP bar
    if (redBox) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.fillRect(this.canvasWidth - barWidth - padding, padding, barWidth, barHeight);
      
      ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
      const redHpWidth = (redBox.hp / redBox.maxHp) * barWidth;
      ctx.fillRect(
        this.canvasWidth - padding - redHpWidth, 
        padding, 
        redHpWidth, 
        barHeight
      );
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${Math.ceil(redBox.hp)} HP`, 
        this.canvasWidth - padding - barWidth/2, 
        padding + barHeight/1.5
      );
    }
    
    // Draw boxes and sword
    this.boxes.forEach(box => box.draw(ctx));
    this.sword.draw(ctx);
  }
}
