/* ============================================================
   JAVASCRIPT - APP.JS
   ============================================================
   JavaScript (JS) makes web pages interactive. It can:
   - Respond to user actions (clicks, typing, etc.)
   - Modify HTML content dynamically
   - Communicate with servers
   - Use browser APIs (speech, video, canvas, etc.)
   
   This file contains all the logic for our Spanish learning app.
   ============================================================ */

/* ------------------------------------------------------------
   DOM CONTENT LOADED EVENT LISTENER
   ------------------------------------------------------------
   The DOM (Document Object Model) is the browser's representation
   of the HTML structure as a tree of objects that JS can manipulate.
   
   'DOMContentLoaded' is an event that fires when the HTML is fully
   loaded and parsed (but images/videos may still be loading).
   
   We wait for this event before running our code to ensure all
   HTML elements exist and can be found by JavaScript.
   
   Syntax breakdown:
   - document: the web page object
   - addEventListener: attaches a function to run when event occurs
   - 'DOMContentLoaded': the event name
   - () => { ... }: arrow function (modern JS syntax for functions)
   ------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
  // Initialize all three parts of our app
  initApp();     // Canvas/drawing functionality
  initSpeech();  // Pronunciation practice (speech synthesis/recognition)
  initVideo();   // Video player controls
});

/* ------------------------------------------------------------
   GLOBAL VARIABLES
   ------------------------------------------------------------
   Variables declared outside functions are "global" - accessible
   from anywhere in this file.
   
   const: declares a constant (cannot be reassigned)
   let: declares a variable that can be changed later
   ------------------------------------------------------------ */

// Array (list) of Spanish words for pronunciation practice
// Arrays use square brackets [] and items are separated by commas
const spanishWords = ['manzana', 'plátano', 'naranja', 'hola', 'gracias', 'agua', 'libro', 'casa'];

// Tracks which word we're currently showing (0 = first word "manzana")
// Array indices start at 0, not 1
let currentWordIndex = 0;

/* 
   Array of objects for video exercises.
   Objects use curly braces {} and contain key: value pairs.
   Each object has:
   - video: path to the video file
   - answer: the correct Spanish word for that video
*/
const videoItems = [
  { video: 'media/comer.mp4', answer: 'comer' },   // "to eat"
  { video: 'media/beber.mp4', answer: 'beber' },   // "to drink"
  { video: 'media/dormir.mp4', answer: 'dormir' }  // "to sleep"
];

// Tracks which video we're currently showing
let currentVideoIndex = 0;

/* ============================================================
   VIDEO PLAYER FUNCTIONALITY
   ============================================================
   This function sets up all video-related features:
   - Play/Pause/Stop controls
   - Progress bar (seeking)
   - Time display
   - Answer checking
   ============================================================ */
