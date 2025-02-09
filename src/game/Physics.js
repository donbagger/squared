export function handleWallCollision(box, canvasWidth, canvasHeight) {
  const bounce = 0.95; // Less dampening on bounce
  const rotationDampen = 0.9; // Less dampening on rotation

  if (box.x <= 0) {
    box.x = 0;
    box.dx *= -bounce;
    box.rotationSpeed = -box.rotationSpeed * rotationDampen;
  } else if (box.x + box.size >= canvasWidth) {
    box.x = canvasWidth - box.size;
    box.dx *= -bounce;
    box.rotationSpeed = -box.rotationSpeed * rotationDampen;
  }
  
  if (box.y <= 0) {
    box.y = 0;
    box.dy *= -bounce;
    box.rotationSpeed = -box.rotationSpeed * rotationDampen;
  } else if (box.y + box.size >= canvasHeight) {
    box.y = canvasHeight - box.size;
    box.dy *= -bounce;
    box.rotationSpeed = -box.rotationSpeed * rotationDampen;
  }
}

export function detectCollision(box1, box2) {
  // Expand collision check area slightly
  const collisionPadding = 2; // Small padding to catch near-misses
  
  // Get the corners of both boxes after rotation
  function getRotatedCorners(box) {
    const corners = [];
    const cos = Math.cos(box.rotation);
    const sin = Math.sin(box.rotation);
    const cx = box.x + box.size / 2;
    const cy = box.y + box.size / 2;
    
    // Add all four corners
    for (let x of [-1, 1]) {
      for (let y of [-1, 1]) {
        const px = (box.size / 2 + collisionPadding) * x;
        const py = (box.size / 2 + collisionPadding) * y;
        
        // Rotate point around center
        const rx = cx + (px * cos - py * sin);
        const ry = cy + (px * sin + py * cos);
        corners.push({x: rx, y: ry});
      }
    }
    return corners;
  }

  // Get corners for both boxes
  const corners1 = getRotatedCorners(box1);
  const corners2 = getRotatedCorners(box2);

  // Separating Axis Theorem (SAT) for rotated rectangles
  function getAxes(corners) {
    const axes = [];
    for (let i = 0; i < corners.length; i++) {
      const p1 = corners[i];
      const p2 = corners[(i + 1) % corners.length];
      const edge = {
        x: p2.x - p1.x,
        y: p2.y - p1.y
      };
      // Get normal (perpendicular) axis
      axes.push({
        x: -edge.y,
        y: edge.x
      });
    }
    return axes;
  }

  // Project corners onto axis
  function projectOntoAxis(corners, axis) {
    let min = Infinity;
    let max = -Infinity;
    
    for (const corner of corners) {
      const projection = (corner.x * axis.x + corner.y * axis.y) /
        Math.sqrt(axis.x * axis.x + axis.y * axis.y);
      min = Math.min(min, projection);
      max = Math.max(max, projection);
    }
    
    return { min, max };
  }

  // Check for overlap on all axes
  const axes = [...getAxes(corners1), ...getAxes(corners2)];
  
  for (const axis of axes) {
    const projection1 = projectOntoAxis(corners1, axis);
    const projection2 = projectOntoAxis(corners2, axis);
    
    // Check for gap between projections
    if (projection1.max < projection2.min || projection2.max < projection1.min) {
      return false; // Gap found, no collision
    }
  }

  // Additional check for fast-moving objects
  const relativeSpeed = {
    x: box1.dx - box2.dx,
    y: box1.dy - box2.dy
  };
  
  const speedMagnitude = Math.sqrt(relativeSpeed.x * relativeSpeed.x + relativeSpeed.y * relativeSpeed.y);
  
  // If boxes are moving fast, do an additional sweep check
  if (speedMagnitude > box1.size / 2) {
    const sweepPadding = speedMagnitude / 60; // Adjust based on frame rate
    const expandedCheck = detectCollision({
      ...box1,
      size: box1.size + sweepPadding * 2
    }, box2);
    
    if (expandedCheck) return true;
  }

  return true; // Collision detected
}

function getCorners(box) {
  const cos = Math.cos(box.rotation);
  const sin = Math.sin(box.rotation);
  const halfSize = box.size / 2;
  const centerX = box.x + halfSize;
  const centerY = box.y + halfSize;

  // Calculate all four corners relative to center, then rotate and translate
  return [
    rotatePoint(-halfSize, -halfSize, cos, sin, centerX, centerY),
    rotatePoint(halfSize, -halfSize, cos, sin, centerX, centerY),
    rotatePoint(halfSize, halfSize, cos, sin, centerX, centerY),
    rotatePoint(-halfSize, halfSize, cos, sin, centerX, centerY)
  ];
}

