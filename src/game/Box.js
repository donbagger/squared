import { handleWallCollision, normalizeRotationSpeed } from './Physics';

export default class Box {
  constructor(x, y, size, color, speed, rotationSpeed) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.color = color;
    this.dx = speed;
    this.dy = speed;
    this.rotation = 0;
    this.rotationSpeed = rotationSpeed;
    this.hasSword = false;
    this.sword = null;
    this.hp = 10;
    this.maxHp = 10;
    this.damageFlashTime = 0;
    this.isDead = false;

    this.imageLoaded = false;
    this.image = new Image();
    
    this.image.onload = () => {
      this.imageLoaded = true;
      console.log(`${color} box image loaded successfully`);
    };

    // Use root-relative paths (from public folder)
    if (color === 'blue') {
      this.image.src = '/wawrzyn.jpg';  // No src/assets prefix
    } else if (color === 'red') {
      this.image.src = '/mlody.jpg';    // No src/assets prefix
    }
  }

  // Get edge points for sword pickup detection
  getEdgePoints() {
    const halfSize = this.size / 2;
    const centerX = this.x + halfSize;
    const centerY = this.y + halfSize;
    
    // Calculate rotated points
    const cos = Math.cos(this.rotation);
    const sin = Math.sin(this.rotation);
    
    return {
      top: {
        x: centerX + (-halfSize * cos),
        y: centerY + (-halfSize * sin)
      },
      right: {
        x: centerX + (halfSize * cos),
        y: centerY + (halfSize * sin)
      },
      bottom: {
        x: centerX + (halfSize * cos),
        y: centerY + (halfSize * sin)
      },
      left: {
        x: centerX + (-halfSize * cos),
        y: centerY + (-halfSize * sin)
      }
    };
  }

  move(canvasWidth, canvasHeight) {
    // Update position
    this.x += this.dx;
    this.y += this.dy;

    // Handle wall collisions using Physics system
    handleWallCollision(this, canvasWidth, canvasHeight);

    // Update rotation
    this.rotation += this.rotationSpeed;
    this.rotation = this.rotation % (Math.PI * 2);
    
    // Keep rotation speed within bounds
    normalizeRotationSpeed(this);
  }

  takeDamage(amount) {
    const damage = Math.ceil(amount); // Round up to ensure at least 1 damage
    this.hp = Math.max(0, this.hp - damage);
    this.damageFlashTime = 10; // Number of frames to show damage flash
    
    if (this.hp <= 0) {
      this.isDead = true;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
    ctx.rotate(this.rotation);

    // Draw damage flash
    if (this.damageFlashTime > 0) {
      ctx.fillStyle = 'white';
      ctx.globalAlpha = this.damageFlashTime / 10;
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
      this.damageFlashTime--;
    }

    // Draw the box
    if (this.imageLoaded && this.image.complete) {
      ctx.globalAlpha = 1;
      try {
        ctx.drawImage(
          this.image,
          -this.size / 2,
          -this.size / 2,
          this.size,
          this.size
        );
      } catch (error) {
        // Fallback to colored rectangle if drawing fails
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
      }
    } else {
      // Fallback while loading
      ctx.fillStyle = this.color;
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    }

    ctx.restore();

    // Draw HP bar
    const hpBarWidth = this.size;
    const hpBarHeight = 5;
    const hpBarY = this.y - 15;
    
    // HP bar background
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.fillRect(this.x, hpBarY, hpBarWidth, hpBarHeight);
    
    // Current HP
    ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
    const currentHpWidth = (this.hp / this.maxHp) * hpBarWidth;
    ctx.fillRect(this.x, hpBarY, currentHpWidth, hpBarHeight);

    // HP text
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText(`${this.hp}`, this.x + this.size/2, hpBarY - 5);
  }
}