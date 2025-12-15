document.addEventListener('DOMContentLoaded', () => {
  initApp();
  initSpeech();
  initVideo();
});

const spanishWords = ['manzana', 'plátano', 'naranja', 'hola', 'gracias', 'agua', 'libro', 'casa'];
let currentWordIndex = 0;

const videoItems = [
  { video: 'media/comer.mp4', answer: 'comer' },
  { video: 'media/beber.mp4', answer: 'beber' },
  { video: 'media/dormir.mp4', answer: 'dormir' }
];
let currentVideoIndex = 0;

function initVideo() {
  const video = document.getElementById('prompt-video');
  const playBtn = document.getElementById('video-play');
  const stopBtn = document.getElementById('video-stop');
  const progress = document.getElementById('video-progress');
  const timeDisplay = document.getElementById('video-time');
  const checkBtn = document.getElementById('video-check');
  const nextBtn = document.getElementById('video-next');
  const answerInput = document.getElementById('video-answer');
  const resultDiv = document.getElementById('video-result');

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
  }

  function updateTime() {
    const current = formatTime(video.currentTime);
    const duration = formatTime(video.duration || 0);
    timeDisplay.textContent = current + ' / ' + duration;
  }

  playBtn.addEventListener('click', function() {
    if (video.paused) {
      video.play();
      playBtn.textContent = 'Pause';
    } else {
      video.pause();
      playBtn.textContent = 'Play';
    }
  });

  stopBtn.addEventListener('click', function() {
    video.pause();
    video.currentTime = 0;
    playBtn.textContent = 'Play';
  });

  video.addEventListener('timeupdate', function() {
    const percent = (video.currentTime / video.duration) * 100;
    progress.value = percent || 0;
    updateTime();
  });

  video.addEventListener('loadedmetadata', function() {
    updateTime();
  });

  video.addEventListener('ended', function() {
    playBtn.textContent = 'Play';
  });

  video.addEventListener('play', function() {
    playBtn.textContent = 'Pause';
  });

  video.addEventListener('pause', function() {
    playBtn.textContent = 'Play';
  });

  progress.addEventListener('input', function() {
    const time = (progress.value / 100) * video.duration;
    video.currentTime = time;
  });

  video.src = videoItems[currentVideoIndex].video;
  video.load();

  checkBtn.addEventListener('click', function() {
    const userAnswer = answerInput.value.trim().toLowerCase();
    const correctAnswer = videoItems[currentVideoIndex].answer.toLowerCase();
    
    if (userAnswer === correctAnswer) {
      resultDiv.textContent = 'Correct! The answer is "' + correctAnswer + '"';
      resultDiv.className = 'result correct';
    } else {
      resultDiv.textContent = 'Incorrect. You wrote: "' + userAnswer + '" - Correct: "' + correctAnswer + '"';
      resultDiv.className = 'result incorrect';
    }
  });

  nextBtn.addEventListener('click', function() {
    currentVideoIndex = (currentVideoIndex + 1) % videoItems.length;
    video.src = videoItems[currentVideoIndex].video;
    video.load();
    answerInput.value = '';
    resultDiv.textContent = '';
    resultDiv.className = 'result';
    playBtn.textContent = 'Play';
  });
}

function initSpeech() {
  const hearBtn = document.getElementById('hear-btn');
  const speakBtn = document.getElementById('speak-btn');
  const nextWordBtn = document.getElementById('next-word-btn');
  const wordDisplay = document.getElementById('word-display');
  const status = document.getElementById('speech-status');
  const result = document.getElementById('speech-result');

  const synth = window.speechSynthesis;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = function() {
      status.textContent = 'Listening... Speak now!';
      status.className = 'status listening';
    };

    recognition.onresult = function(event) {
      const spoken = event.results[0][0].transcript.toLowerCase();
      const target = wordDisplay.textContent.toLowerCase();
      
      status.textContent = '';
      status.className = 'status';
      
      if (spoken === target) {
        result.textContent = 'Correct! You said: "' + spoken + '"';
        result.className = 'result correct';
      } else {
        result.textContent = 'You said: "' + spoken + '" - Expected: "' + target + '"';
        result.className = 'result incorrect';
      }
    };

    recognition.onerror = function() {
      status.textContent = 'Error. Please try again.';
      status.className = 'status';
    };

    recognition.onend = function() {
      if (status.textContent === 'Listening... Speak now!') {
        status.textContent = 'Did not hear anything. Try again.';
        status.className = 'status';
      }
    };
  }

  hearBtn.addEventListener('click', function() {
    const word = wordDisplay.textContent;
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'es-ES';
    utterance.rate = 0.8;
    synth.speak(utterance);
  });

  speakBtn.addEventListener('click', function() {
    if (recognition) {
      result.textContent = '';
      result.className = 'result';
      recognition.start();
    } else {
      status.textContent = 'Speech recognition not supported in this browser.';
    }
  });

  nextWordBtn.addEventListener('click', function() {
    currentWordIndex = (currentWordIndex + 1) % spanishWords.length;
    wordDisplay.textContent = spanishWords[currentWordIndex];
    result.textContent = '';
    result.className = 'result';
    status.textContent = '';
    status.className = 'status';
  });
}

