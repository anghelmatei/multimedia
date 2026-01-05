/* Spanish Pronunciation Coach - JavaScript Logic
   Uses: Video API, Audio API (Web Speech API), Canvas API */

// Wait for HTML to load before running JavaScript
document.addEventListener('DOMContentLoaded', () => {
  initApp();     // Canvas/drawing functionality
  initSpeech();  // Pronunciation practice (Text-to-Speech + Speech Recognition)
  initVideo();   // Video player controls
});

// === GLOBAL VARIABLES ===
const spanishWords = ['manzana', 'plátano', 'naranja', 'hola', 'gracias', 'agua', 'libro', 'casa']; // Words for pronunciation practice
let currentWordIndex = 0; // Tracks current word (array indices start at 0)

const videoItems = [ // Array of video objects with answers
  { video: 'media/comer.mp4', answer: 'comer' },   // "to eat"
  { video: 'media/beber.mp4', answer: 'beber' },   // "to drink"
  { video: 'media/dormir.mp4', answer: 'dormir' }  // "to sleep"
];
let currentVideoIndex = 0; // Tracks current video

// === VIDEO PLAYER FUNCTIONALITY (VIDEO API) ===
function initVideo() {
  // Get all DOM elements we need
  const video = document.getElementById('prompt-video');        // The <video> element
  const playBtn = document.getElementById('video-play');        // Play/Pause button
  const stopBtn = document.getElementById('video-stop');        // Stop button
  const progress = document.getElementById('video-progress');   // Progress slider (0-100)
  const timeDisplay = document.getElementById('video-time');    // Time text display
  const checkBtn = document.getElementById('video-check');      // Check answer button
  const nextBtn = document.getElementById('video-next');        // Next video button
  const answerInput = document.getElementById('video-answer');  // Text input for answer
  const resultDiv = document.getElementById('video-result');    // Result feedback area

  // Convert seconds to MM:SS format
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);           // Get whole minutes
    const secs = Math.floor(seconds % 60);           // Get remaining seconds (modulo %)
    return mins + ':' + (secs < 10 ? '0' : '') + secs; // Add leading 0 if needed (ternary operator)
  }

  // Update time display with current/total time
  function updateTime() {
    const current = formatTime(video.currentTime);
    const duration = formatTime(video.duration || 0); // || 0 handles NaN/undefined
    timeDisplay.textContent = current + ' / ' + duration; // textContent sets text safely
  }

  // Play/Pause toggle
  playBtn.addEventListener('click', function() {
    if (video.paused) { // video.paused is boolean property
      video.play();
      playBtn.textContent = 'Pause';
    } else {
      video.pause();
      playBtn.textContent = 'Play';
    }
  });

  // Stop = pause + reset to start
  stopBtn.addEventListener('click', function() {
    video.pause();
    video.currentTime = 0; // Seek to beginning (0 seconds)
    playBtn.textContent = 'Play';
  });

  // Update progress bar as video plays (fires many times/second)
  video.addEventListener('timeupdate', function() {
    const percent = (video.currentTime / video.duration) * 100; // Calculate percentage
    progress.value = percent || 0;
    updateTime();
  });

  // When metadata loads, show total duration
  video.addEventListener('loadedmetadata', function() {
    updateTime();
  });

  // When video ends, reset button text
  video.addEventListener('ended', function() {
    playBtn.textContent = 'Play';
  });

  // Keep button text synced with video state
  video.addEventListener('play', function() {
    playBtn.textContent = 'Pause';
  });

  video.addEventListener('pause', function() {
    playBtn.textContent = 'Play';
  });

  // Seek when user drags progress bar
  progress.addEventListener('input', function() {
    const time = (progress.value / 100) * video.duration; // Convert percent to seconds
    video.currentTime = time; // Seek to that time
  });

  // Load initial video
  video.src = videoItems[currentVideoIndex].video; // Access array element, then .video property
  video.load(); // Reload video with new source

  // Check if answer is correct
  checkBtn.addEventListener('click', function() {
    const userAnswer = answerInput.value.trim().toLowerCase(); // .trim() removes whitespace, .toLowerCase() for case-insensitive
    const correctAnswer = videoItems[currentVideoIndex].answer.toLowerCase();
    
    if (userAnswer === correctAnswer) { // === checks equality
      resultDiv.textContent = 'Correct! The answer is "' + correctAnswer + '"';
      resultDiv.className = 'result correct'; // Applies green CSS styling
    } else {
      resultDiv.textContent = 'Incorrect. You wrote: "' + userAnswer + '" - Correct: "' + correctAnswer + '"';
      resultDiv.className = 'result incorrect'; // Applies red CSS styling
    }
  });

  // Next video button
  nextBtn.addEventListener('click', function() {
    currentVideoIndex = (currentVideoIndex + 1) % videoItems.length; // Modulo % wraps around (2+1=3, 3%3=0)
    
    video.src = videoItems[currentVideoIndex].video;
    video.load();
    
    answerInput.value = '';          // Clear input
    resultDiv.textContent = '';      // Clear result
    resultDiv.className = 'result';  // Reset styling
    playBtn.textContent = 'Play';
  });
}