function initVideo() {
  /* ----------------------------------------------------------
     DOM ELEMENT SELECTION
     ----------------------------------------------------------
     document.getElementById() finds an HTML element by its id attribute.
     We store references to elements in variables so we can:
     1. Add event listeners to them
     2. Read their values
     3. Modify their content
     ---------------------------------------------------------- */
  const video = document.getElementById('prompt-video');        // The <video> element
  const playBtn = document.getElementById('video-play');        // Play/Pause button
  const stopBtn = document.getElementById('video-stop');        // Stop button
  const progress = document.getElementById('video-progress');   // Progress slider
  const timeDisplay = document.getElementById('video-time');    // Time text display
  const checkBtn = document.getElementById('video-check');      // Check answer button
  const nextBtn = document.getElementById('video-next');        // Next video button
  const answerInput = document.getElementById('video-answer');  // Text input for answer
  const resultDiv = document.getElementById('video-result');    // Result feedback area

  /* ----------------------------------------------------------
     HELPER FUNCTION: formatTime
     ----------------------------------------------------------
     Converts seconds (like 125.7) into a readable format (2:05).
     
     Parameters: seconds - a number representing total seconds
     Returns: a formatted string like "2:05"
     
     Math.floor(): rounds DOWN to nearest integer (125.7 → 125)
     % (modulo): gives remainder after division (125 % 60 = 5)
     
     Ternary operator (condition ? valueIfTrue : valueIfFalse):
     Used to add leading zero for single-digit seconds (5 → "05")
     ---------------------------------------------------------- */
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);           // Get whole minutes
    const secs = Math.floor(seconds % 60);           // Get remaining seconds
    // If seconds < 10, add a '0' prefix (e.g., "05" instead of "5")
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
  }

  /* ----------------------------------------------------------
     HELPER FUNCTION: updateTime
     ----------------------------------------------------------
     Updates the time display to show current position and duration.
     
     video.currentTime: current playback position in seconds
     video.duration: total video length in seconds
     
     || 0: "or 0" - fallback if duration is undefined/NaN
     textContent: sets the text inside an element (safer than innerHTML)
     ---------------------------------------------------------- */
  function updateTime() {
    const current = formatTime(video.currentTime);
    const duration = formatTime(video.duration || 0);
    timeDisplay.textContent = current + ' / ' + duration;
  }

  /* ----------------------------------------------------------
     EVENT LISTENER: Play Button Click
     ----------------------------------------------------------
     addEventListener attaches a function to run when an event occurs.
     'click' event fires when user clicks the button.
     
     function() { ... } is a callback - a function passed to another
     function to be executed later (when the event happens).
     
     video.paused: boolean property - true if video is not playing
     video.play(): method that starts video playback
     video.pause(): method that pauses video playback
     .textContent: changes the button's text
     ---------------------------------------------------------- */
  playBtn.addEventListener('click', function() {
    if (video.paused) {
      // Video is paused, so start playing
      video.play();
      playBtn.textContent = 'Pause';  // Change button text
    } else {
      // Video is playing, so pause it
      video.pause();
      playBtn.textContent = 'Play';
    }
  });

  /* ----------------------------------------------------------
     EVENT LISTENER: Stop Button Click
     ----------------------------------------------------------
     Stop = pause + reset to beginning
     video.currentTime = 0 seeks to the start of the video
     ---------------------------------------------------------- */
  stopBtn.addEventListener('click', function() {
    video.pause();             // Stop playback
    video.currentTime = 0;     // Reset to beginning (0 seconds)
    playBtn.textContent = 'Play';
  });

  /* ----------------------------------------------------------
     EVENT LISTENER: Video Time Update
     ----------------------------------------------------------
     'timeupdate' event fires frequently as video plays (many times/second).
     We use it to keep the progress bar and time display synchronized.
     
     Progress bar value is 0-100 (percentage), so we calculate:
     (currentTime / duration) * 100 = percentage complete
     ---------------------------------------------------------- */
  video.addEventListener('timeupdate', function() {
    const percent = (video.currentTime / video.duration) * 100;
    progress.value = percent || 0;  // || 0 handles NaN case
    updateTime();
  });

  /* ----------------------------------------------------------
     EVENT LISTENER: Video Metadata Loaded
     ----------------------------------------------------------
     'loadedmetadata' fires when browser knows video's duration, 
     dimensions, etc. (but before full video is downloaded).
     
     We update the time display to show total duration.
     ---------------------------------------------------------- */
  video.addEventListener('loadedmetadata', function() {
    updateTime();
  });

  /* ----------------------------------------------------------
     EVENT LISTENER: Video Ended
     ----------------------------------------------------------
     'ended' event fires when video reaches the end.
     We reset the play button text.
     ---------------------------------------------------------- */
  video.addEventListener('ended', function() {
    playBtn.textContent = 'Play';
  });

  /* ----------------------------------------------------------
     EVENT LISTENERS: Play and Pause Events
     ----------------------------------------------------------
     These fire whenever video starts playing or pauses
     (even if triggered by other means, not just our buttons).
     Keeps button text synchronized with actual video state.
     ---------------------------------------------------------- */
  video.addEventListener('play', function() {
    playBtn.textContent = 'Pause';
  });

  video.addEventListener('pause', function() {
    playBtn.textContent = 'Play';
  });

  /* ----------------------------------------------------------
     EVENT LISTENER: Progress Bar Input (Seeking)
     ----------------------------------------------------------
     'input' event fires when user drags the slider.
     
     We convert the percentage (0-100) back to seconds:
     (percentage / 100) * duration = time in seconds
     
     Setting video.currentTime seeks to that position.
     ---------------------------------------------------------- */
  progress.addEventListener('input', function() {
    const time = (progress.value / 100) * video.duration;
    video.currentTime = time;
  });

  /* ----------------------------------------------------------
     INITIALIZE VIDEO SOURCE
     ----------------------------------------------------------
     Set the initial video to the first item in our array.
     
     video.src: sets the source URL for the video
     video.load(): reloads the video with the new source
     
     Array access: videoItems[0] gets first item (index 0)
     Object property access: .video gets the 'video' property
     ---------------------------------------------------------- */
  video.src = videoItems[currentVideoIndex].video;
  video.load();

  /* ----------------------------------------------------------
     EVENT LISTENER: Check Answer Button
     ----------------------------------------------------------
     Compares user's typed answer with the correct answer.
     
     .trim(): removes whitespace from start/end of string
   .toLowerCase(): converts to lowercase for case-insensitive comparison
     
     .className: sets the element's CSS class(es)
     Adding 'correct' or 'incorrect' applies different CSS colors
     ---------------------------------------------------------- */
  checkBtn.addEventListener('click', function() {
    // Get and normalize user's answer
    const userAnswer = answerInput.value.trim().toLowerCase();
    // Get correct answer from our data array
    const correctAnswer = videoItems[currentVideoIndex].answer.toLowerCase();
    
    // Compare answers
    if (userAnswer === correctAnswer) {
      // Correct! Show green success message
      resultDiv.textContent = 'Correct! The answer is "' + correctAnswer + '"';
      resultDiv.className = 'result correct';  // Applies green styling
    } else {
      // Incorrect - show red message with both answers
      resultDiv.textContent = 'Incorrect. You wrote: "' + userAnswer + '" - Correct: "' + correctAnswer + '"';
      resultDiv.className = 'result incorrect';  // Applies red styling
    }
  });

  /* ----------------------------------------------------------
     EVENT LISTENER: Next Video Button
     ----------------------------------------------------------
     Advances to the next video in our array.
     
     Modulo operator (%) wraps around:
     (2 + 1) % 3 = 0  → After last video, go back to first
     
     This creates a circular/infinite loop through videos.
     ---------------------------------------------------------- */
  nextBtn.addEventListener('click', function() {
    // Move to next video (wrap around using modulo)
    currentVideoIndex = (currentVideoIndex + 1) % videoItems.length;
    
    // Load the new video
    video.src = videoItems[currentVideoIndex].video;
    video.load();
    
    // Reset the form/display
    answerInput.value = '';          // Clear the input
    resultDiv.textContent = '';      // Clear result message
    resultDiv.className = 'result';  // Reset to base styling (no color)
    playBtn.textContent = 'Play';    // Reset button text
  });
}

