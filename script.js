const state = {
  carX: 0,
  score: 0,
  time: 0,
  baseSpeed: 110,
  speed: 110,
  nitro: false,
  running: true,
  obstacles: [],
  lastTick: 0,
  spawnTimer: 0,
  roadOffset: 0,
  targetRoadOffset: 0,
  segmentIndex: 0,
  segmentTime: 0,
  segments: [
    { name: "Reta", target: 0, duration: 8 },
    { name: "Curva esquerda", target: -18, duration: 5 },
    { name: "Curva direita", target: 18, duration: 5 },
    { name: "Reta", target: 0, duration: 7 },
    { name: "Curva direita", target: 14, duration: 6 },
    { name: "Reta", target: 0, duration: 9 },
  ],
};

const scoreValue = document.getElementById("scoreValue");
const timeValue = document.getElementById("timeValue");
const speedValue = document.getElementById("speedValue");
const nitroValue = document.getElementById("nitroValue");
const playerCar = document.getElementById("playerCar");
const obstaclesContainer = document.getElementById("obstacles");
const restartButton = document.getElementById("restartButton");
const nitroButton = document.getElementById("nitroButton");
const nitroMobileButton = document.getElementById("nitroMobileButton");
const moveLeftButton = document.getElementById("moveLeftButton");
const moveRightButton = document.getElementById("moveRightButton");
const gameOver = document.getElementById("gameOver");
const finalScore = document.getElementById("finalScore");
const playAgainButton = document.getElementById("playAgainButton");
const engineAudio = document.getElementById("engineAudio");
const crashAudio = document.getElementById("crashAudio");

const lanePositions = [-24, -12, 0, 12, 24];
const roadLines = document.querySelectorAll(".road-line");
const leftBorder = document.querySelector(".road-border.left");
const rightBorder = document.querySelector(".road-border.right");
const trackLabel = document.getElementById("trackLabel");

function updateStats() {
  scoreValue.textContent = state.score;
  timeValue.textContent = `${state.time}s`;
  speedValue.textContent = state.speed;
  nitroValue.textContent = state.nitro ? "ATIVO" : "Pronto";
}

function updateTrackLabel() {
  trackLabel.textContent = `Pista: ${state.segments[state.segmentIndex].name}`;
}

function updateRoad() {
  roadLines.forEach((line, index) => {
    const offset = state.roadOffset + (index - 1) * 6;
    line.style.left = `${50 + offset}%`;
  });

  leftBorder.style.left = `calc(50% + ${state.roadOffset}% - 32%)`;
  rightBorder.style.left = `calc(50% + ${state.roadOffset}% + 32%)`;
}

function advanceTrack(delta) {
  const currentSegment = state.segments[state.segmentIndex];
  state.segmentTime += delta / 1000;
  state.targetRoadOffset = currentSegment.target;

  if (state.segmentTime >= currentSegment.duration) {
    state.segmentIndex = (state.segmentIndex + 1) % state.segments.length;
    state.segmentTime = 0;
    updateTrackLabel();
  }
}

function updatePlayer() {
  playerCar.style.left = `${50 + state.roadOffset + state.carX}%`;
}

function spawnObstacle() {
  const lanePos = lanePositions[Math.floor(Math.random() * lanePositions.length)];
  const obstacle = document.createElement("img");
  obstacle.src = "public/enemy-car.png";
  obstacle.alt = "Enemy Car";
  obstacle.className = "obstacle";
  obstacle.dataset.y = "-12";
  obstacle.dataset.lane = lanePos;
  obstacle.style.left = `${50 + state.roadOffset + lanePos}%`;
  obstacle.style.top = "-16%";
  obstaclesContainer.appendChild(obstacle);
  state.obstacles.push(obstacle);
}

function resetGame() {
  state.carX = 0;
  state.score = 0;
  state.time = 0;
  state.baseSpeed = 110;
  state.speed = 110;
  state.nitro = false;
  state.running = true;
  state.obstacles = [];
  state.lastTick = performance.now();
  state.spawnTimer = 0;
  state.roadOffset = 0;
  state.targetRoadOffset = 0;
  state.segmentIndex = 0;
  state.segmentTime = 0;
  obstaclesContainer.innerHTML = "";
  gameOver.classList.add("hidden");
  nitroButton.disabled = false;
  updateTrackLabel();
  updateStats();
  updatePlayer();
  updateRoad();
  playEngineSound();
}

function endGame() {
  state.running = false;
  finalScore.textContent = state.score;
  gameOver.classList.remove("hidden");
  nitroButton.disabled = true;
  stopEngineSound();
  crashAudio.currentTime = 0;
  crashAudio.play().catch(() => {});
}

