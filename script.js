const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spinBtn');
const modal = document.getElementById('resultModal');
const closeModal = document.getElementById('closeModal');
const modalFlavor = document.getElementById('modalFlavor');
const modalDesc = document.getElementById('modalDesc');

const flavors = [
  { name: "Carrot Cake Atelier", desc: "Suave pastel de zanahoria con especias y frosting de queso crema." },
  { name: "Brownie Cheesecake Fusion", desc: "Mezcla perfecta entre brownie fudgy y cremoso cheesecake." },
  { name: "Apple Crumble Delight", desc: "Manzanas caramelizadas con crujiente crumble de canela." },
  { name: "Classic New York Cheesecake", desc: "El clásico cremoso sobre base crocante de galleta." },
  { name: "Brookie Supreme", desc: "La combinación definitiva de galleta chocochip y brownie." },
  { name: "Lemon Cream Pie", desc: "Refrescante crema de limón con merengue dorado suave." },
  { name: "Red Velvet Royale Cheesecake", desc: "Terciopelo rojo intenso con vetas de queso crema." },
  { name: "Chocolate Fudge Brownie", desc: "Intenso chocolate oscuro fundente en cada bocado." }
];

let startAngle = 0;
let arc = Math.PI / 4; // 8 divisiones
let spinTimeout = null;
let spinAngleStart = 10;
let spinTime = 0;
let spinTimeTotal = 0;

// Carga de la imagen fotográfica de la ruleta real
const rouletteImg = new Image();
rouletteImg.src = 'ruleta-postres.png'; // Asegúrate de guardar la foto de la ruleta con este nombre

rouletteImg.onload = function() {
  drawWheel();
};

// Si falla la carga de imagen, renderiza un respaldo con colores realistas
rouletteImg.onerror = function() {
  drawWheelFallback();
};

function drawWheel() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(startAngle);
  
  if (rouletteImg.complete && rouletteImg.naturalWidth !== 0) {
    // Dibujar foto real recortada en círculo
    ctx.beginPath();
    ctx.arc(0, 0, canvas.width / 2 - 5, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(rouletteImg, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
  } else {
    drawFallbackSlices();
  }
  
  // Dibujar divisiones doradas sobre la rueda
  for (let i = 0; i < 8; i++) {
    let angle = i * arc;
    ctx.beginPath();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3;
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * (canvas.width / 2), Math.sin(angle) * (canvas.width / 2));
    ctx.stroke();
  }
  
  ctx.restore();
}

function drawFallbackSlices() {
  const colors = ["#4a2c11", "#21110b", "#9c6328", "#ab392b", "#3b1e15", "#f4e2c7", "#731922", "#1f100c"];
  for (let i = 0; i < 8; i++) {
    let angle = i * arc;
    ctx.fillStyle = colors[i];
    ctx.beginPath();
    ctx.arc(0, 0, canvas.width / 2 - 5, angle, angle + arc, false);
    ctx.lineTo(0, 0);
    ctx.fill();
  }
}

function rotateWheel() {
  spinTime += 30;
  if (spinTime >= spinTimeTotal) {
    stopRotateWheel();
    return;
  }
  let spinAngle = spinAngleStart - easeOut(spinTime, 0, spinAngleStart, spinTimeTotal);
  startAngle += (spinAngle * Math.PI / 180);
  drawWheel();
  spinTimeout = setTimeout(rotateWheel, 30);
}

function stopRotateWheel() {
  clearTimeout(spinTimeout);
  let degrees = startAngle * 180 / Math.PI + 90;
  let arcd = arc * 180 / Math.PI;
  let index = Math.floor((360 - (degrees % 360)) / arcd);
  if (index < 0) index += 8;
  
  showResult(flavors[index % 8], index % 8);
}

function easeOut(t, b, c, d) {
  let ts = (t /= d) * t;
  let tc = ts * t;
  return b + c * (tc + -3 * ts + 3 * t);
}

spinBtn.addEventListener('click', () => {
  spinAngleStart = Math.random() * 10 + 10;
  spinTime = 0;
  spinTimeTotal = Math.random() * 3000 + 4000;
  rotateWheel();
});

function showResult(flavor, index) {
  modalFlavor.textContent = flavor.name;
  modalDesc.textContent = flavor.desc;
  modal.style.display = 'flex';
  
  // Desbloquear badge
  const badges = document.querySelectorAll('.badge');
  if (badges[index]) {
    badges[index].classList.add('unlocked');
  }
}

closeModal.onclick = () => modal.style.display = 'none';
window.onclick = (e) => { if (e.target == modal) modal.style.display = 'none'; };