/* ============================================================
   SPEECH FUNCTIONALITY (Text-to-Speech & Speech Recognition)
   ============================================================
   This function sets up:
   - Text-to-Speech: Computer speaks the Spanish word aloud
   - Speech Recognition: Computer listens to user's pronunciation
   
   Uses the Web Speech API, which is built into modern browsers.
   ============================================================ */
function initSpeech() {
  /* ----------------------------------------------------------
     DOM ELEMENT SELECTION
     ---------------------------------------------------------- */
  const hearBtn = document.getElementById('hear-btn');
  const speakBtn = document.getElementById('speak-btn');
  const nextWordBtn = document.getElementById('next-word-btn');
  const wordDisplay = document.getElementById('word-display');
  const status = document.getElementById('speech-status');
  const result = document.getElementById('speech-result');

  /* ----------------------------------------------------------
     SPEECH SYNTHESIS (Text-to-Speech)
     ----------------------------------------------------------
     window.speechSynthesis is the browser's text-to-speech engine.
     It can convert text into spoken audio.
     ---------------------------------------------------------- */
  const synth = window.speechSynthesis;

  /* ----------------------------------------------------------
     SPEECH RECOGNITION SETUP
     ----------------------------------------------------------
     SpeechRecognition API converts spoken words into text.
     
     Different browsers use different names for this API:
     - window.SpeechRecognition (standard)
     - window.webkitSpeechRecognition (Chrome/Safari prefix)
     
     The || operator tries the first, falls back to the second.
     ---------------------------------------------------------- */
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  // Variable to hold our recognition instance (null if unsupported)
  let recognition = null;

  // Only set up if browser supports speech recognition
  if (SpeechRecognition) {
    // Create new recognition instance
    recognition = new SpeechRecognition();
    
    /* --------------------------------------------------------
       SPEECH RECOGNITION CONFIGURATION
       -------------------------------------------------------- */
    recognition.lang = 'es-ES';         // Set language to Spanish (Spain)
    recognition.continuous = false;      // Stop after one phrase (not continuous)
    recognition.interimResults = false;  // Only give final results, not partial

    /* --------------------------------------------------------
       RECOGNITION EVENT: onstart
       --------------------------------------------------------
       Fires when recognition begins listening.
       We show a status message to inform the user.
       -------------------------------------------------------- */
    recognition.onstart = function() {
      status.textContent = 'Listening... Speak now!';
      status.className = 'status listening';  // Yellow "listening" style
    };

    /* --------------------------------------------------------
       RECOGNITION EVENT: onresult
       --------------------------------------------------------
       Fires when speech has been recognized and converted to text.
       
       event.results is a list of possible interpretations.
       [0][0] gets the first result's first alternative.
       .transcript is the recognized text.
       -------------------------------------------------------- */
    recognition.onresult = function(event) {
      // Get recognized speech, converted to lowercase
      const spoken = event.results[0][0].transcript.toLowerCase();
      // Get the target word, also lowercase for comparison
      const target = wordDisplay.textContent.toLowerCase();
      
      // Clear the "listening" status
      status.textContent = '';
      status.className = 'status';
      
      // Compare spoken word with target word
      if (spoken === target) {
        // Correct pronunciation!
        result.textContent = 'Correct! You said: "' + spoken + '"';
        result.className = 'result correct';
      } else {
        // Pronunciation didn't match
        result.textContent = 'You said: "' + spoken + '" - Expected: "' + target + '"';
        result.className = 'result incorrect';
      }
    };

    /* --------------------------------------------------------
       RECOGNITION EVENT: onerror
       --------------------------------------------------------
       Fires when an error occurs (microphone issue, network, etc.)
       -------------------------------------------------------- */
    recognition.onerror = function() {
      status.textContent = 'Error. Please try again.';
      status.className = 'status';
    };

    /* --------------------------------------------------------
       RECOGNITION EVENT: onend
       --------------------------------------------------------
       Fires when recognition stops (timeout, finished, or error).
       
       If we're still showing "Listening..." it means no speech
       was detected before the recognition timed out.
       -------------------------------------------------------- */
    recognition.onend = function() {
      if (status.textContent === 'Listening... Speak now!') {
        status.textContent = 'Did not hear anything. Try again.';
        status.className = 'status';
      }
    };
  }

  /* ----------------------------------------------------------
     EVENT LISTENER: Hear Word Button (Text-to-Speech)
     ----------------------------------------------------------
     Creates and speaks an utterance of the current word.
     
     SpeechSynthesisUtterance: an object representing what to speak
     .lang: language/accent for pronunciation
     .rate: speed of speech (0.1 to 10, 1 is normal, 0.8 is slightly slower)
     synth.speak(): queues the utterance to be spoken
     ---------------------------------------------------------- */
  hearBtn.addEventListener('click', function() {
    const word = wordDisplay.textContent;  // Get current word
    
    // Create a new utterance (thing to speak)
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'es-ES';  // Spanish pronunciation
    utterance.rate = 0.8;      // Slightly slower for learning
    
    // Speak the word
    synth.speak(utterance);
  });

  /* ----------------------------------------------------------
     EVENT LISTENER: Speak Button (Speech Recognition)
     ----------------------------------------------------------
     Starts listening for user's pronunciation.
     recognition.start() activates the microphone and begins listening.
     ---------------------------------------------------------- */
  speakBtn.addEventListener('click', function() {
    if (recognition) {
      // Clear previous results
      result.textContent = '';
      result.className = 'result';
      // Start listening
      recognition.start();
    } else {
      // Browser doesn't support speech recognition
      status.textContent = 'Speech recognition not supported in this browser.';
    }
  });

  /* ----------------------------------------------------------
     EVENT LISTENER: Next Word Button
     ----------------------------------------------------------
     Advances to the next Spanish word in our list.
     Similar wrap-around logic as the video next button.
     ---------------------------------------------------------- */
  nextWordBtn.addEventListener('click', function() {
    // Move to next word (wrap around using modulo)
    currentWordIndex = (currentWordIndex + 1) % spanishWords.length;
    
    // Update displayed word
    wordDisplay.textContent = spanishWords[currentWordIndex];
    
    // Clear previous results and status
    result.textContent = '';
    result.className = 'result';
    status.textContent = '';
    status.className = 'status';
  });
}

