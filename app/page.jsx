"use client";

import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function RacingGame() {
  const [carX, setCarX] = useState(50);
  const [score, setScore] = useState(0);
  const [gameTime, setGameTime] = useState(0);
  const [speed, setSpeed] = useState(150);
  const [nitro, setNitro] = useState(false);
  const [roadOffset, setRoadOffset] = useState(0);
  const [running, setRunning] = useState(true);
  const [obstacles, setObstacles] = useState([]);
  const gameRef = useRef(null);
  const engineSoundRef = useRef(null);
  const crashSoundRef = useRef(null);

  useEffect(() => {
    if (running && engineSoundRef.current) {
      engineSoundRef.current.volume = 0.2;
      engineSoundRef.current.loop = true;
      engineSoundRef.current.play().catch(() => {});
    } else if (engineSoundRef.current) {
      engineSoundRef.current.pause();
    }
  }, [running]);

  useEffect(() => {
    const handleKey = (e) => {
      if (!running) return;

      if (e.key === "ArrowLeft") {
        setCarX((prev) => Math.max(8, prev - 6));
      }
      if (e.key === "ArrowRight") {
        setCarX((prev) => Math.min(92, prev + 6));
      }

      if (e.key === " " || e.key.toLowerCase() === "shift") {
        activateNitro();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [running]);

  useEffect(() => {
    if (!running) return;

    const roadTimer = setInterval(() => {
      setRoadOffset((prev) => {
        const variation = (Math.random() - 0.5) * 18;
        const next = prev + variation;
        return Math.max(-90, Math.min(90, next));
      });
    }, 700);

    return () => clearInterval(roadTimer);
  }, [running]);

  useEffect(() => {
    if (!running) return;

    const timer = setInterval(() => {
      setGameTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      setObstacles((prev) => {
        let updated = prev
          .map((o) => ({ ...o, y: o.y + 8 }))
          .filter((o) => o.y < 100);

        if (Math.random() > 0.6) {
          updated.push({
            id: Date.now() + Math.random(),
            x: [12, 25, 38, 50, 62, 75, 88][Math.floor(Math.random() * 7)],
            y: 0,
          });
        }

        const hit = updated.some(
          (o) => {
            const horizontalCollision = Math.abs(o.x - carX) < 8;
            const verticalCollision = o.y > 88;
            return horizontalCollision && verticalCollision;
          }
        );

        if (hit) {
          if (crashSoundRef.current) {
            crashSoundRef.current.play().catch(() => {});
          }
          setRunning(false);
          return [];
        }

        setScore((s) => s + 1);
        return updated;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [running, carX, score]);

  useEffect(() => {
    if (!running) return;

    const speedTimer = setTimeout(() => {
      setSpeed(80);
    }, 50 * 60 * 1000);

    return () => clearTimeout(speedTimer);
  }, [running]);

  const activateNitro = () => {
    if (nitro || !running) return;

    setNitro(true);
    setSpeed(60);

    setTimeout(() => {
      setSpeed(150);
      setNitro(false);
    }, 3000);
  };

  const startGame = () => {
    setScore(0);
    setGameTime(0);
    setRoadOffset(0);
    setObstacles([]);
    setCarX(50);
    setSpeed(150);
    setRunning(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 flex items-center justify-center">
      <audio ref={engineSoundRef} src="/engine.mp3" />
      <audio ref={crashSoundRef} src="/crash.mp3" />
      <Card className="w-full max-w-3xl rounded-2xl shadow-2xl bg-zinc-900 border-zinc-700">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6 items-start">
            <div>
              <h1 className="text-3xl font-bold">Gran Turismo Game</h1>
            </div>

            <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-4 space-y-3 h-fit">
              <h2 className="text-xl font-bold">Painel do Jogo</h2>
              <div className="text-lg font-semibold">Score: {score}</div>
              <div className="text-sm text-zinc-300">Tempo: {gameTime}s</div>
              <div className="text-sm text-zinc-300">Velocidade: {speed}</div>
              <div className="text-sm text-zinc-300">Nitro: {nitro ? "ATIVO" : "Pronto"}</div>
            </div>
          </div>

          {!running && score > 0 && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
              <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-700 text-center space-y-4 max-w-md w-full">
                <h2 className="text-3xl font-bold">Game Over</h2>
                <p className="text-lg">Pontuação final: {score}</p>
                <Button
                  onClick={startGame}
                  className="w-full rounded-xl text-lg py-6"
                >
                  Jogar Novamente
                </Button>
              </div>
            </div>
          )}

          <p className="text-sm text-zinc-300">
            Jogo inspirado em Gran Turismo. Use ← e → para desviar dos carros. Pressione Espaço para Nitro.
          </p>

          <div
            ref={gameRef}
            className="relative h-[500px] w-full rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-800"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-700 to-zinc-900" />

            <div
              className="absolute top-0 h-full w-2 bg-white/30 transition-all duration-700 shadow-lg"
              style={{
                left: `calc(50% + ${roadOffset}px)`,
                transform: "translateX(-50%)",
              }}
            />

            {obstacles.map((o) => (
              <img
                key={o.id}
                src="/enemy-car.png"
                alt="Enemy Car"
                className="absolute w-16 h-28 object-contain"
                style={{
                  left: `${o.x}%`,
                  top: `${o.y}%`,
                  transform: "translateX(-50%)",
                }}
              />
            ))}
            <img
              src="/Player-car.png"
              alt="Player Car"
              className="absolute bottom-4 w-20 h-32 object-contain"
              style={{
                left: `${carX}%`,
                transform: "translateX(-50%)",
              }}
            />
          </div>

          <Button
            onClick={() => running ? setRunning(false) : startGame()}
            className="w-full rounded-xl text-lg py-6"
          >
            {running ? "Reiniciar" : "Iniciar Corrida"}
          </Button>

          <Button
            onClick={activateNitro}
            disabled={nitro || !running}
            className="w-full rounded-xl text-lg py-6"
          >
            {nitro ? "Turbo Ativado" : "Ativar Nitro"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
