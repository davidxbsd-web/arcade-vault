// Constantes y helpers del juego Asteroids.
// Portado de references/started-games/02-asteroids/game.js — no cambiar el balance.
export const W = 800;
export const H = 600;
// Indexados por tamaño de asteroide: 1 (pequeño), 2 (mediano), 3 (grande).
export const RADII = [0, 16, 30, 50];
export const SPEEDS = [0, 85, 55, 32];
export const POINTS = [0, 100, 50, 20];
export const POWERUP_DROP_CHANCE = 0.15;
export const POWERUP_DURATION = 5;
export const POWERUP_TTL = 12;
export const TRIPLE_SPREAD = 0.18;
export type Point = { x: number; y: number };
export const wrap = (v: number, max: number): number => ((v % max) + max) % max;
export const dist = (a: Point, b: Point): number =>
  Math.hypot(a.x - b.x, a.y - b.y);
export const rand = (min: number, max: number): number =>
  min + Math.random() * (max - min);
export const randInt = (min: number, max: number): number =>
  Math.floor(rand(min, max + 1));
