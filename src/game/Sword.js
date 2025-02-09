export default class Sword {
  constructor(x, y, size) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.rotation = Math.PI / 4; // Initial rotation when not attached
    this.isAttached = false;
    this.attachedEdge = null;
    this.attachedBox = null;
    this.cooldown = false;
    this.cooldownTime = 1000; // 1 second in milliseconds
    this.cooldownStart = 0;
    
    // Load the sword image
    this.image = new Image();
    this.image.src = '/src/assets/sword.png';
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
    ctx.rotate(this.rotation);
    
    // Draw the sword image
    if (this.image.complete) { // Make sure image is loaded
      // If in cooldown, draw with reduced opacity
      if (this.cooldown) {
        ctx.globalAlpha = 0.5;
      }
      ctx.drawImage(
        this.image, 
        -this.size / 2,
        -this.size / 2, // Adjusted to better align with edge
        this.size,
        this.size
      );
    }

    // Only draw glow when not attached
    if (!this.isAttached) {
      // Draw cooldown circle
      if (this.cooldown) {
        const currentTime = Date.now();
        const elapsed = currentTime - this.cooldownStart;
        const progress = elapsed / this.cooldownTime;
        
        // Background circle
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, this.size/1.5, 0, Math.PI * 2);
        ctx.stroke();
        
        // Filling progress arc
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(0, 0, this.size/1.5, -Math.PI/2, -Math.PI/2 + (Math.PI * 2 * progress));
        ctx.stroke();
      } else {
        // Normal pickup indicator when not in cooldown
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, this.size/1.5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    
    ctx.restore();
  }

  update() {
    // Update cooldown status
    if (this.cooldown) {
      const currentTime = Date.now();
      if (currentTime - this.cooldownStart >= this.cooldownTime) {
        this.cooldown = false;
      }
    }

    if (this.isAttached && this.attachedBox) {
      const halfBoxSize = this.attachedBox.size / 2;
      const boxCenterX = this.attachedBox.x + halfBoxSize;
      const boxCenterY = this.attachedBox.y + halfBoxSize;
      const leanAngle = Math.PI / 6;

      // Position the sword exactly on the edge
      switch (this.attachedEdge) {
        case 'right':
          this.x = this.attachedBox.x + this.attachedBox.size - this.size;
          this.y = boxCenterY - this.size/2;
          this.rotation = this.attachedBox.rotation + leanAngle;
          break;
        case 'left':
          this.x = this.attachedBox.x;
          this.y = boxCenterY - this.size/2;
          this.rotation = this.attachedBox.rotation + Math.PI - leanAngle;
          break;
        case 'top':
          this.x = boxCenterX - this.size/2;
          this.y = this.attachedBox.y;
          this.rotation = this.attachedBox.rotation - Math.PI/2 - leanAngle;
          break;
        case 'bottom':
          this.x = boxCenterX - this.size/2;
          this.y = this.attachedBox.y + this.attachedBox.size - this.size;
          this.rotation = this.attachedBox.rotation + Math.PI/2 + leanAngle;
          break;
      }
    }
  }

  attachTo(box, edge) {
    // Only allow attachment if not in cooldown
    if (!this.cooldown) {
      this.isAttached = true;
      this.attachedEdge = edge;
      this.attachedBox = box;
    }
    return !this.cooldown; // Return whether attachment was successful
  }

  drop(position) {
    this.isAttached = false;
    this.attachedEdge = null;
    this.attachedBox = null;
    this.x = position.x - this.size / 2;
    this.y = position.y - this.size / 2;
    this.rotation = Math.PI / 4; // Reset rotation to default
    
    // Start cooldown
    this.cooldown = true;
    this.cooldownStart = Date.now();
  }

  canBePickedUp() {
    return !this.cooldown && !this.isAttached;
  }
}