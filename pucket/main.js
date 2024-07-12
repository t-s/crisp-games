title = "PUCKET";

description = `
Click to place player
or select a puck
Drag back and release
to shoot
`;

characters = [
  `
  cccc
 cccccc
cccccccc
cccccccc
 cccccc
  cccc
  `,
  `
  rrrr
 rrrrrr
rrrrrrrr
rrrrrrrr
 rrrrrr
  rrrr
  `,
  `
   ll
  llll
 llllll
llllllll
 llllll
  llll
   ll
  `
];

window.G = {
  WIDTH: 100,
  HEIGHT: 200,
  PLAYER_SPEED: 2,
  AI_SPEED: 0.1,
  MAX_SHOT_POWER: 3,
  DISC_RADIUS: 3,
  HOLE_WIDTH: 20,
  HOLE_HEIGHT: 10,
  FRICTION: 0.98,
  PLAYER_AREA: 60,
  AI_AREA: 60,
  WALL_Y: 100,
  WALL_THICKNESS: 2,
  COLLISION_DAMPENING: 0.8
};

options = {
  viewSize: {x: G.WIDTH, y: G.HEIGHT},
  isPlayingBgm: false,
  isReplayEnabled: true,
  seed: 1
};

/**
 * @typedef {{
 * pos: Vector,
 * vel: Vector
 * }} Disc
 */

/** @type { Disc [] } */
let playerDiscs;
/** @type { Disc [] } */
let aiDiscs;
/** @type { Vector } */
let player;
/** @type { Vector } */
let ai;
/** @type { Vector } */
let aimVector;
/** @type { boolean } */
let isAiming;
/** @type { Vector } */
let aimStart;
/** @type { Disc | null } */
let selectedDisc;

function clampLength(vector, min, max) {
  const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  if (length > max) {
    return {
      x: (vector.x / length) * max,
      y: (vector.y / length) * max
    };
  } else if (length < min) {
    return {
      x: (vector.x / length) * min,
      y: (vector.y / length) * min
    };
  }
  return vector;
}

function update() {
  if (!ticks) {
    player = vec(G.WIDTH / 2, G.HEIGHT - G.PLAYER_AREA / 2);
    ai = vec(G.WIDTH / 2, G.AI_AREA / 2);
    playerDiscs = [];
    aiDiscs = [];
    aimVector = vec(0, 0);
    isAiming = false;
    aimStart = vec(0, 0);
    selectedDisc = null;
  }

  // AI movement
  if (aiDiscs.length > 0) {
    ai.x += (aiDiscs[0].pos.x - ai.x) * 0.1;
  } else {
    ai.x += (G.WIDTH / 2 - ai.x) * 0.1;
  }
  ai.x = clamp(ai.x, 10, G.WIDTH - 10);
  ai.y = G.AI_AREA / 2;

  // Player placement, disc selection, and aiming
  if (input.isJustPressed) {
    selectedDisc = null;
    for (let disc of playerDiscs) {
      if (vec(disc.pos).distanceTo(input.pos) < G.DISC_RADIUS) {
        selectedDisc = disc;
        break;
      }
    }
    if (selectedDisc) {
      isAiming = true;
      aimStart = vec(selectedDisc.pos);
    } else if (input.pos.y > G.HEIGHT - G.PLAYER_AREA) {
      player.x = clamp(input.pos.x, 10, G.WIDTH - 10);
      player.y = clamp(input.pos.y, G.HEIGHT - G.PLAYER_AREA, G.HEIGHT - 10);
      isAiming = true;
      aimStart = vec(player.x, player.y);
    }
    aimVector = vec(0, 0);
  }

  if (input.isPressed && isAiming) {
    aimVector = vec(aimStart.x - input.pos.x, aimStart.y - input.pos.y);
    aimVector = clampLength(aimVector, 0, G.MAX_SHOT_POWER);
    
    color("light_black");
    line(aimStart.x, aimStart.y, aimStart.x + aimVector.x, aimStart.y + aimVector.y);

    const powerLength = Math.sqrt(aimVector.x * aimVector.x + aimVector.y * aimVector.y);
    const normalizedPower = powerLength / G.MAX_SHOT_POWER;
    color("yellow");
    rect(aimStart.x - 10, aimStart.y + 10, 20 * normalizedPower, 3);
  }

  if (input.isJustReleased && isAiming) {
    if (selectedDisc) {
      selectedDisc.vel = vec(aimVector.x, aimVector.y);
    } else {
      playerDiscs.push({ pos: vec(player.x, player.y), vel: vec(aimVector.x, aimVector.y) });
    }
    play("laser");
    isAiming = false;
    selectedDisc = null;
  }

  // AI shooting
  if (Math.random() < 0.02 && aiDiscs.length < 3) {
    aiDiscs.push({ pos: vec(ai.x, ai.y + 5), vel: vec(0, G.AI_SPEED) });
    play("hit");
  }

  // Update and draw discs
  updateDiscs(playerDiscs, aiDiscs, "cyan", "a", 1);
  updateDiscs(aiDiscs, playerDiscs, "red", "b", -1);

  // Draw players
  color("cyan");
  char("a", player);
  color("red");
  char("b", ai);

  // Draw center wall
  color("light_black");
  rect(0, G.WALL_Y - G.WALL_THICKNESS / 2, G.WIDTH, G.WALL_THICKNESS);
  
  // Draw hole in the wall
  color("black");
  rect((G.WIDTH - G.HOLE_WIDTH) / 2, G.WALL_Y - G.HOLE_HEIGHT / 2, G.HOLE_WIDTH, G.HOLE_HEIGHT);

  // Draw aim guide
  if (isAiming) {
    color("light_cyan");
    char("c", aimStart.x + aimVector.x, aimStart.y + aimVector.y);
  }
}

