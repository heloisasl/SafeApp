const { createCanvas } = require('canvas');
const fs = require('fs');

function desenharEscudo(ctx, cx, cy, tamanho) {
  const t = tamanho;
  ctx.save();
  ctx.translate(cx - t * 0.5, cy - t * 0.55);

  // Escudo gradiente
  const grad = ctx.createLinearGradient(0, 0, t, t);
  grad.addColorStop(0, '#8B1A1A');
  grad.addColorStop(1, '#5C0A0A');

  ctx.beginPath();
  ctx.moveTo(t * 0.5, 0);
  ctx.lineTo(t, t * 0.2);
  ctx.lineTo(t, t * 0.65);
  ctx.quadraticCurveTo(t, t, t * 0.5, t * 1.1);
  ctx.quadraticCurveTo(0, t, 0, t * 0.65);
  ctx.lineTo(0, t * 0.2);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Brilho borda escudo
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = t * 0.02;
  ctx.stroke();

  // Coração branco
  const hx = t * 0.5;
  const hy = t * 0.72;
  const hs = t * 0.48;

  ctx.beginPath();
  ctx.moveTo(hx, hy + hs * 0.4);
  ctx.bezierCurveTo(hx, hy, hx - hs, hy, hx - hs, hy - hs * 0.3);
  ctx.bezierCurveTo(hx - hs, hy - hs * 0.8, hx, hy - hs * 0.6, hx, hy - hs * 0.3);
  ctx.bezierCurveTo(hx, hy - hs * 0.6, hx + hs, hy - hs * 0.8, hx + hs, hy - hs * 0.3);
  ctx.bezierCurveTo(hx + hs, hy, hx, hy, hx, hy + hs * 0.4);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  ctx.restore();
}

// ===== ÍCONE 1024x1024 =====
function gerarIcone() {
  const canvas = createCanvas(1024, 1024);
  const ctx = canvas.getContext('2d');

  // Fundo
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, 1024, 1024);

  // Escudo centralizado
  desenharEscudo(ctx, 512, 480, 580);

  // Salva
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('./assets/icon.png', buffer);
  console.log('✅ icon.png gerado!');
}

// ===== SPLASH 1284x2778 =====
function gerarSplash() {
  const canvas = createCanvas(1284, 2778);
  const ctx = canvas.getContext('2d');

  // Fundo
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, 1284, 2778);

  // Escudo
  desenharEscudo(ctx, 642, 1100, 500);

  // Texto SafeApp
  ctx.font = 'bold 120px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Safe', 560, 1420);

  ctx.fillStyle = '#B03A10';
  ctx.fillText('app', 800, 1420);

  // Slogan
  ctx.font = '48px sans-serif';
  ctx.fillStyle = '#a0a0b0';
  ctx.letterSpacing = '8px';
  ctx.fillText('VOCÊ NÃO ESTÁ SÓ', 642, 1510);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('./assets/splash.png', buffer);
  console.log('✅ splash.png gerado!');
}

// ===== ADAPTIVE ICON (Android) =====
function gerarAdaptive() {
  const canvas = createCanvas(1024, 1024);
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, 1024, 1024);
  desenharEscudo(ctx, 512, 480, 580);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('./assets/adaptive-icon.png', buffer);
  console.log('✅ adaptive-icon.png gerado!');
}

gerarIcone();
gerarSplash();
gerarAdaptive();
console.log('\n🎉 Todos os assets gerados com sucesso!');   