function rotatePoint(x, y, cos, sin, centerX, centerY) {
  return {
    x: centerX + (x * cos - y * sin),
    y: centerY + (x * sin + y * cos)
  };
}

function isPointInBox(point, box) {
  // Transform point into box's local space
  const cos = Math.cos(-box.rotation);
  const sin = Math.sin(-box.rotation);
  const dx = point.x - (box.x + box.size/2);
  const dy = point.y - (box.y + box.size/2);
  
  // Rotate point to align with box
  const rx = dx * cos - dy * sin;
  const ry = dx * sin + dy * cos;

  // Check if rotated point is inside box bounds
  return Math.abs(rx) < box.size/2 && Math.abs(ry) < box.size/2;
}

function normalizeVelocity(box, baseSpeed) {
  const currentSpeed = Math.sqrt(box.dx * box.dx + box.dy * box.dy);
  if (currentSpeed > 0) {
    const scale = baseSpeed / currentSpeed;
    box.dx *= scale;
    box.dy *= scale;
  }
}

function calculateRotationImpact(box1, box2, nx, ny) {
  // Calculate impact point and relative position
  const impactPoint = {
    x: (box1.x + box2.x + box1.size) / 2,
    y: (box1.y + box2.y + box1.size) / 2
  };
  
  // Calculate distance from center to impact
  const box1Center = { x: box1.x + box1.size/2, y: box1.y + box1.size/2 };
  const box2Center = { x: box2.x + box2.size/2, y: box2.y + box2.size/2 };
  
  // Calculate impact angle relative to box centers
  const angle1 = Math.atan2(impactPoint.y - box1Center.y, impactPoint.x - box1Center.x);
  const angle2 = Math.atan2(impactPoint.y - box2Center.y, impactPoint.x - box2Center.x);
  
  // Calculate tangential velocity component
  const relativeVel = Math.sqrt(
    Math.pow(box2.dx - box1.dx, 2) + 
    Math.pow(box2.dy - box1.dy, 2)
  );
  
  // Return rotation speed changes based on impact
  return {
    box1Rotation: relativeVel * Math.sin(angle1) * 0.01,
    box2Rotation: relativeVel * Math.sin(angle2) * 0.01
  };
}

export function resolveCollision(box1, box2) {
  const center1 = {
    x: box1.x + box1.size / 2,
    y: box1.y + box1.size / 2
  };
  
  const center2 = {
    x: box2.x + box2.size / 2,
    y: box2.y + box2.size / 2
  };

  const dx = center2.x - center1.x;
  const dy = center2.y - center1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance === 0) return false;

  // Calculate collision point for sword dropping
  const collisionPoint = {
    x: (center1.x + center2.x) / 2,
    y: (center1.y + center2.y) / 2
  };

  // Simplified damage logic - any contact from sword bearer deals damage
  const damage = 1;
  
  // If box1 has sword, damage box2 and drop sword
  if (box1.hasSword) {
    box2.takeDamage(damage);
    box1.sword.drop(collisionPoint);
    box1.hasSword = false;
    box1.sword = null;
  }
  
  // If box2 has sword, damage box1 and drop sword
  if (box2.hasSword) {
    box1.takeDamage(damage);
    box2.sword.drop(collisionPoint);
    box2.hasSword = false;
    box2.sword = null;
  }

  // Normal collision resolution
  const nx = dx / distance;
  const ny = dy / distance;
  const dvx = box2.dx - box1.dx;
  const dvy = box2.dy - box1.dy;
  const impactSpeed = dvx * nx + dvy * ny;
  
  if (impactSpeed > 0) return false;

  const restitution = 0.9;
  const j = -(1 + restitution) * impactSpeed / 2;

  box1.dx -= j * nx;
  box1.dy -= j * ny;
  box2.dx += j * nx;
  box2.dy += j * ny;

  const baseSpeed = 7;
  normalizeVelocity(box1, baseSpeed);
  normalizeVelocity(box2, baseSpeed);

  // Apply rotation speed increase
  box1.rotationSpeed *= 1.2;
  box2.rotationSpeed *= 1.2;

  // Separate boxes
  const minSeparation = (box1.size + box2.size) * 0.51;
  if (distance < minSeparation) {
    const separationAmount = (minSeparation - distance) / 2;
    box1.x -= nx * separationAmount;
    box1.y -= ny * separationAmount;
    box2.x += nx * separationAmount;
    box2.y += ny * separationAmount;
  }

  return true;
}

