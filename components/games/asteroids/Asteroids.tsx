"use client";
import { useEffect, useRef } from "react";
import { H, W } from "./constants";
import { AsteroidsGame } from "./game";
type AsteroidsProps = {
  paused: boolean;
  onScore: (score: number) => void;
  onLives: (lives: number) => void;
  onLevel: (level: number) => void;
  onGameOver: (finalScore: number) => void;
};
export default function Asteroids({
  paused,
  onScore,
  onLives,
  onLevel,
  onGameOver,
}: AsteroidsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<AsteroidsGame | null>(null);
  // Callbacks en un ref para no reiniciar el juego cuando cambian de identidad.
  const cbRef = useRef({ onScore, onLives, onLevel, onGameOver });
  useEffect(() => {
    cbRef.current = { onScore, onLives, onLevel, onGameOver };
  }, [onScore, onLives, onLevel, onGameOver]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const game = new AsteroidsGame(ctx, {
      onScoreChange: (s) => cbRef.current.onScore(s),
      onLivesChange: (l) => cbRef.current.onLives(l),
      onLevelChange: (l) => cbRef.current.onLevel(l),
      onGameOver: (s) => cbRef.current.onGameOver(s),
    });
    gameRef.current = game;
    game.paused = paused;
    game.start();
    return () => {
      game.stop();
      gameRef.current = null;
    };
    // Solo se monta/desmonta una vez; el reinicio se hace remontando vía `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (gameRef.current) gameRef.current.paused = paused;
  }, [paused]);
  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      className="asteroids-canvas"
      tabIndex={0}
    />
  );
}
