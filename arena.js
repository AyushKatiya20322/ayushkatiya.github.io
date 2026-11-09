// Arena.io: configurable canvas game with keyboard, pointer, and touch controls
(() => {
  const canvas = document.getElementById("arenaCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const overlay = document.getElementById("arenaOverlay");
  const startButton = document.getElementById("arenaStart");
  const scoreElement = document.getElementById("gameScore");
  const hpElement = document.getElementById("gameHp");
  const levelElement = document.getElementById("gameLevel");
  const bestElement = document.getElementById("bestScore");
  const messageElement = document.getElementById("arenaMessage");
  const subElement = document.getElementById("arenaSub");
  const difficultyInput = document.getElementById("arenaDifficulty");
  const speedInput = document.getElementById("arenaSpeed");
  const speedOutput = document.getElementById("arenaSpeedValue");

  const difficultyRules = {
    calm: { spawnInterval: 1.8, enemySpeed: 0.78, damage: 12 },
    standard: { spawnInterval: 1.35, enemySpeed: 1, damage: 18 },
    intense: { spawnInterval: 1.05, enemySpeed: 1.18, damage: 24 }
  };

  let width = 800;
  let height = 560;
  let running = false;
  let lastFrame = 0;
  let score = 0;
  let health = 100;
  let level = 1;
  let enemyClock = 0;
  let coreClock = 0;
  let survivalClock = 0;
  let bestScore = 0;
  let player = { x: width / 2, y: height / 2, radius: 11, speed: Number(speedInput.value) };
  let enemies = [];
  let cores = [];
  let particles = [];
  let keys = Object.create(null);
  let pointerSteering = false;
  let pointerTarget = { x: width / 2, y: height / 2 };

  try {
    const savedBest = Number(localStorage.getItem("ak-arena-best") || 0);
    bestScore = Number.isFinite(savedBest) ? Math.max(0, savedBest) : 0;
  } catch {
    bestScore = 0;
  }
  bestElement.textContent = String(bestScore);

  function updateSpeed() {
    player.speed = Number(speedInput.value);
    speedOutput.value = `${player.speed} px/s`;
    speedOutput.textContent = `${player.speed} px/s`;
  }

  function currentRules() {
    return difficultyRules[difficultyInput.value] || difficultyRules.standard;
  }

  function resizeCanvas() {
    const bounds = canvas.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    if (!running) {
      player.x = width / 2;
      player.y = height / 2;
    }
    draw();
  }

  function updateHud() {
    scoreElement.textContent = String(Math.floor(score)).padStart(4, "0");
    hpElement.textContent = String(Math.max(0, Math.ceil(health)));
    levelElement.textContent = String(level);
  }

  function resetRun() {
    score = 0;
    health = 100;
    level = 1;
    enemies = [];
    cores = [];
    particles = [];
    enemyClock = 0;
    coreClock = 0;
    survivalClock = 0;
    keys = Object.create(null);
    pointerSteering = false;
    player.x = width / 2;
    player.y = height / 2;
    for (let index = 0; index < 4; index += 1) spawnCore();
    updateHud();
  }

  function spawnCore() {
    const padding = Math.min(30, width / 2, height / 2);
    cores.push({
      x: padding + Math.random() * Math.max(1, width - padding * 2),
      y: padding + Math.random() * Math.max(1, height - padding * 2),
      radius: 6,
      phase: Math.random() * Math.PI * 2
    });
  }

  function spawnEnemy() {
    const edge = Math.floor(Math.random() * 4);
    let x;
    let y;
    if (edge < 2) {
      x = edge === 0 ? -20 : width + 20;
      y = Math.random() * height;
    } else {
      x = Math.random() * width;
      y = edge === 2 ? -20 : height + 20;
    }
    const rules = currentRules();
    const baseSpeed = 62 + level * 11 + Math.random() * 24;
    enemies.push({
      x,
      y,
      radius: 8 + Math.random() * 5,
      baseSpeed,
      speed: baseSpeed * rules.enemySpeed,
      damage: rules.damage,
      hitCooldown: 0
    });
  }

  function burst(x, y, color, count = 10) {
    for (let index = 0; index < count; index += 1) {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 160,
        vy: (Math.random() - 0.5) * 160,
        alpha: 1,
        color
      });
    }
  }

  function finishRun() {
    if (!running) return;
    running = false;
    bestScore = Math.max(bestScore, Math.floor(score));
    try {
      localStorage.setItem("ak-arena-best", String(bestScore));
    } catch {
      // The game remains playable if local storage is disabled.
    }
    bestElement.textContent = String(bestScore);
    messageElement.textContent = "SIMULATION ENDED";
    subElement.textContent = `Score ${Math.floor(score)} | Level ${level}. Adjust the settings and try again.`;
    startButton.textContent = "REBOOT SIMULATION";
    overlay.classList.remove("hidden");
  }

  function startRun() {
    resetRun();
    running = true;
    lastFrame = performance.now();
    overlay.classList.add("hidden");
    canvas.focus();
    requestAnimationFrame(frame);
  }

  function frame(timestamp) {
    if (!running) return;
    const delta = Math.min((timestamp - lastFrame) / 1000, 0.034);
    lastFrame = timestamp;
    update(delta);
    draw();
    if (running) requestAnimationFrame(frame);
  }

  function movePlayer(delta) {
    const dx = (keys.arrowright || keys.d ? 1 : 0) - (keys.arrowleft || keys.a ? 1 : 0);
    const dy = (keys.arrowdown || keys.s ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0);
    if (dx || dy) {
      pointerSteering = false;
      const magnitude = Math.hypot(dx, dy);
      player.x += (dx / magnitude) * player.speed * delta;
      player.y += (dy / magnitude) * player.speed * delta;
    } else if (pointerSteering) {
      const targetX = pointerTarget.x - player.x;
      const targetY = pointerTarget.y - player.y;
      const distance = Math.hypot(targetX, targetY);
      if (distance < 2) {
        pointerSteering = false;
      } else {
        const step = Math.min(distance, player.speed * delta);
        player.x += (targetX / distance) * step;
        player.y += (targetY / distance) * step;
      }
    }
    player.x = Math.max(player.radius, Math.min(width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(height - player.radius, player.y));
  }

  function update(delta) {
    movePlayer(delta);
    enemyClock += delta;
    coreClock += delta;
    survivalClock += delta;
    level = 1 + Math.floor(score / 700);

    const rules = currentRules();
    if (enemyClock > Math.max(0.42, rules.spawnInterval - level * 0.07)) {
      enemyClock = 0;
      spawnEnemy();
    }
    if (coreClock > 2.2 && cores.length < 6) {
      coreClock = 0;
      spawnCore();
    }
    if (survivalClock > 1) {
      survivalClock = 0;
      score += 8;
    }

    cores = cores.filter((core) => {
      core.phase += delta * 3;
      if (Math.hypot(core.x - player.x, core.y - player.y) < core.radius + player.radius + 3) {
        score += 100;
        burst(core.x, core.y, "#c8ff38", 14);
        spawnCore();
        return false;
      }
      return true;
    });

    enemies = enemies.filter((enemy) => {
      const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
      enemy.x += Math.cos(angle) * enemy.speed * delta;
      enemy.y += Math.sin(angle) * enemy.speed * delta;
      enemy.hitCooldown = Math.max(0, enemy.hitCooldown - delta);
      if (Math.hypot(enemy.x - player.x, enemy.y - player.y) < enemy.radius + player.radius && enemy.hitCooldown <= 0) {
        health -= enemy.damage;
        enemy.hitCooldown = 0.7;
        burst(player.x, player.y, "#ff5d68", 18);
        if (health <= 0) {
          finishRun();
          return false;
        }
      }
      return enemy.x > -80 && enemy.x < width + 80 && enemy.y > -80 && enemy.y < height + 80;
    });

    particles = particles.filter((particle) => {
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.vx *= 0.96;
      particle.vy *= 0.96;
      particle.alpha -= delta * 1.8;
      return particle.alpha > 0;
    });
    updateHud();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#091014";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(94,234,212,.07)";
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    cores.forEach((core) => {
      ctx.shadowBlur = 10 + Math.sin(core.phase) * 3;
      ctx.shadowColor = "#c8ff38";
      ctx.fillStyle = "#c8ff38";
      ctx.beginPath();
      ctx.arc(core.x, core.y, core.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    enemies.forEach((enemy) => {
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      ctx.rotate(Math.atan2(player.y - enemy.y, player.x - enemy.x));
      ctx.fillStyle = enemy.hitCooldown > 0 ? "#fff" : "#ff5d68";
      ctx.beginPath();
      ctx.moveTo(enemy.radius, 0);
      ctx.lineTo(-enemy.radius * 0.8, enemy.radius * 0.75);
      ctx.lineTo(-enemy.radius * 0.45, 0);
      ctx.lineTo(-enemy.radius * 0.8, -enemy.radius * 0.75);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    particles.forEach((particle) => {
      ctx.globalAlpha = particle.alpha;
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x, particle.y, 3, 3);
    });
    ctx.globalAlpha = 1;

    if (pointerSteering) {
      ctx.strokeStyle = "rgba(200,255,56,.68)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(pointerTarget.x, pointerTarget.y, 9, 0, Math.PI * 2);
      ctx.moveTo(pointerTarget.x - 14, pointerTarget.y);
      ctx.lineTo(pointerTarget.x + 14, pointerTarget.y);
      ctx.moveTo(pointerTarget.x, pointerTarget.y - 14);
      ctx.lineTo(pointerTarget.x, pointerTarget.y + 14);
      ctx.stroke();
    }

    ctx.shadowBlur = 18;
    ctx.shadowColor = "#5eead4";
    ctx.fillStyle = "#5eead4";
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#dffefa";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius + 4, 0, Math.PI * 2);
    ctx.stroke();
  }

  function updatePointerTarget(event) {
    const bounds = canvas.getBoundingClientRect();
    pointerTarget = {
      x: Math.max(0, Math.min(width, event.clientX - bounds.left)),
      y: Math.max(0, Math.min(height, event.clientY - bounds.top))
    };
  }

  function stopControls() {
    keys = Object.create(null);
    pointerSteering = false;
  }

  canvas.addEventListener("pointerdown", (event) => {
    if (!running) return;
    event.preventDefault();
    updatePointerTarget(event);
    pointerSteering = true;
    canvas.focus();
    try { canvas.setPointerCapture(event.pointerId); } catch {}
  });
  canvas.addEventListener("pointermove", (event) => {
    if (running && pointerSteering) updatePointerTarget(event);
  });
  canvas.addEventListener("pointerup", () => { pointerSteering = false; });
  canvas.addEventListener("pointercancel", () => { pointerSteering = false; });
  canvas.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "mouse") pointerSteering = false;
  });

  window.addEventListener("keydown", (event) => {
    if (!running || event.target.closest?.("input, select, textarea, button, a")) return;
    const key = event.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) event.preventDefault();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)) {
      keys[key] = true;
      pointerSteering = false;
    }
  });
  window.addEventListener("keyup", (event) => {
    keys[event.key.toLowerCase()] = false;
  });
  window.addEventListener("blur", stopControls);

  document.querySelectorAll("[data-dir]").forEach((button) => {
    const directions = { up: "arrowup", down: "arrowdown", left: "arrowleft", right: "arrowright" };
    const key = directions[button.dataset.dir];
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      keys[key] = true;
      pointerSteering = false;
      try { button.setPointerCapture(event.pointerId); } catch {}
    });
    button.addEventListener("keydown", (event) => {
      if (event.code !== "Space" && event.code !== "Enter") return;
      event.preventDefault();
      keys[key] = true;
      pointerSteering = false;
    });
    button.addEventListener("keyup", () => { keys[key] = false; });
    button.addEventListener("blur", () => { keys[key] = false; });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach((eventName) => {
      button.addEventListener(eventName, () => { keys[key] = false; });
    });
  });

  speedInput.addEventListener("input", updateSpeed);
  difficultyInput.addEventListener("change", () => {
    const rules = currentRules();
    enemies.forEach((enemy) => {
      enemy.speed = enemy.baseSpeed * rules.enemySpeed;
      enemy.damage = rules.damage;
    });
  });
  startButton.addEventListener("click", startRun);
  if ("ResizeObserver" in window) {
    new ResizeObserver(resizeCanvas).observe(canvas);
  } else {
    window.addEventListener("resize", resizeCanvas);
  }
  updateSpeed();
  resizeCanvas();
})();