export function detectSwordPickup(box, sword) {
  if (sword.isAttached) return null;

  const squareEdges = box.getEdgePoints();
  const swordPos = { x: sword.x + sword.size / 2, y: sword.y + sword.size / 2 };
  const pickupRange = 60; // Adjust this value to make pickup easier/harder

  for (const [edge, point] of Object.entries(squareEdges)) {
    const dx = point.x - swordPos.x;
    const dy = point.y - swordPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < pickupRange) {
      return edge;
    }
  }

  return null;
}

export function checkSwordDamage(attacker, defender) {
  if (!attacker.hasSword) return false;

  const attackerPoints = attacker.getEdgePoints();
  const defenderPoints = defender.getEdgePoints();
  const swordEdge = attacker.sword.attachedEdge;
  const attackPoint = attackerPoints[swordEdge];

  // Check each point of the defender for sword damage
  for (const point of Object.values(defenderPoints)) {
    const dx = point.x - attackPoint.x;
    const dy = point.y - attackPoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Increased damage range slightly
    if (distance < attacker.size * 0.9) {
      return true;
    }
  }

  return false;
}

export function checkDisarm(attacker, defender) {
  // Only check if defender has the sword
  if (!defender.hasSword) return false;

  const attackerPoints = attacker.getEdgePoints();
  const defenderPoints = defender.getEdgePoints();
  
  // Get non-sword edges of the defender
  const defenderNonSwordEdges = getUnarmedEdges(defender);

  // For disarm, ANY edge of the attacker can hit ANY non-sword edge of the defender
  const allEdges = ['top', 'right', 'bottom', 'left'];
  
  for (const aEdge of allEdges) {
    const attackPoint = attackerPoints[aEdge];
    for (const dEdge of defenderNonSwordEdges) {
      const defendPoint = defenderPoints[dEdge];
      
      const dx = attackPoint.x - defendPoint.x;
      const dy = attackPoint.y - defendPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 20) {
        return true;
      }
    }
  }
  
  return false;
}

function getUnarmedEdges(square) {
  const allEdges = ['top', 'right', 'bottom', 'left'];
  if (!square.hasSword || !square.sword) return allEdges;
  return allEdges.filter(edge => edge !== square.sword.attachedEdge);
}

function edgesCollide(square1, edge1, square2, edge2) {
  // Simplified edge collision check
  const tolerance = 10;
  switch(edge1) {
    case 'top':
      return Math.abs(square1.y - (square2.y + square2.size)) < tolerance;
    case 'bottom':
      return Math.abs((square1.y + square1.size) - square2.y) < tolerance;
    case 'left':
      return Math.abs(square1.x - (square2.x + square2.size)) < tolerance;
    case 'right':
      return Math.abs((square1.x + square1.size) - square2.x) < tolerance;
  }
}

// Make sure getEdgePoints is working correctly
export function getEdgePoints(square) {
  const centerX = square.x + square.size / 2;
  const centerY = square.y + square.size / 2;
  const halfSize = square.size / 2;

  // Calculate points for each edge center
  return {
    top: {
      x: centerX + Math.sin(square.rotation) * halfSize,
      y: centerY - Math.cos(square.rotation) * halfSize
    },
    right: {
      x: centerX + Math.cos(square.rotation) * halfSize,
      y: centerY + Math.sin(square.rotation) * halfSize
    },
    bottom: {
      x: centerX - Math.sin(square.rotation) * halfSize,
      y: centerY + Math.cos(square.rotation) * halfSize
    },
    left: {
      x: centerX - Math.cos(square.rotation) * halfSize,
      y: centerY - Math.sin(square.rotation) * halfSize
    }
  };
}

export function normalizeRotationSpeed(box) {
  const maxRotationSpeed = 0.2; // Maximum allowed rotation speed
  const minRotationSpeed = 0.01; // Minimum allowed rotation speed

  if (Math.abs(box.rotationSpeed) > maxRotationSpeed) {
    box.rotationSpeed = Math.sign(box.rotationSpeed) * maxRotationSpeed;
  } else if (Math.abs(box.rotationSpeed) < minRotationSpeed) {
    box.rotationSpeed = Math.sign(box.rotationSpeed) * minRotationSpeed;
  }
}
  
  