// === SPEECH FUNCTIONALITY (AUDIO API - Web Speech API) ===
function initSpeech() {
  // Get DOM elements
  const hearBtn = document.getElementById('hear-btn');
  const speakBtn = document.getElementById('speak-btn');
  const nextWordBtn = document.getElementById('next-word-btn');
  const wordDisplay = document.getElementById('word-display');
  const status = document.getElementById('speech-status');
  const result = document.getElementById('speech-result');

  const synth = window.speechSynthesis; // Text-to-Speech engine

  // Speech Recognition setup (handles browser prefixes)
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition; // || falls back to webkit if standard not available
  let recognition = null;

  if (SpeechRecognition) { // Only if browser supports it
    recognition = new SpeechRecognition();
    
    recognition.lang = 'es-ES';         // Spanish language
    recognition.continuous = false;      // Stop after one phrase
    recognition.interimResults = false;  // Only final results

    // When recognition starts listening
    recognition.onstart = function() {
      status.textContent = 'Listening... Speak now!';
      status.className = 'status listening'; // Yellow background
    };

    // When speech is recognized
    recognition.onresult = function(event) {
      const spoken = event.results[0][0].transcript.toLowerCase(); // Get recognized text from results array
      const target = wordDisplay.textContent.toLowerCase();
      
      status.textContent = '';
      status.className = 'status';
      
      if (spoken === target) { // Compare spoken word to target
        result.textContent = 'Correct! You said: "' + spoken + '"';
        result.className = 'result correct';
      } else {
        result.textContent = 'You said: "' + spoken + '" - Expected: "' + target + '"';
        result.className = 'result incorrect';
      }
    };

    // When error occurs
    recognition.onerror = function() {
      status.textContent = 'Error. Please try again.';
      status.className = 'status';
    };

    // When recognition ends (timeout or finished)
    recognition.onend = function() {
      if (status.textContent === 'Listening... Speak now!') { // If still showing "listening", means timeout
        status.textContent = 'Did not hear anything. Try again.';
        status.className = 'status';
      }
    };
  }

  // Text-to-Speech: Hear the word
  hearBtn.addEventListener('click', function() {
    const word = wordDisplay.textContent;
    
    const utterance = new SpeechSynthesisUtterance(word); // Create speech object
    utterance.lang = 'es-ES';  // Spanish pronunciation
    utterance.rate = 0.8;      // Slightly slower speed (0.1-10, 1 is normal)
    
    synth.speak(utterance);    // Speak it
  });

  // Speech Recognition: Listen to user
  speakBtn.addEventListener('click', function() {
    if (recognition) {
      result.textContent = '';
      result.className = 'result';
      recognition.start(); // Start listening
    } else {
      status.textContent = 'Speech recognition not supported in this browser.';
    }
  });

  // Next word button
  nextWordBtn.addEventListener('click', function() {
    currentWordIndex = (currentWordIndex + 1) % spanishWords.length; // Wrap around with modulo
    
    wordDisplay.textContent = spanishWords[currentWordIndex];
    
    result.textContent = '';
    result.className = 'result';
    status.textContent = '';
    status.className = 'status';
  });
}

// === CANVAS APP INITIALIZATION (CANVAS API) ===
function initApp() {
  // Get DOM elements
  const canvas = document.getElementById('sketch-canvas');
  const nextBtn = document.getElementById('sketch-next');
  const writeBtn = document.getElementById('sketch-write');
  const textInput = document.getElementById('sketch-text');
  
  const app = initCanvas(canvas); // Returns object with { resize, writeText, nextImage } methods

  nextBtn.disabled = false;
  writeBtn.disabled = false;

  // Draw typed text on canvas
  writeBtn.addEventListener('click', () => {
    app.writeText(textInput.value.trim());
  });

  // Show next fruit image
  nextBtn.addEventListener('click', () => {
    app.nextImage();
    textInput.value = '';
  });

  // Recalculate canvas size when window resizes
  window.addEventListener('resize', () => app.resize());
}