/* ============================================================
   MAIN APP INITIALIZATION (Canvas)
   ============================================================
   This function sets up the canvas drawing area where
   fruits are displayed and users can write Spanish words.
   ============================================================ */
function initApp() {
  /* ----------------------------------------------------------
     DOM ELEMENT SELECTION
     ---------------------------------------------------------- */
  const canvas = document.getElementById('sketch-canvas');
  const nextBtn = document.getElementById('sketch-next');
  const writeBtn = document.getElementById('sketch-write');
  const textInput = document.getElementById('sketch-text');
  
  /* ----------------------------------------------------------
     INITIALIZE CANVAS
     ----------------------------------------------------------
     initCanvas() is our custom function (defined below) that
     returns an object with methods to control the canvas.
     
     This pattern is called the "module pattern" - it groups
     related functionality together and returns a clean interface.
     ---------------------------------------------------------- */
  const app = initCanvas(canvas);

  // Enable buttons (they're enabled by default, but being explicit)
  nextBtn.disabled = false;
  writeBtn.disabled = false;

  /* ----------------------------------------------------------
     EVENT LISTENER: Write Button
     ----------------------------------------------------------
     When clicked, draws the typed text on the canvas.
     .trim() removes extra whitespace from the input value.
     ---------------------------------------------------------- */
  writeBtn.addEventListener('click', () => {
    app.writeText(textInput.value.trim());
  });

  /* ----------------------------------------------------------
     EVENT LISTENER: Next Button
     ----------------------------------------------------------
     Cycles through different fruit images on the canvas.
     Also clears the text input.
     ---------------------------------------------------------- */
  nextBtn.addEventListener('click', () => {
    app.nextImage();
    textInput.value = '';  // Clear input field
  });

  /* ----------------------------------------------------------
     EVENT LISTENER: Window Resize
     ----------------------------------------------------------
     'resize' event fires when browser window size changes.
     We need to recalculate canvas dimensions to stay responsive.
     
     This ensures the canvas looks good on any screen size.
     ---------------------------------------------------------- */
  window.addEventListener('resize', () => app.resize());
}