function initApp() {
  const canvas = document.getElementById('sketch-canvas');
  const nextBtn = document.getElementById('sketch-next');
  const writeBtn = document.getElementById('sketch-write');
  const textInput = document.getElementById('sketch-text');
  

  const app = initCanvas(canvas);

  
  nextBtn.disabled = false;
  writeBtn.disabled = false;

  writeBtn.addEventListener('click', () => {
    app.writeText(textInput.value.trim());
  });

  nextBtn.addEventListener('click', () => {
    
    app.nextImage();
    textInput.value = '';
  });

  window.addEventListener('resize', () => app.resize());
}

function initCanvas(canvas) {
  if (!canvas) throw new Error('Canvas element not found');

  const ctx = canvas.getContext('2d', { alpha: true });
  
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  let dpr = window.devicePixelRatio || 1;
  let hintText = '';
  let currentImage = 0; 
  

  function resize() {
    
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    dpr = window.devicePixelRatio || 1;
    
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    
    redraw();
  }

  
  function redraw() {
    
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    
    drawBackground();

    
    
    if (hintText) drawHintText(hintText);
  }

  
  function drawBackground() {
    
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const radius = 12;
    ctx.save();
    
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#ffd');
    g.addColorStop(1, '#fff6cc');
    ctx.fillStyle = g;
    roundRect(ctx, 0, 0, w, h, radius);
    ctx.fill();

    
    if (currentImage === 0) drawApple(w, h);
    else if (currentImage === 1) drawBanana(w, h);
    else drawOrange(w, h);
    ctx.restore();
  }

  function drawApple(w, h) {
    const cx = w * 0.35;
    const cy = h * 0.45;
    const r = Math.min(w, h) * 0.18;
    ctx.beginPath();
    ctx.fillStyle = '#ff6b6b';
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = '#58d68d';
    ctx.ellipse(cx + r * 0.55, cy - r * 0.75, r * 0.32, r * 0.18, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.strokeStyle = '#6b4c2b';
    ctx.lineWidth = 4;
    ctx.moveTo(cx, cy - r * 0.8);
    ctx.lineTo(cx + r * 0.1, cy - r * 1.45);
    ctx.stroke();
  }

  function drawBanana(w, h) {
    const cx = w * 0.45;
    const cy = h * 0.5;
    const r = Math.min(w, h) * 0.22;
    
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.3);
    const L = r * 2.1;
    const H = r * 0.8;
    
    ctx.beginPath();
    ctx.moveTo(-L * 0.5, -H * 0.35);
    ctx.quadraticCurveTo(-L * 0.15, -H * 1.0, L * 0.45, -H * 0.3);
    ctx.quadraticCurveTo(L * 0.2, H * 0.95, -L * 0.55, H * 0.4);
    ctx.closePath();
    const grad = ctx.createLinearGradient(-L * 0.5, 0, L * 0.5, 0);
    grad.addColorStop(0, '#ffd23f');
    grad.addColorStop(0.6, '#ffcf4d');
    grad.addColorStop(1, '#ffd23f');
    ctx.fillStyle = grad;
    ctx.fill();

    
    ctx.beginPath();
    ctx.moveTo(-L * 0.25, -H * 0.15);
    ctx.quadraticCurveTo(0, -H * 0.55, L * 0.28, -H * 0.11);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 3;
    ctx.stroke();

    
    ctx.beginPath();
    ctx.fillStyle = '#6b4c2b';
    roundRect(ctx, L * 0.35, -H * 0.42, L * 0.08, H * 0.16, 3);
    ctx.fill();

    
    ctx.restore();
  }

  function drawOrange(w, h) {
    const cx = w * 0.32;
    const cy = h * 0.5;
    const r = Math.min(w, h) * 0.17;
    
    ctx.save();
    const rg = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, r * 0.05, cx, cy, r);
    rg.addColorStop(0, '#ffd07a');
    rg.addColorStop(0.6, '#ff9f1c');
    rg.addColorStop(1, '#f68b1f');
    ctx.beginPath();
    ctx.fillStyle = rg;
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    
    ctx.beginPath();
    ctx.fillStyle = '#f2a43d';
    ctx.arc(cx + r * 0.08, cy - r * 0.05, r * 0.07, 0, Math.PI * 2);
    ctx.fill();

    
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * Math.PI * 2;
      const x1 = cx + Math.cos(a) * r * 0.1;
      const y1 = cy + Math.sin(a) * r * 0.1;
      const x2 = cx + Math.cos(a) * r * 0.9;
      const y2 = cy + Math.sin(a) * r * 0.9;
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.stroke();

    
    
    ctx.beginPath();
    ctx.save();
    ctx.translate(cx + r * 0.62, cy - r * 0.68);
    ctx.rotate(-0.6);
    ctx.fillStyle = '#5ec26b';
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(r * 0.2, -r * 0.45, r * 0.7, -r * 0.5);
    ctx.quadraticCurveTo(r * -0.15, -r * 0.18, 0, 0);
    ctx.fill();
    ctx.restore();
    ctx.restore();
  }

  function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }


  function nextImage() {
    currentImage = (currentImage + 1) % 3;
    hintText = '';
    redraw();
  }
  
  function writeText(word) {
    hintText = word || '';
    redraw();
  }

  function drawHintText(text) {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.save();
    ctx.fillStyle = '#222';
    
    const base = Math.max(28, Math.floor(Math.min(w, h) / 6));
    ctx.font = `bold ${base}px system-ui, Arial`; 
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w * 0.7, h * 0.55);
    ctx.restore();
  }

  
  resize();

  return { resize, writeText, nextImage };
}