// === CANVAS DRAWING MODULE ===
// Sets up and controls all canvas drawing (fruits and text)
function initCanvas(canvas) {
  if (!canvas) throw new Error('Canvas element not found'); // Error checking

  const ctx = canvas.getContext('2d', { alpha: true }); // 2D drawing context (what we draw on)
  
  ctx.lineCap = 'round';  // Rounded line ends
  ctx.lineJoin = 'round'; // Rounded corners

  // State variables
  let dpr = window.devicePixelRatio || 1; // Device pixel ratio for high-DPI screens (Retina, etc.)
  let hintText = '';          // User's typed text
  let currentImage = 0;       // Which fruit (0=apple, 1=banana, 2=orange)
  
  // Adjusts canvas size for responsive display and high-DPI
  function resize() {
    const width = canvas.clientWidth;   // CSS width
    const height = canvas.clientHeight; // CSS height
    
    dpr = window.devicePixelRatio || 1;
    
    // Set actual canvas resolution (higher on Retina displays)
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    // Set display size (how big it appears)
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    // Scale context so we can use logical pixels in drawing code
    // setTransform(scaleX, skewX, skewY, scaleY, translateX, translateY)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    redraw();
  }

  // Clears and redraws everything
  function redraw() {
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr); // Clear entire canvas
    drawBackground();
    if (hintText) drawHintText(hintText);
  }

  // Draws gradient background and current fruit
  function drawBackground() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const radius = 12;
    
    ctx.save(); // Save current state
    
    // Create vertical gradient (top to bottom)
    const g = ctx.createLinearGradient(0, 0, 0, h); // (startX, startY, endX, endY)
    g.addColorStop(0, '#ffd');     // Light yellow at top (position 0)
    g.addColorStop(1, '#fff6cc');  // Darker at bottom (position 1)
    
    ctx.fillStyle = g;
    roundRect(ctx, 0, 0, w, h, radius); // Draw rounded rectangle
    ctx.fill(); // Fill with gradient

    // Draw current fruit
    if (currentImage === 0) drawApple(w, h);
    else if (currentImage === 1) drawBanana(w, h);
    else drawOrange(w, h);
    
    ctx.restore(); // Restore previous state
  }

  // Draws an apple using circles and lines
  function drawApple(w, h) {
    const cx = w * 0.35; // Center X (35% from left)
    const cy = h * 0.45; // Center Y (45% from top)
    const r = Math.min(w, h) * 0.18; // Radius (18% of smaller dimension)
    
    // Apple body (circle)
    ctx.beginPath();
    ctx.fillStyle = '#ff6b6b'; // Red
    ctx.arc(cx, cy, r, 0, Math.PI * 2); // arc(x, y, radius, startAngle, endAngle) - full circle is 2π
    ctx.fill();
    
    // Leaf (ellipse)
    ctx.beginPath();
    ctx.fillStyle = '#58d68d'; // Green
    ctx.ellipse(cx + r * 0.55, cy - r * 0.75, r * 0.32, r * 0.18, -0.6, 0, Math.PI * 2); // ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle)
    ctx.fill();
    
    // Stem (line)
    ctx.beginPath();
    ctx.strokeStyle = '#6b4c2b'; // Brown
    ctx.lineWidth = 4;
    ctx.moveTo(cx, cy - r * 0.8);           // Move to start point (doesn't draw)
    ctx.lineTo(cx + r * 0.1, cy - r * 1.45); // Draw line to end point
    ctx.stroke(); // Actually draw the line (stroke = outline)
  }

  // Draws a banana using curves and transformations
  function drawBanana(w, h) {
    const cx = w * 0.45;
    const cy = h * 0.5;
    const r = Math.min(w, h) * 0.22;
    
    ctx.save();
    ctx.translate(cx, cy); // Move origin to center (like moving paper under pen)
    ctx.rotate(-0.3);      // Rotate everything (0.3 radians counterclockwise)
    
    const L = r * 2.1; // Length
    const H = r * 0.8; // Height
    
    // Banana shape using quadratic curves
    ctx.beginPath();
    ctx.moveTo(-L * 0.5, -H * 0.35);
    ctx.quadraticCurveTo(-L * 0.15, -H * 1.0, L * 0.45, -H * 0.3); // quadraticCurveTo(controlX, controlY, endX, endY) - creates curve
    ctx.quadraticCurveTo(L * 0.2, H * 0.95, -L * 0.55, H * 0.4);
    ctx.closePath(); // Connect back to start
    
    // Gradient for color variation
    const grad = ctx.createLinearGradient(-L * 0.5, 0, L * 0.5, 0); // Horizontal gradient
    grad.addColorStop(0, '#ffd23f');
    grad.addColorStop(0.6, '#ffcf4d');
    grad.addColorStop(1, '#ffd23f');
    ctx.fillStyle = grad;
    ctx.fill();

    // Highlight line (3D effect)
    ctx.beginPath();
    ctx.moveTo(-L * 0.25, -H * 0.15);
    ctx.quadraticCurveTo(0, -H * 0.55, L * 0.28, -H * 0.11);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; // Semi-transparent white (RGBA: red, green, blue, alpha)
    ctx.lineWidth = 3;
    ctx.stroke();

    // Brown tip
    ctx.beginPath();
    ctx.fillStyle = '#6b4c2b';
    roundRect(ctx, L * 0.35, -H * 0.42, L * 0.08, H * 0.16, 3);
    ctx.fill();

    ctx.restore(); // Undo translate and rotate
  }

  // Draws an orange using radial gradient and texture lines
  function drawOrange(w, h) {
    const cx = w * 0.32;
    const cy = h * 0.5;
    const r = Math.min(w, h) * 0.17;
    
    ctx.save();
    
    // Radial gradient for 3D sphere effect
    const rg = ctx.createRadialGradient( // createRadialGradient(x1, y1, r1, x2, y2, r2) - gradient between two circles
      cx - r * 0.2, cy - r * 0.2, r * 0.05, // Inner circle (highlight)
      cx, cy, r                              // Outer circle
    );
    rg.addColorStop(0, '#ffd07a');    // Light center
    rg.addColorStop(0.6, '#ff9f1c');  // Medium
    rg.addColorStop(1, '#f68b1f');    // Dark edge
    
    // Main orange circle
    ctx.beginPath();
    ctx.fillStyle = rg;
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Navel (small circle)
    ctx.beginPath();
    ctx.fillStyle = '#f2a43d';
    ctx.arc(cx + r * 0.08, cy - r * 0.05, r * 0.07, 0, Math.PI * 2);
    ctx.fill();

    // Texture lines radiating from center
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; // Very subtle
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 10; i++) { // Loop 10 times for 10 lines
      const a = i / 10 * Math.PI * 2; // Angle for this line (divide circle into 10)
      
      // Trigonometry: cos gives X component, sin gives Y component of direction
      const x1 = cx + Math.cos(a) * r * 0.1; // Inner point
      const y1 = cy + Math.sin(a) * r * 0.1;
      const x2 = cx + Math.cos(a) * r * 0.9; // Outer point
      const y2 = cy + Math.sin(a) * r * 0.9;
      
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.stroke();

    // Leaf
    ctx.beginPath();
    ctx.save();
    ctx.translate(cx + r * 0.62, cy - r * 0.68);
    ctx.rotate(-0.6);
    ctx.fillStyle = '#5ec26b'; // Green
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(r * 0.2, -r * 0.45, r * 0.7, -r * 0.5);
    ctx.quadraticCurveTo(r * -0.15, -r * 0.18, 0, 0);
    ctx.fill();
    ctx.restore();
    
    ctx.restore();
  }

  // Helper: draws rounded rectangle
  function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);                                    // Start at top-left (offset by radius)
    ctx.lineTo(x + width - radius, y);                             // Top edge
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);    // Top-right corner curve
    ctx.lineTo(x + width, y + height - radius);                    // Right edge
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height); // Bottom-right corner
    ctx.lineTo(x + radius, y + height);                            // Bottom edge
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);  // Bottom-left corner
    ctx.lineTo(x, y + radius);                                     // Left edge
    ctx.quadraticCurveTo(x, y, x + radius, y);                    // Top-left corner
    ctx.closePath();
  }

  // Cycle to next fruit
  function nextImage() {
    currentImage = (currentImage + 1) % 3; // Wrap around (0→1→2→0)
    hintText = '';
    redraw();
  }
  
  // Set text to display
  function writeText(word) {
    hintText = word || ''; // Use word or empty string if null/undefined
    redraw();
  }

  // Draw user's text on canvas
  function drawHintText(text) {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    
    ctx.save();
    ctx.fillStyle = '#222'; // Dark text
    
    const base = Math.max(28, Math.floor(Math.min(w, h) / 6)); // Calculate font size (min 28px)
    ctx.font = `bold ${base}px system-ui, Arial`; // Set font (format: "weight size family")
    
    ctx.textAlign = 'center';   // Horizontal alignment
    ctx.textBaseline = 'middle'; // Vertical alignment
    
    ctx.fillText(text, w * 0.7, h * 0.55); // fillText(text, x, y) - draws text at position
    
    ctx.restore();
  }

  resize(); // Initial setup

  return { resize, writeText, nextImage }; // Return public methods (module pattern)
}