/* ============================================================
   CANVAS DRAWING MODULE
   ============================================================
   This function encapsulates all canvas drawing functionality.
   It demonstrates the HTML5 Canvas API for 2D graphics.
   
   Parameter: canvas - the <canvas> DOM element
   Returns: an object with methods { resize, writeText, nextImage }
   ============================================================ */
function initCanvas(canvas) {
  /* ----------------------------------------------------------
     ERROR HANDLING
     ----------------------------------------------------------
     throw new Error() stops execution and shows an error message.
     This helps catch bugs early during development.
     ---------------------------------------------------------- */
  if (!canvas) throw new Error('Canvas element not found');

  /* ----------------------------------------------------------
     CANVAS CONTEXT
     ----------------------------------------------------------
     The "context" is what we actually draw on. The canvas element
     is just a container; the context provides drawing methods.
     
     '2d' gets the 2D rendering context (there's also 'webgl' for 3D)
     { alpha: true } enables transparency support
     
     ctx is short for "context" - a common convention
     ---------------------------------------------------------- */
  const ctx = canvas.getContext('2d', { alpha: true });
  
  /* ----------------------------------------------------------
     CANVAS DRAWING SETTINGS
     ----------------------------------------------------------
     These affect how shapes are drawn:
     - lineCap: 'round' makes line ends rounded (not square)
     - lineJoin: 'round' makes corners where lines meet rounded
     ---------------------------------------------------------- */
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  /* ----------------------------------------------------------
     STATE VARIABLES
     ----------------------------------------------------------
     Variables that track the current state of our canvas app.
     ---------------------------------------------------------- */
  
  // Device Pixel Ratio - handles high-DPI screens (Retina displays)
  // Higher DPI screens need more pixels for sharp graphics
  let dpr = window.devicePixelRatio || 1;
  
  // The text to display on the canvas (user's typed word)
  let hintText = '';
  
  // Which fruit image is currently shown (0=apple, 1=banana, 2=orange)
  let currentImage = 0; 
  
  /* ----------------------------------------------------------
     FUNCTION: resize
     ----------------------------------------------------------
     Adjusts canvas size to match its container and handles
     high-DPI displays for crisp graphics.
     
     This is called initially and whenever window resizes.
     ---------------------------------------------------------- */
  function resize() {
    // Get the CSS display size of the canvas
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    
    // Update DPI value (might change if moving between monitors)
    dpr = window.devicePixelRatio || 1;
    
    /* --------------------------------------------------------
       Canvas has TWO sizes:
       1. Drawing buffer (canvas.width/height) - actual pixels
       2. Display size (style.width/height) - how big it appears
       
       For sharp graphics on high-DPI screens, we make the
       drawing buffer larger than the display size, then scale it down.
       
       Math.round() ensures whole pixel values (no blurriness)
       -------------------------------------------------------- */
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    /* --------------------------------------------------------
       setTransform resets and applies a transformation matrix.
       Here we scale the context by dpr so our drawing code can
       use "logical" pixels, and the scaling handles DPI.
       
       Parameters: (scaleX, skewX, skewY, scaleY, translateX, translateY)
       -------------------------------------------------------- */
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Redraw everything after resize
    redraw();
  }

  /* ----------------------------------------------------------
     FUNCTION: redraw
     ----------------------------------------------------------
     Clears the canvas and redraws all content.
     Called after any change (resize, next image, write text).
     ---------------------------------------------------------- */
  function redraw() {
    // Clear entire canvas (erase everything)
    // Division by dpr converts back to logical pixels
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    // Draw the background gradient and current fruit
    drawBackground();

    // Draw user's text if any
    if (hintText) drawHintText(hintText);
  }

  /* ----------------------------------------------------------
     FUNCTION: drawBackground
     ----------------------------------------------------------
     Draws the canvas background (gradient) and current fruit image.
     ---------------------------------------------------------- */
  function drawBackground() {
    const w = canvas.clientWidth;   // Width in logical pixels
    const h = canvas.clientHeight;  // Height in logical pixels
    const radius = 12;              // Corner radius for rounded rectangle
    
    /* --------------------------------------------------------
       ctx.save() and ctx.restore()
       These save/restore the current drawing state (colors,
       transforms, etc.) so we can make temporary changes
       without affecting other drawing operations.
       -------------------------------------------------------- */
    ctx.save();
    
    /* --------------------------------------------------------
       CREATE A GRADIENT
       Linear gradients transition between colors in a line.
       Parameters: (startX, startY, endX, endY)
       Here: vertical gradient from top (0,0) to bottom (0,h)
       -------------------------------------------------------- */
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#ffd');     // Light yellow at top (position 0)
    g.addColorStop(1, '#fff6cc');  // Slightly darker at bottom (position 1)
    
    // fillStyle sets the color/gradient used for filled shapes
    ctx.fillStyle = g;
    
    // Draw rounded rectangle background
    roundRect(ctx, 0, 0, w, h, radius);
    ctx.fill();  // Fill the shape with current fillStyle

    /* --------------------------------------------------------
       Draw current fruit based on currentImage index
       if/else if/else chain selects which fruit to draw
       -------------------------------------------------------- */
    if (currentImage === 0) drawApple(w, h);
    else if (currentImage === 1) drawBanana(w, h);
    else drawOrange(w, h);
    
    ctx.restore();  // Restore previous drawing state
  }

  /* ----------------------------------------------------------
     FUNCTION: drawApple
     ----------------------------------------------------------
     Draws an apple using Canvas 2D drawing primitives.
     
     Parameters:
     - w: canvas width
     - h: canvas height
     
     These are used to position and scale the apple relative
     to the canvas size (making it responsive).
     ---------------------------------------------------------- */
  function drawApple(w, h) {
    // Calculate center position (35% from left, 45% from top)
    const cx = w * 0.35;
    const cy = h * 0.45;
    
    // Calculate radius based on canvas size (18% of smaller dimension)
    // Math.min ensures it fits in both dimensions
    const r = Math.min(w, h) * 0.18;
    
    /* --------------------------------------------------------
       DRAWING THE APPLE BODY (Circle)
       -------------------------------------------------------- */
    ctx.beginPath();            // Start a new shape path
    ctx.fillStyle = '#ff6b6b';  // Red color
    // arc draws a circle/arc: (centerX, centerY, radius, startAngle, endAngle)
    // Math.PI * 2 = 360 degrees = full circle
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();  // Fill the circle
    
    /* --------------------------------------------------------
       DRAWING THE LEAF (Ellipse)
       -------------------------------------------------------- */
    ctx.beginPath();
    ctx.fillStyle = '#58d68d';  // Green color
    // ellipse: (x, y, radiusX, radiusY, rotation, startAngle, endAngle)
    // Creates an oval shape tilted at -0.6 radians
    ctx.ellipse(cx + r * 0.55, cy - r * 0.75, r * 0.32, r * 0.18, -0.6, 0, Math.PI * 2);
    ctx.fill();
    
    /* --------------------------------------------------------
       DRAWING THE STEM (Line)
       -------------------------------------------------------- */
    ctx.beginPath();
    ctx.strokeStyle = '#6b4c2b';  // Brown color
    ctx.lineWidth = 4;             // 4 pixel thick line
    // moveTo: move pen to starting position (doesn't draw)
    ctx.moveTo(cx, cy - r * 0.8);
    // lineTo: draw line from current position to specified point
    ctx.lineTo(cx + r * 0.1, cy - r * 1.45);
    ctx.stroke();  // Actually draw the line (stroke = outline, not fill)
  }

  /* ----------------------------------------------------------
     FUNCTION: drawBanana
     ----------------------------------------------------------
     Draws a banana using curves and gradients.
     Demonstrates:
     - Transformations (translate, rotate)
     - Quadratic curves (Bézier curves)
     - Gradients on complex shapes
     ---------------------------------------------------------- */
  function drawBanana(w, h) {
    // Position and size calculations
    const cx = w * 0.45;
    const cy = h * 0.5;
    const r = Math.min(w, h) * 0.22;
    
    /* --------------------------------------------------------
       TRANSFORMATIONS
       save() saves current state before transforming.
       translate() moves the origin point (like moving a piece of paper)
       rotate() rotates all subsequent drawing around the origin
       
       This makes it easier to draw the banana at an angle.
       -------------------------------------------------------- */
    ctx.save();
    ctx.translate(cx, cy);  // Move origin to center of banana
    ctx.rotate(-0.3);       // Rotate 0.3 radians counterclockwise
    
    // Banana dimensions
    const L = r * 2.1;  // Length
    const H = r * 0.8;  // Height/curve
    
    /* --------------------------------------------------------
       DRAWING THE BANANA SHAPE (Quadratic Curves)
       
       quadraticCurveTo(cpX, cpY, endX, endY)
       Creates a curve from current point to end point,
       with the control point (cp) determining the curve shape.
       
       Like pulling a string tight - the control point is where
       you're pulling from to create the curve.
       -------------------------------------------------------- */
    ctx.beginPath();
    ctx.moveTo(-L * 0.5, -H * 0.35);  // Start point
    // Top curve of banana
    ctx.quadraticCurveTo(-L * 0.15, -H * 1.0, L * 0.45, -H * 0.3);
    // Bottom curve of banana
    ctx.quadraticCurveTo(L * 0.2, H * 0.95, -L * 0.55, H * 0.4);
    ctx.closePath();  // Close the shape (connect back to start)
    
    // Create horizontal gradient for banana color variation
    const grad = ctx.createLinearGradient(-L * 0.5, 0, L * 0.5, 0);
    grad.addColorStop(0, '#ffd23f');
    grad.addColorStop(0.6, '#ffcf4d');
    grad.addColorStop(1, '#ffd23f');
    ctx.fillStyle = grad;
    ctx.fill();

    /* --------------------------------------------------------
       HIGHLIGHT LINE (gives 3D appearance)
       Using semi-transparent white for subtle effect
       -------------------------------------------------------- */
    ctx.beginPath();
    ctx.moveTo(-L * 0.25, -H * 0.15);
    ctx.quadraticCurveTo(0, -H * 0.55, L * 0.28, -H * 0.11);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';  // RGBA: red, green, blue, alpha (opacity)
    ctx.lineWidth = 3;
    ctx.stroke();

    /* --------------------------------------------------------
       BANANA TIP (small brown rectangle)
       -------------------------------------------------------- */
    ctx.beginPath();
    ctx.fillStyle = '#6b4c2b';  // Brown
    roundRect(ctx, L * 0.35, -H * 0.42, L * 0.08, H * 0.16, 3);
    ctx.fill();

    ctx.restore();  // Restore original state (undo translate/rotate)
  }

  /* ----------------------------------------------------------
     FUNCTION: drawOrange
     ----------------------------------------------------------
     Draws an orange using radial gradients and detail lines.
     ---------------------------------------------------------- */
  function drawOrange(w, h) {
    const cx = w * 0.32;
    const cy = h * 0.5;
    const r = Math.min(w, h) * 0.17;
    
    ctx.save();
    
    /* --------------------------------------------------------
       RADIAL GRADIENT
       Creates a gradient that radiates from a center point outward.
       
       Parameters: (centerX1, centerY1, radius1, centerX2, centerY2, radius2)
       The two circles define where the gradient starts and ends.
       
       Here: lighter in center, darker at edges for 3D sphere effect
       -------------------------------------------------------- */
    const rg = ctx.createRadialGradient(
      cx - r * 0.2, cy - r * 0.2, r * 0.05,  // Inner circle (highlight offset)
      cx, cy, r                               // Outer circle (full orange)
    );
    rg.addColorStop(0, '#ffd07a');    // Light orange (center/highlight)
    rg.addColorStop(0.6, '#ff9f1c');  // Medium orange
    rg.addColorStop(1, '#f68b1f');    // Darker orange (edge)
    
    // Draw main orange circle
    ctx.beginPath();
    ctx.fillStyle = rg;
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    /* --------------------------------------------------------
       NAVEL (small circle in center)
       -------------------------------------------------------- */
    ctx.beginPath();
    ctx.fillStyle = '#f2a43d';
    ctx.arc(cx + r * 0.08, cy - r * 0.05, r * 0.07, 0, Math.PI * 2);
    ctx.fill();

    /* --------------------------------------------------------
       TEXTURE LINES
       Drawing subtle lines radiating from center for texture.
       Uses a for loop to draw 10 lines at equal angles.
       -------------------------------------------------------- */
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';  // Very subtle white
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 10; i++) {
      // Calculate angle for this line (dividing circle into 10 parts)
      const a = i / 10 * Math.PI * 2;
      
      // Calculate start and end points using trigonometry
      // cos gives X component, sin gives Y component of a direction
      const x1 = cx + Math.cos(a) * r * 0.1;  // Inner point
      const y1 = cy + Math.sin(a) * r * 0.1;
      const x2 = cx + Math.cos(a) * r * 0.9;  // Outer point
      const y2 = cy + Math.sin(a) * r * 0.9;
      
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.stroke();

    /* --------------------------------------------------------
       LEAF
       Drawing a curved leaf shape using quadratic curves.
       Using nested save/restore for leaf-specific transformations.
       -------------------------------------------------------- */
    ctx.beginPath();
    ctx.save();
    ctx.translate(cx + r * 0.62, cy - r * 0.68);  // Position leaf
    ctx.rotate(-0.6);  // Angle leaf
    ctx.fillStyle = '#5ec26b';  // Green
    ctx.moveTo(0, 0);
    // Leaf shape using two curves
    ctx.quadraticCurveTo(r * 0.2, -r * 0.45, r * 0.7, -r * 0.5);
    ctx.quadraticCurveTo(r * -0.15, -r * 0.18, 0, 0);
    ctx.fill();
    ctx.restore();
    
    ctx.restore();
  }

  /* ----------------------------------------------------------
     HELPER FUNCTION: roundRect
     ----------------------------------------------------------
     Draws a rectangle with rounded corners.
     This isn't built into older browsers, so we create it ourselves.
     
     Uses quadraticCurveTo to create smooth corners.
     ---------------------------------------------------------- */
  function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    // Start at top-left corner (offset by radius)
    ctx.moveTo(x + radius, y);
    // Top edge
    ctx.lineTo(x + width - radius, y);
    // Top-right corner (curve)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    // Right edge
    ctx.lineTo(x + width, y + height - radius);
    // Bottom-right corner
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    // Bottom edge
    ctx.lineTo(x + radius, y + height);
    // Bottom-left corner
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    // Left edge
    ctx.lineTo(x, y + radius);
    // Top-left corner
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  /* ----------------------------------------------------------
     FUNCTION: nextImage
     ----------------------------------------------------------
     Cycles to the next fruit image.
     Modulo (%) wraps 2+1=3 back to 0 (we only have indices 0,1,2)
     ---------------------------------------------------------- */
  function nextImage() {
    currentImage = (currentImage + 1) % 3;
    hintText = '';  // Clear any text
    redraw();       // Redraw with new image
  }
  
  /* ----------------------------------------------------------
     FUNCTION: writeText
     ----------------------------------------------------------
     Sets the text to display on the canvas and redraws.
     ---------------------------------------------------------- */
  function writeText(word) {
    hintText = word || '';  // Use word, or empty string if null/undefined
    redraw();
  }

  /* ----------------------------------------------------------
     FUNCTION: drawHintText
     ----------------------------------------------------------
     Draws the user's typed text on the canvas.
     ---------------------------------------------------------- */
  function drawHintText(text) {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    
    ctx.save();
    ctx.fillStyle = '#222';  // Dark text color
    
    /* --------------------------------------------------------
       FONT SIZING
       Calculate font size based on canvas dimensions.
       Math.max ensures minimum 28px size.
       Math.floor rounds down to whole number.
       -------------------------------------------------------- */
    const base = Math.max(28, Math.floor(Math.min(w, h) / 6));
    
    /* --------------------------------------------------------
       FONT PROPERTY
       Sets the font in CSS format: "weight size family"
       Example: "bold 48px system-ui, Arial"
       -------------------------------------------------------- */
    ctx.font = `bold ${base}px system-ui, Arial`;
    
    /* --------------------------------------------------------
       TEXT ALIGNMENT
       textAlign: horizontal alignment ('left', 'center', 'right')
       textBaseline: vertical alignment ('top', 'middle', 'bottom')
       -------------------------------------------------------- */
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    /* --------------------------------------------------------
       DRAW TEXT
       fillText(text, x, y) draws filled text at specified position.
       Position is 70% across and 55% down the canvas.
       -------------------------------------------------------- */
    ctx.fillText(text, w * 0.7, h * 0.55);
    
    ctx.restore();
  }

  /* ----------------------------------------------------------
     INITIAL SETUP
     ----------------------------------------------------------
     Call resize() once to set up the canvas properly.
     ---------------------------------------------------------- */
  resize();

  /* ----------------------------------------------------------
     RETURN PUBLIC INTERFACE
     ----------------------------------------------------------
     Return an object containing functions that can be called
     from outside this initCanvas function.
     
     This is the "revealing module pattern" - internal functions
     and variables are private; only returned items are public.
     ---------------------------------------------------------- */
  return { resize, writeText, nextImage };
}