function playEngineSound() {
  if (!engineAudio.paused) return;
  engineAudio.currentTime = 0;
  engineAudio.play().catch(() => {});
}

function stopEngineSound() {
  engineAudio.pause();
}

function activateNitro() {
  if (state.nitro || !state.running) return;
  state.nitro = true;
  state.speed = Math.min(220, state.baseSpeed + 90);
  nitroButton.disabled = true;
  updateStats();

  setTimeout(() => {
    state.nitro = false;
    state.speed = state.baseSpeed;
    nitroButton.disabled = false;
    updateStats();
  }, 2600);
}

function handleKey(event) {
  if (!state.running) return;
  if (event.key === "ArrowLeft") {
    moveLeft();
  }
  if (event.key === "ArrowRight") {
    moveRight();
  }
  if (event.key === " " || event.key.toLowerCase() === "shift") {
    activateNitro();
  }
}

function moveLeft() {
  state.carX = Math.max(-24, state.carX - 12);
  updatePlayer();
}

function moveRight() {
  state.carX = Math.min(24, state.carX + 12);
  updatePlayer();
}

function startHoldMove(direction) {
  if (!state.running) return;
  if (state.controlInterval) clearInterval(state.controlInterval);
  state.controlInterval = setInterval(() => {
    direction === "left" ? moveLeft() : moveRight();
  }, 140);
}

function stopHoldMove() {
  if (state.controlInterval) {
    clearInterval(state.controlInterval);
    state.controlInterval = null;
  }
}

function updateObstacles(delta) {
  const speedFactor = state.speed / 120;
  state.obstacles = state.obstacles.filter((obstacle) => {
    const currentY = Number(obstacle.dataset.y);
    const nextY = currentY + delta * 0.12 * speedFactor;
    obstacle.dataset.y = nextY.toString();
    obstacle.style.top = `${nextY}%`;

    const lanePos = Number(obstacle.dataset.lane);
    obstacle.style.left = `${50 + state.roadOffset + lanePos}%`;

    const obstacleLeft = 50 + state.roadOffset + lanePos;
    const playerLeft = 50 + state.roadOffset + state.carX;
    const collision =
      nextY > 78 && Math.abs(obstacleLeft - playerLeft) < 12;

    if (collision) {
      endGame();
      return false;
    }

    return nextY < 110;
  });

  state.spawnTimer += delta;
  const spawnInterval = Math.max(950, 1600 - (state.baseSpeed - 110) * 5);
  if (state.spawnTimer >= spawnInterval) {
    spawnObstacle();
    state.spawnTimer = 0;
  }
}

function gameLoop(timestamp) {
  if (!state.running) {
    state.lastTick = timestamp;
    requestAnimationFrame(gameLoop);
    return;
  }

  const delta = timestamp - state.lastTick;
  if (delta > 40) {
    state.score += 1;
    updateStats();
    advanceTrack(delta);
    state.roadOffset += (state.targetRoadOffset - state.roadOffset) * 0.06;
    updateRoad();
    updateObstacles(delta);
    state.lastTick = timestamp;
  }

  requestAnimationFrame(gameLoop);
}

function startTimers() {
  setInterval(() => {
    if (!state.running) return;
    state.time += 1;

    const newSpeed = 110 + Math.floor(state.time / 10) * 5;
    state.baseSpeed = Math.min(170, newSpeed);
    if (!state.nitro) {
      state.speed = state.baseSpeed;
    }

    updateStats();
  }, 1000);
}

window.addEventListener("DOMContentLoaded", () => {
  resetGame();
  updatePlayer();
  startTimers();
  requestAnimationFrame(gameLoop);

  window.addEventListener("keydown", handleKey);
  restartButton.addEventListener("click", resetGame);
  playAgainButton.addEventListener("click", resetGame);
  nitroButton.addEventListener("click", activateNitro);
  nitroMobileButton.addEventListener("click", activateNitro);

  moveLeftButton.addEventListener("pointerdown", () => startHoldMove("left"));
  moveLeftButton.addEventListener("pointerup", stopHoldMove);
  moveLeftButton.addEventListener("pointerleave", stopHoldMove);
  moveLeftButton.addEventListener("pointercancel", stopHoldMove);

  moveRightButton.addEventListener("pointerdown", () => startHoldMove("right"));
  moveRightButton.addEventListener("pointerup", stopHoldMove);
  moveRightButton.addEventListener("pointerleave", stopHoldMove);
  moveRightButton.addEventListener("pointercancel", stopHoldMove);
});