function updateDiscs(discs, otherDiscs, discColor, discChar, scoreMultiplier) {
  discs.forEach((d, i) => {
    d.pos.x += d.vel.x;
    d.pos.y += d.vel.y;
    d.vel.x *= G.FRICTION;
    d.vel.y *= G.FRICTION;

    // Collision with edges
    if (d.pos.x < G.DISC_RADIUS || d.pos.x > G.WIDTH - G.DISC_RADIUS) {
      d.vel.x *= -1;
      d.pos.x = clamp(d.pos.x, G.DISC_RADIUS, G.WIDTH - G.DISC_RADIUS);
    }
    if (d.pos.y < G.DISC_RADIUS || d.pos.y > G.HEIGHT - G.DISC_RADIUS) {
      d.vel.y *= -1;
      d.pos.y = clamp(d.pos.y, G.DISC_RADIUS, G.HEIGHT - G.DISC_RADIUS);
    }

    // Collision with wall
    if (Math.abs(d.pos.y - G.WALL_Y) < G.DISC_RADIUS + G.WALL_THICKNESS / 2 &&
        (d.pos.x < (G.WIDTH - G.HOLE_WIDTH) / 2 || d.pos.x > (G.WIDTH + G.HOLE_WIDTH) / 2)) {
      d.vel.y *= -1;
      d.pos.y = G.WALL_Y + (G.DISC_RADIUS + G.WALL_THICKNESS / 2) * Math.sign(d.pos.y - G.WALL_Y);
    }

    // Collision with other discs
    discs.concat(otherDiscs).forEach((otherDisc, j) => {
      if (d !== otherDisc) {
        const dx = otherDisc.pos.x - d.pos.x;
        const dy = otherDisc.pos.y - d.pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 2 * G.DISC_RADIUS) {
          // Collision detected
          const angle = Math.atan2(dy, dx);
          const targetX = d.pos.x + Math.cos(angle) * 2 * G.DISC_RADIUS;
          const targetY = d.pos.y + Math.sin(angle) * 2 * G.DISC_RADIUS;
          const ax = (targetX - otherDisc.pos.x) * 0.05;
          const ay = (targetY - otherDisc.pos.y) * 0.05;

          d.vel.x -= ax * G.COLLISION_DAMPENING;
          d.vel.y -= ay * G.COLLISION_DAMPENING;
          otherDisc.vel.x += ax * G.COLLISION_DAMPENING;
          otherDisc.vel.y += ay * G.COLLISION_DAMPENING;
        }
      }
    });

    color(discColor);
    char(discChar, d.pos);

    // Check if disc reaches the opposite end
    if ((scoreMultiplier > 0 && d.pos.y < G.DISC_RADIUS) || 
        (scoreMultiplier < 0 && d.pos.y > G.HEIGHT - G.DISC_RADIUS)) {
      discs.splice(i, 1);
      if (scoreMultiplier > 0) {
        addScore(scoreMultiplier);
        play("coin");
      } else {
        play("explosion");
        end();
      }
    }
  });
}
