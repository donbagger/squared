import React, { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import GameState from "../game/GameState";

const GameCanvas = forwardRef(({ onUpdate }, ref) => {
  const canvasRef = useRef(null);
  const gameStateRef = useRef(null);
  const requestIdRef = useRef(null);

  useImperativeHandle(ref, () => ({
    squares: gameStateRef.current ? gameStateRef.current.squares : []
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 600;

    // Only create game state once
    if (!gameStateRef.current) {
      gameStateRef.current = new GameState(canvas.width, canvas.height);
    }

    let frameCount = 0;
    function animate(timestamp) {
      // Limit updates to 60 FPS
      if (frameCount % 1 === 0) { // Adjust this value to control update frequency
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (gameStateRef.current) {
          gameStateRef.current.update((gameState) => {
            if (onUpdate) {
              onUpdate(gameState);
            }
          });
          
          gameStateRef.current.draw(ctx);
        }
      }
      frameCount++;
      
      requestIdRef.current = window.requestAnimationFrame(animate);
    }

    requestIdRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (requestIdRef.current) {
        window.cancelAnimationFrame(requestIdRef.current);
      }
    };
  }, []); // Remove onUpdate from dependencies

  return (
    <canvas 
      ref={canvasRef}
      style={{
        display: 'block',
        margin: 'auto',
        marginTop: '20px',
        border: '1px solid white'
      }}
    />
  );
});

export default GameCanvas;
