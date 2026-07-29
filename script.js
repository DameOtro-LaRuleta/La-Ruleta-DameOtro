/* ==========================================================================
   CONFIGURACIÓN Y DATOS DE LA RULETA
   ========================================================================== */
const SABORES = [
  {
    id: "01",
    name: "Carrot Cake Atelier",
    collection: "La Elegancia",
    desc: "Elegancia en cada bocado. Hoy la suerte eligió por ti.",
    color: "#F7E2D3",
    textColor: "#3E1E19"
  },
  {
    id: "02",
    name: "Brownie Cheesecake Fusion",
    collection: "La Fusión",
    desc: "Dos favoritos. Un solo ganador. Disfrútalo sin culpa.",
    color: "#2E1A17",
    textColor: "#FFFFFF"
  },
  {
    id: "03",
    name: "Apple Crumble Delight",
    collection: "El Crujido",
    desc: "Crujiente por fuera. Inolvidable por dentro.",
    color: "#D49B4B",
    textColor: "#FFFFFF"
  },
  {
    id: "04",
    name: "Classic New York Cheesecake",
    collection: "El Clásico",
    desc: "Los clásicos nunca pasan de moda. Hoy te tocó una leyenda.",
    color: "#C84B31",
    textColor: "#FFFFFF"
  },
  {
    id: "05",
    name: "Brookie Supreme",
    collection: "El Antojo",
    desc: "Cuando brownie y cookie hacen el equipo perfecto.",
    color: "#5C3A21",
    textColor: "#FFFFFF"
  },
  {
    id: "06",
    name: "Lemon Cream Pie",
    collection: "La Frescura",
    desc: "Un giro fresco que sorprende desde el primer bocado.",
    color: "#FFF5D6",
    textColor: "#3E1E19"
  },
  {
    id: "07",
    name: "Red Velvet Royale Cheesecake",
    collection: "La Joya",
    desc: "El sabor más elegante de La Ruleta acaba de encontrarte.",
    color: "#8B1E2B",
    textColor: "#FFFFFF"
  },
  {
    id: "08",
    name: "Chocolate Fudge Brownie",
    collection: "El Favorito",
    desc: "El rey del chocolate. Difícil empezar mejor.",
    color: "#3B1E19",
    textColor: "#FFFFFF"
  }
];

const MENSAJES_ALEATORIOS = [
  "✨ Hoy la suerte estuvo de tu lado.",
  "🎯 Buen giro. Gran elección.",
  "🎉 Comienza la experiencia DameOtro.",
  "🔥 Primer bocado... imposible detenerse.",
  "👀 ¿Lo compartirás o te lo quedarás?",
  "🤫 Dicen que este desaparece primero.",
  "😏 Cuidado... este suele crear antojos.",
  "💖 Ahora entiendes por qué son Hechos para repetir."
];

/* ==========================================================================
   ESTADO DE LA APLICACIÓN
   ========================================================================== */
let orderSequence = [];
let currentSequenceIndex = 0;
let unlockedSet = new Set();
let isSpinning = false;
let currentRotationAngle = 0; // en grados

// Web Audio API para efectos de sonido sin archivos externos
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playTickSound() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.04);
}

function playWinSound() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(440, now);
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);
  gain.gain.setValueAtTime(0.1, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(now + 0.4);
}

/* ==========================================================================
   ALGORITMO FISHER-YATES
   ========================================================================== */
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function initNewGameSession() {
  const indices = [0, 1, 2, 3, 4, 5, 6, 7];
  orderSequence = shuffleArray(indices);
  currentSequenceIndex = 0;
  unlockedSet.clear();
  updateTrackerUI();
}

/* ==========================================================================
   DIBUJO DE LA RULETA EN CANVAS
   ========================================================================== */
const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');

