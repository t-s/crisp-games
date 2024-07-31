title = "PACHINKO";
description = `
[Tap] Drop ball
Aim for high score!
`;
characters = [
  `
  ll
 llll
llllll
llllll
 llll
  ll
  `,  // a: ball
  `
  cc
 cccc
cccccc
  `,    // b: peg
  `
rrrrrr
rrrrrr
rrrrrr
  `,    // c: bucket
  `
l
l
l
l
l
l
  `     // d: wall
];

window.G = {
  WIDTH: 100,
  HEIGHT: 150,
  BALL_SPEED: 0.5,
  PEG_COUNT: 40,
  BUCKET_COUNT: 5,
  BALL_RADIUS: 2,
  PEG_RADIUS: 2,
  GRAVITY: 0.1,
  BOUNCE_FACTOR: 0.7,
  FRICTION: 0.99,
  WALL_HEIGHT: 20
};

options = {
  viewSize: {x: G.WIDTH, y: G.HEIGHT},
  isPlayingBgm: true,
  isReplayEnabled: true,
  seed: 1
};

/** @type {{pos: Vector, vel: Vector}[]} */
let balls;
/** @type {Vector[]} */
let pegs;
/** @type {{pos: Vector, score: number}[]} */
let buckets;
/** @type {Vector[]} */
let walls;

function update() {
  if (!ticks) {
    balls = [];
    pegs = times(G.PEG_COUNT, () => vec(rnd(10, G.WIDTH - 10), rnd(20, G.HEIGHT - 30)));
    buckets = times(G.BUCKET_COUNT, (i) => ({
      pos: vec(5 + (G.WIDTH - 10) * i / (G.BUCKET_COUNT - 1), G.HEIGHT - 5),
      score: rndi(1, 5)
    }));
    walls = times(G.BUCKET_COUNT - 1, (i) => 
      vec(5 + (G.WIDTH - 10) * (i + 1) / (G.BUCKET_COUNT - 1), G.HEIGHT - G.WALL_HEIGHT / 2)
    );
  }

  // Drop new ball
  if (input.isJustPressed) {
    play("select");
    balls.push({pos: vec(input.pos.x, 5), vel: vec(0, G.BALL_SPEED)});
  }

  // Update ball positions and check collisions
  balls.forEach((b, i) => {
    b.vel.y += G.GRAVITY;
    b.vel.mul(G.FRICTION);
    b.pos.add(b.vel);

    // Collision with pegs
    pegs.forEach(p => {
      const diff = vec(b.pos.x - p.x, b.pos.y - p.y);
      const distSq = diff.x * diff.x + diff.y * diff.y;
      const minDist = G.BALL_RADIUS + G.PEG_RADIUS;
      
      if (distSq < minDist * minDist) {
        play("hit");
        const dist = Math.sqrt(distSq);
        const overlap = minDist - dist;
        
        diff.normalize();
        b.pos.add(vec(diff).mul(overlap));
        
        const dotProduct = b.vel.x * diff.x + b.vel.y * diff.y;
        b.vel.sub(vec(diff).mul(2 * dotProduct)).mul(G.BOUNCE_FACTOR);
      }
    });

    // Collision with walls
    walls.forEach(w => {
      if (Math.abs(b.pos.x - w.x) < G.BALL_RADIUS && 
          b.pos.y > G.HEIGHT - G.WALL_HEIGHT - G.BALL_RADIUS) {
        play("hit");
        const overlapX = G.BALL_RADIUS - Math.abs(b.pos.x - w.x);
        b.pos.x += overlapX * Math.sign(b.pos.x - w.x);
        b.vel.x *= -G.BOUNCE_FACTOR;
      }
    });

    // Collision with side walls
    if (b.pos.x < G.BALL_RADIUS) {
      b.pos.x = G.BALL_RADIUS;
      b.vel.x *= -G.BOUNCE_FACTOR;
    } else if (b.pos.x > G.WIDTH - G.BALL_RADIUS) {
      b.pos.x = G.WIDTH - G.BALL_RADIUS;
      b.vel.x *= -G.BOUNCE_FACTOR;
    }

    // Check if ball reached bottom
    if (b.pos.y > G.HEIGHT) {
      balls.splice(i, 1);
    }

    // Check if ball entered a bucket
    buckets.forEach(bucket => {
      if (b.pos.y > G.HEIGHT - 10 && Math.abs(b.pos.x - bucket.pos.x) < 5) {
        play("coin");
        addScore(bucket.score);
        balls.splice(i, 1);
      }
    });

    color("light_blue");
    char("a", b.pos);
  });

  // Draw pegs
  color("light_yellow");
  pegs.forEach(p => {
    char("b", p);
  });

  // Draw buckets
  color("red");
  buckets.forEach(b => {
    char("c", b.pos);
    text(b.score.toString(), b.pos.x - 2, G.HEIGHT - 12);
  });

  // Draw walls
  color("light_green");
  walls.forEach(w => {
    times(G.WALL_HEIGHT, (i) => {
      char("d", w.x, G.HEIGHT - i - 1);
    });
  });
}