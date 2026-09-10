// Motor del juego Asteroids.
// Portado de references/started-games/02-asteroids/game.js: encapsula el estado
// global del original en una clase, con bucle rAF propio, pausa y callbacks para
// que el Reproductor pinte el HUD y abra su modal de fin de partida.
import {
  H,
  POINTS,
  POWERUP_DROP_CHANCE,
  POWERUP_DURATION,
  W,
  dist,
  rand,
} from "./constants";
import {
  Asteroid,
  Bullet,
  Particle,
  PowerUp,
  Ship,
  type Keys,
} from "./entities";
export type AsteroidsCallbacks = {
  onScoreChange?: (score: number) => void;
  onLivesChange?: (lives: number) => void;
  onLevelChange?: (level: number) => void;
  onGameOver?: (finalScore: number) => void;
};
type GameState = "playing" | "dead" | "gameover";
const HELD_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Space",
]);
export class AsteroidsGame {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly cb: AsteroidsCallbacks;
  private ship!: Ship;
  private bullets: Bullet[] = [];
  private asteroids: Asteroid[] = [];
  private particles: Particle[] = [];
  private powerUps: PowerUp[] = [];
  private score = 0;
  private lives = 3;
  private level = 1;
  private state: GameState = "playing";
  private deadTimer = 0;
  private powerUpSpawned = false;
  private killsSinceSpawn = 0;
  private readonly keys: Keys = {};
  private readonly justPressed: Keys = {};
  paused = false;
  private running = false;
  private rafId: number | null = null;
  private lastTime: number | null = null;
  constructor(ctx: CanvasRenderingContext2D, cb: AsteroidsCallbacks = {}) {
    this.ctx = ctx;
    this.cb = cb;
  }
  // ── Ciclo de vida ─────────────────────────────────────────────────────────
  start(): void {
    if (this.running) return;
    this.running = true;
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    this.initGame();
    this.lastTime = null;
    this.rafId = requestAnimationFrame(this.loop);
  }
  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
  }
  restart(): void {
    this.initGame();
    this.lastTime = null;
    // Tras un game over el bucle está parado; lo revivimos.
    if (this.rafId === null) {
      this.running = true;
      this.rafId = requestAnimationFrame(this.loop);
    }
  }
  // ── Input ─────────────────────────────────────────────────────────────────
  private onKeyDown = (e: KeyboardEvent): void => {
    if (HELD_KEYS.has(e.code)) e.preventDefault();
    if (!this.keys[e.code]) this.justPressed[e.code] = true;
    this.keys[e.code] = true;
  };
  private onKeyUp = (e: KeyboardEvent): void => {
    if (HELD_KEYS.has(e.code)) e.preventDefault();
    this.keys[e.code] = false;
  };
  private pressed(code: string): boolean {
    const val = this.justPressed[code];
    this.justPressed[code] = false;
    return !!val;
  }
  // ── Emisión de estado al HUD ──────────────────────────────────────────────
  private addScore(points: number): void {
    this.score += points;
    this.cb.onScoreChange?.(this.score);
  }
  private setLives(lives: number): void {
    this.lives = lives;
    this.cb.onLivesChange?.(this.lives);
  }
  private setLevel(level: number): void {
    this.level = level;
    this.cb.onLevelChange?.(this.level);
  }
  // ── Setup ─────────────────────────────────────────────────────────────────
  private spawnAsteroids(count: number): void {
    const SAFE_DIST = 130;
    for (let i = 0; i < count; i++) {
      let x: number;
      let y: number;
      do {
        x = rand(0, W);
        y = rand(0, H);
      } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
      this.asteroids.push(new Asteroid(x, y, 3));
    }
  }
  private initGame(): void {
    this.ship = new Ship();
    this.bullets = [];
    this.asteroids = [];
    this.particles = [];
    this.powerUps = [];
    this.powerUpSpawned = false;
    this.killsSinceSpawn = 0;
    this.state = "playing";
    this.setLevel(1);
    this.setLives(3);
    this.score = 0;
    this.cb.onScoreChange?.(0);
    this.spawnAsteroids(4);
  }
  private nextLevel(): void {
    this.setLevel(this.level + 1);
    this.bullets = [];
    this.particles = [];
    this.powerUps = [];
    this.powerUpSpawned = false;
    this.killsSinceSpawn = 0;
    this.ship.reset();
    this.spawnAsteroids(3 + this.level);
  }
  private explode(x: number, y: number, count = 8): void {
    for (let i = 0; i < count; i++) this.particles.push(new Particle(x, y));
  }
  private killShip(): void {
    this.explode(this.ship.x, this.ship.y, 14);
    this.ship.dead = true;
    this.setLives(this.lives - 1);
    if (this.lives <= 0) {
      this.state = "gameover";
      this.cb.onGameOver?.(this.score);
      this.stop();
    } else {
      this.state = "dead";
      this.deadTimer = 2;
    }
  }
  // ── Update ────────────────────────────────────────────────────────────────
  private update(dt: number): void {
    if (this.state === "gameover") return;
    if (this.state === "dead") {
      this.deadTimer -= dt;
      this.particles.forEach((p) => p.update(dt));
      this.particles = this.particles.filter((p) => !p.dead);
      this.asteroids.forEach((a) => a.update(dt));
      if (this.deadTimer <= 0) {
        this.state = "playing";
        this.ship.reset();
      }
      return;
    }
    if (this.pressed("Space")) {
      this.bullets.push(...this.ship.tryShoot());
    }
    this.ship.update(dt, this.keys);
    this.bullets.forEach((b) => b.update(dt));
    this.asteroids.forEach((a) => a.update(dt));
    this.particles.forEach((p) => p.update(dt));
    this.powerUps.forEach((p) => p.update(dt));
    this.bullets = this.bullets.filter((b) => !b.dead);
    this.particles = this.particles.filter((p) => !p.dead);
    this.powerUps = this.powerUps.filter((p) => !p.dead);
    for (const p of this.powerUps) {
      if (!p.dead && dist(this.ship, p) < this.ship.radius + p.radius) {
        p.dead = true;
        this.ship.tripleShot = POWERUP_DURATION;
      }
    }
    // Bala vs asteroide
    const newAsteroids: Asteroid[] = [];
    for (const b of this.bullets) {
      for (const a of this.asteroids) {
        if (!a.dead && !b.dead && dist(b, a) < a.radius) {
          b.dead = true;
          a.dead = true;
          this.addScore(POINTS[a.size]);
          this.explode(a.x, a.y, a.size * 5);
          newAsteroids.push(...a.split());
          if (!this.powerUpSpawned) {
            this.killsSinceSpawn++;
            const guaranteed = this.killsSinceSpawn >= 5;
            if (guaranteed || Math.random() < POWERUP_DROP_CHANCE) {
              this.powerUps.push(new PowerUp(a.x, a.y));
              this.powerUpSpawned = true;
            }
          }
        }
      }
    }
    this.asteroids = this.asteroids.filter((a) => !a.dead).concat(newAsteroids);
    this.bullets = this.bullets.filter((b) => !b.dead);
    // Nave vs asteroide
    if (this.ship.invincible <= 0) {
      for (const a of this.asteroids) {
        if (dist(this.ship, a) < this.ship.radius + a.radius * 0.82) {
          this.killShip();
          break;
        }
      }
    }
    if (this.asteroids.length === 0) this.nextLevel();
  }
  // ── Draw ──────────────────────────────────────────────────────────────────
  private drawLifeIcon(x: number, y: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-Math.PI / 2);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.2;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(9, 0);
    ctx.lineTo(-6, -5);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-6, 5);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
  private drawHUD(): void {
    const ctx = this.ctx;
    ctx.fillStyle = "#fff";
    ctx.font = "15px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`SCORE  ${this.score}`, 14, 26);
    ctx.textAlign = "center";
    ctx.fillText(`NIVEL ${this.level}`, W / 2, 26);
    for (let i = 0; i < this.lives; i++) this.drawLifeIcon(W - 16 - i * 22, 18);
    if (this.ship.tripleShot > 0) {
      ctx.textAlign = "left";
      ctx.fillStyle = "#0ff";
      ctx.fillText(`3x  ${this.ship.tripleShot.toFixed(1)}s`, 14, 46);
    }
  }
  private draw(): void {
    const ctx = this.ctx;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
    this.particles.forEach((p) => p.draw(ctx));
    this.asteroids.forEach((a) => a.draw(ctx));
    this.powerUps.forEach((p) => p.draw(ctx));
    this.bullets.forEach((b) => b.draw(ctx));
    this.ship.draw(ctx);
    this.drawHUD();
  }
  // ── Bucle principal ───────────────────────────────────────────────────────
  private loop = (ts: number): void => {
    if (!this.running) return;
    if (this.paused) {
      // Al reanudar, arrancamos con dt = 0 para no arrastrar el tiempo pausado.
      this.lastTime = null;
    } else {
      const dt =
        this.lastTime === null
          ? 0
          : Math.min((ts - this.lastTime) / 1000, 0.05);
      this.lastTime = ts;
      this.update(dt);
    }
    this.draw();
    this.rafId = requestAnimationFrame(this.loop);
  };
}