function drawWheel() {
  const size = canvas.width;
  const center = size / 2;
  const radius = center;
  const sliceAngle = (2 * Math.PI) / 8;

  ctx.clearRect(0, 0, size, size);

  SABORES.forEach((sabor, index) => {
    const angle = index * sliceAngle;

    // Segmento
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, angle, angle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = sabor.color;
    ctx.fill();

    // Divisor Dorado
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#D4AF37";
    ctx.stroke();

    // Texto Giro (01, 02, etc.)
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(angle + sliceAngle / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = sabor.textColor;
    ctx.font = "900 16px Montserrat";
    ctx.fillText(`GIRO ${sabor.id}`, radius - 25, 6);
    ctx.restore();
  });
}

/* ==========================================================================
   LÓGICA DE GIRO Y ANIMACIÓN
   ========================================================================== */
function spinWheel() {
  if (isSpinning) return;
  initAudio();

  if (currentSequenceIndex >= 8) {
    showFinalModal();
    return;
  }

  isSpinning = true;
  document.getElementById('centerSpinBtn').disabled = true;

  const targetSaborIndex = orderSequence[currentSequenceIndex];
  
  // Calcular ángulo final para que el segmento quede arriba (270deg / -90deg)
  const sliceDegrees = 360 / 8;
  const targetSegmentCenter = (targetSaborIndex * sliceDegrees) + (sliceDegrees / 2);
  
  // Posición deseada en el tope (270 grados)
  const targetAngleInWheel = 270 - targetSegmentCenter;
  
  // Mínimo 5 vueltas completas (1800 deg)
  const currentMod = currentRotationAngle % 360;
  const extraSpins = 360 * 5;
  const nextRotation = currentRotationAngle + extraSpins + (targetAngleInWheel - currentMod + 360) % 360;

  const duration = 4500; // 4.5 segundos
  const startTime = performance.now();
  const startAngle = currentRotationAngle;
  let lastTickAngle = startAngle;

  function animate(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Ease Out Cubic
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    currentRotationAngle = startAngle + (nextRotation - startAngle) * easeProgress;

    canvas.style.transform = `rotate(${currentRotationAngle}deg)`;

    // Efecto de sonido tic
    if (Math.abs(currentRotationAngle - lastTickAngle) >= 45) {
      playTickSound();
      lastTickAngle = currentRotationAngle;
    }

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      finishSpin(targetSaborIndex);
    }
  }

  requestAnimationFrame(animate);
}

function finishSpin(saborIndex) {
  isSpinning = false;
  document.getElementById('centerSpinBtn').disabled = false;
  playWinSound();

  // Vibración micro-animación
  const frame = document.querySelector('.wheel-frame');
  frame.classList.add('vibrate');
  setTimeout(() => frame.classList.remove('vibrate'), 200);

  // Registrar progreso
  unlockedSet.add(saborIndex + 1);
  updateTrackerUI();

  // Lanzar Confetti Elegante
  if (window.confetti) {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#D4AF37', '#3E1E19', '#F4C2D0']
    });
  }

  // Mostrar Modal de Resultado
  showResultModal(SABORES[saborIndex]);
  currentSequenceIndex++;
}

/* ==========================================================================
   ACTUALIZACIÓN DE UI Y MODALES
   ========================================================================== */
function updateTrackerUI() {
  document.querySelectorAll('.dot').forEach((dot) => {
    const step = parseInt(dot.getAttribute('data-step'));
    if (unlockedSet.has(step)) {
      dot.classList.add('unlocked');
    } else {
      dot.classList.remove('unlocked');
    }
  });
}

function showResultModal(sabor) {
  document.getElementById('modalGiroBadge').textContent = `🎲 GIRO ${sabor.id}`;
  document.getElementById('modalCollection').textContent = `👑 ${sabor.collection.toUpperCase()}`;
  document.getElementById('modalFlavorTitle').textContent = sabor.name;
  document.getElementById('modalFlavorDesc').textContent = `"${sabor.desc}"`;

  const randomQuote = MENSAJES_ALEATORIOS[Math.floor(Math.random() * MENSAJES_ALEATORIOS.length)];
  document.getElementById('modalRandomQuote').textContent = randomQuote;

  // Configurar enlace WhatsApp
  const wsMsg = encodeURIComponent(`¡Me tocó ${sabor.name} en La Ruleta de DameOtro! 🎲🍰\n¿Y a ti cuál te tocará?\nEscanéala y descúbrelo.`);
  document.getElementById('whatsappBtn').onclick = () => {
    window.open(`https://wa.me/?text=${wsMsg}`, '_blank');
  };

  // Configurar Compartir
  document.getElementById('shareBtn').onclick = () => {
    if (navigator.share) {
      navigator.share({
        title: 'LA RULETA – DameOtro',
        text: `¡Me tocó ${sabor.name} en La Ruleta de DameOtro!`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Enlace copiado al portapapeles.");
    }
  };

  document.getElementById('resultModal').classList.add('active');
}

function showFinalModal() {
  document.getElementById('finalModal').classList.add('active');
  if (window.confetti) {
    confetti({ particleCount: 100, spread: 100, origin: { y: 0.5 } });
  }
}

/* ==========================================================================
   EVENT LISTENERS E INICIALIZACIÓN
   ========================================================================== */
document.getElementById('startBtn').addEventListener('click', () => {
  document.getElementById('welcomeScreen').classList.remove('active');
  document.getElementById('gameScreen').classList.add('active');
  drawWheel();
});

document.getElementById('centerSpinBtn').addEventListener('click', spinWheel);

document.getElementById('spinAgainBtn').addEventListener('click', () => {
  document.getElementById('resultModal').classList.remove('active');
  if (currentSequenceIndex >= 8) {
    showFinalModal();
  }
});

document.getElementById('resetAllBtn').addEventListener('click', () => {
  document.getElementById('finalModal').classList.remove('active');
  initNewGameSession();
});

// Inicializar sesión
initNewGameSession();