/**
 * LunaRay — Pure Cinematic Scroll Animation Engine
 * 
 * Crisp 60 FPS HTML5 Canvas scroller with sub-pixel lerp smoothing,
 * DPR-aware integer pixel scaling, aspect ratio preservation,
 * and procedural Web Audio ambience.
 */

(function () {
  'use strict';

  // --- Configuration ---
  const TOTAL_FRAMES = 180;
  const LERP_FACTOR = 0.15;
  const NATIVE_WIDTH = 2560;
  const NATIVE_HEIGHT = 1440;
  const NATIVE_ASPECT = NATIVE_WIDTH / NATIVE_HEIGHT; // 16:9

  // --- State ---
  const state = {
    currentFrame: 0,
    targetFrame: 0,
    lastRenderedIndex: -1,
    images: new Array(TOTAL_FRAMES),
    isLoaded: false,
    fitMode: 'cover', // 'cover' or 'contain'
    isPlaying: false,
    playSpeed: 1.0,
    isAudioOn: false,
    lastPlayTimestamp: null
  };

  // --- DOM Elements ---
  const DOM = {
    body: document.body,
    preloader: document.getElementById('preloader'),
    progressBar: document.getElementById('progressBar'),
    loadPercent: document.getElementById('loadPercent'),
    loadCount: document.getElementById('loadCount'),
    canvas: document.getElementById('frameCanvas'),
    ctx: document.getElementById('frameCanvas').getContext('2d'),
    heroTextOverlay: document.getElementById('heroTextOverlay'),
    scrollTrack: document.getElementById('scrollTrack'),
    scrollPrompt: document.getElementById('scrollPrompt'),
    fitToggle: document.getElementById('fitToggle'),
    fitLabel: document.getElementById('fitLabel'),
    audioToggle: document.getElementById('audioToggle'),
    fullscreenToggle: document.getElementById('fullscreenToggle')
  };

  // =========================================================================
  // 1. Frame Preloading Engine
  // =========================================================================
  function getFrameUrl(index) {
    const padded = String(index + 1).padStart(3, '0');
    return `videos/frames/ezgif-frame-${padded}.jpg?v=clean`;
  }

  function preloadFrames() {
    let loaded = 0;

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      const frameIndex = i;

      img.onload = () => {
        loaded++;
        state.images[frameIndex] = img;
        updateLoadingProgress(loaded);

        if (loaded === 1 && state.lastRenderedIndex === -1) {
          drawFrame(frameIndex);
        }

        if (loaded === TOTAL_FRAMES) {
          state.isLoaded = true;
          onPreloadComplete();
        }
      };

      img.onerror = () => {
        loaded++;
        state.images[frameIndex] = img;
        updateLoadingProgress(loaded);
        if (loaded === TOTAL_FRAMES) {
          state.isLoaded = true;
          onPreloadComplete();
        }
      };

      img.src = getFrameUrl(i);
    }
  }

  function updateLoadingProgress(count) {
    const percent = Math.min(Math.round((count / TOTAL_FRAMES) * 100), 100);
    if (DOM.progressBar) DOM.progressBar.style.width = `${percent}%`;
    if (DOM.loadPercent) DOM.loadPercent.textContent = `${percent}%`;
    if (DOM.loadCount) DOM.loadCount.textContent = `${count} / ${TOTAL_FRAMES}`;
  }

  function onPreloadComplete() {
    setTimeout(() => {
      if (DOM.preloader) DOM.preloader.classList.add('hidden');
      DOM.body.classList.remove('is-loading');
      handleResize();
      drawFrame(0);
    }, 300);
  }

  // =========================================================================
  // 2. High-Fidelity Canvas Rendering Engine
  // =========================================================================
  let viewportWidth = 0;
  let viewportHeight = 0;
  let dpr = 1;

  function handleResize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    viewportWidth = window.innerWidth;
    viewportHeight = window.innerHeight;

    // Set internal canvas buffer to match physical device pixels exactly
    DOM.canvas.width = Math.round(viewportWidth * dpr);
    DOM.canvas.height = Math.round(viewportHeight * dpr);

    // CSS display size matches layout viewport
    DOM.canvas.style.width = `${viewportWidth}px`;
    DOM.canvas.style.height = `${viewportHeight}px`;

    // Reset transform matrix to 1:1 and enable high quality image smoothing
    DOM.ctx.setTransform(1, 0, 0, 1, 0, 0);
    DOM.ctx.imageSmoothingEnabled = true;
    DOM.ctx.imageSmoothingQuality = 'high';

    // Force redraw current frame with updated dimensions
    state.lastRenderedIndex = -1;
    drawFrame(Math.round(state.currentFrame));
  }

  function drawFrame(frameIndex) {
    const clampedIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, frameIndex));
    const img = state.images[clampedIndex];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const canvasAspect = viewportWidth / viewportHeight;
    let destWidth, destHeight, destX, destY;

    if (state.fitMode === 'cover') {
      // Fill screen proportionally, cropping evenly if aspect ratios differ
      if (canvasAspect > NATIVE_ASPECT) {
        destWidth = viewportWidth;
        destHeight = viewportWidth / NATIVE_ASPECT;
        destX = 0;
        destY = (viewportHeight - destHeight) / 2;
      } else {
        destHeight = viewportHeight;
        destWidth = viewportHeight * NATIVE_ASPECT;
        destX = (viewportWidth - destWidth) / 2;
        destY = 0;
      }
    } else {
      // 'contain': Fit entire 16:9 frame within screen without any cropping
      if (canvasAspect > NATIVE_ASPECT) {
        destHeight = viewportHeight;
        destWidth = viewportHeight * NATIVE_ASPECT;
        destX = (viewportWidth - destWidth) / 2;
        destY = 0;
      } else {
        destWidth = viewportWidth;
        destHeight = viewportWidth / NATIVE_ASPECT;
        destX = 0;
        destY = (viewportHeight - destHeight) / 2;
      }
    }

    // Explicitly set smoothing quality on context before each draw call
    DOM.ctx.imageSmoothingEnabled = true;
    DOM.ctx.imageSmoothingQuality = 'high';

    // Clear physical buffer
    DOM.ctx.clearRect(0, 0, DOM.canvas.width, DOM.canvas.height);

    // Draw using exact integer physical buffer coordinates (dpr multiplied & rounded)
    // to prevent any sub-pixel bilinear anti-aliasing blur
    DOM.ctx.drawImage(
      img,
      0, 0, img.naturalWidth, img.naturalHeight, // Source full frame
      Math.round(destX * dpr),
      Math.round(destY * dpr),
      Math.round(destWidth * dpr),
      Math.round(destHeight * dpr)
    );

    state.lastRenderedIndex = clampedIndex;
  }

  // =========================================================================
  // 3. Scroll Tracking & Lerp Physics
  // =========================================================================
  function getScrollProgress() {
    const maxScroll = DOM.scrollTrack ? DOM.scrollTrack.offsetHeight : 0;
    if (maxScroll <= 0) return 0;
    return Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
  }

  function onScroll() {
    if (DOM.scrollPrompt) {
      if (window.scrollY > 30) {
        DOM.scrollPrompt.classList.add('fade');
      } else {
        DOM.scrollPrompt.classList.remove('fade');
      }
    }

    // Toggle Back to Top button
    const btt = document.getElementById('back-to-top-btn');
    if (btt) {
      if (window.scrollY > window.innerHeight) {
        btt.classList.add('visible');
      } else {
        btt.classList.remove('visible');
      }
    }

    if (!state.isPlaying) {
      const progress = getScrollProgress();
      state.targetFrame = progress * (TOTAL_FRAMES - 1);
    }
  }

  function scrollToProgress(ratio) {
    const maxScroll = DOM.scrollTrack ? DOM.scrollTrack.offsetHeight : 0;
    window.scrollTo({ top: ratio * maxScroll, behavior: 'smooth' });
  }

  // 60 FPS animation loop with lerp physics
  function animationTick(timestamp) {
    if (state.isPlaying) {
      if (state.lastPlayTimestamp === null) state.lastPlayTimestamp = timestamp;
      const dt = (timestamp - state.lastPlayTimestamp) / 1000;
      state.lastPlayTimestamp = timestamp;

      const frameStep = dt * (24 * state.playSpeed);
      state.targetFrame += frameStep;

      if (state.targetFrame >= TOTAL_FRAMES - 1) {
        state.targetFrame = 0;
        state.currentFrame = 0;
      }

      const progress = state.targetFrame / (TOTAL_FRAMES - 1);
      const maxScroll = DOM.scrollTrack ? DOM.scrollTrack.offsetHeight : 0;
      window.scrollTo(0, progress * maxScroll);
    } else {
      state.lastPlayTimestamp = null;
    }

    // Lerp smoothing
    const diff = state.targetFrame - state.currentFrame;
    if (Math.abs(diff) > 0.001) {
      state.currentFrame += diff * LERP_FACTOR;
    } else {
      state.currentFrame = state.targetFrame;
    }

    const roundedFrame = Math.round(state.currentFrame);
    if (roundedFrame !== state.lastRenderedIndex) {
      drawFrame(roundedFrame);
    }

    // Smoothly fade hero heading overlay by 30% scroll
    const frameProgress = state.currentFrame / (TOTAL_FRAMES - 1);
    updateHeroTextOverlay(frameProgress);

    requestAnimationFrame(animationTick);
  }

  function updateHeroTextOverlay(progress) {
    if (!DOM.heroTextOverlay) return;
    if (progress <= 0.30) {
      const ratio = progress / 0.30; // 0 to 1
      const opacity = Math.max(0, 1 - ratio);
      const translateY = -ratio * 35; // subtle upward drift
      DOM.heroTextOverlay.style.opacity = opacity.toFixed(3);
      DOM.heroTextOverlay.style.transform = `translate(-50%, calc(-50% + ${translateY.toFixed(1)}px))`;
      DOM.heroTextOverlay.style.visibility = opacity <= 0.005 ? 'hidden' : 'visible';
    } else {
      DOM.heroTextOverlay.style.opacity = '0';
      DOM.heroTextOverlay.style.transform = 'translate(-50%, calc(-50% - 35px))';
      DOM.heroTextOverlay.style.visibility = 'hidden';
    }
  }

  function togglePlayback() {
    state.isPlaying = !state.isPlaying;
    if (DOM.scrollPrompt) DOM.scrollPrompt.classList.add('fade');
  }

  function stepFrame(step) {
    state.isPlaying = false;
    state.targetFrame = Math.max(0, Math.min(TOTAL_FRAMES - 1, state.targetFrame + step));
    state.currentFrame = state.targetFrame;
    const progress = state.targetFrame / (TOTAL_FRAMES - 1);
    const maxScroll = DOM.scrollTrack ? DOM.scrollTrack.offsetHeight : 0;
    window.scrollTo({ top: progress * maxScroll, behavior: 'auto' });
  }

  // =========================================================================
  // 4. Procedural Web Audio Ambience
  // =========================================================================
  let audioCtx = null;
  let synthGain = null;
  let synthInterval = null;

  function initAudio() {
    if (audioCtx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();

    // Gentle pink-noise rain simulation
    const bufferSize = audioCtx.sampleRate * 2;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      output[i] = (b0 + b1 + b2) * 0.12;
    }

    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const rainFilter = audioCtx.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.setValueAtTime(700, audioCtx.currentTime);

    const rainGain = audioCtx.createGain();
    rainGain.gain.setValueAtTime(0.3, audioCtx.currentTime);

    whiteNoise.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainGain.connect(audioCtx.destination);
    whiteNoise.start();

    // Soft warm chords pad
    synthGain = audioCtx.createGain();
    synthGain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    synthGain.connect(audioCtx.destination);

    const chords = [
      [146.83, 174.61, 220.00, 261.63, 329.63], // Dmin9
      [130.81, 164.81, 196.00, 246.94, 293.66], // Cmaj9
      [110.00, 146.83, 174.61, 220.00, 261.63], // Amin7
      [174.61, 220.00, 261.63, 329.63, 392.00]  // Fmaj9
    ];

    let chordIdx = 0;
    function playChord() {
      if (!state.isAudioOn || !audioCtx) return;
      const notes = chords[chordIdx];
      chordIdx = (chordIdx + 1) % chords.length;

      const duration = 4.2;
      const now = audioCtx.currentTime;

      notes.forEach((freq) => {
        const osc = audioCtx.createOscillator();
        const noteGain = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(420, now);

        noteGain.gain.setValueAtTime(0.001, now);
        noteGain.gain.exponentialRampToValueAtTime(0.06, now + 1.2);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(synthGain);

        osc.start(now);
        osc.stop(now + duration + 0.1);
      });
    }

    playChord();
    synthInterval = setInterval(playChord, 4500);
  }

  function toggleAudio() {
    if (!state.isAudioOn) {
      if (!audioCtx) {
        initAudio();
      } else if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      state.isAudioOn = true;
      if (DOM.audioToggle) DOM.audioToggle.classList.add('active');
    } else {
      if (audioCtx && audioCtx.state === 'running') {
        audioCtx.suspend();
      }
      state.isAudioOn = false;
      if (DOM.audioToggle) DOM.audioToggle.classList.remove('active');
    }
  }

  // =========================================================================
  // 5. Event Listeners
  // =========================================================================
  function bindEvents() {
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', onScroll, { passive: true });

    // Fit Toggle (Cover vs Contain)
    if (DOM.fitToggle) {
      DOM.fitToggle.addEventListener('click', () => {
        state.fitMode = state.fitMode === 'cover' ? 'contain' : 'cover';
        if (DOM.fitLabel) DOM.fitLabel.textContent = state.fitMode === 'cover' ? 'Cover' : 'Contain';
        state.lastRenderedIndex = -1;
        drawFrame(Math.round(state.currentFrame));
      });
    }

    // Audio Ambience Toggle
    if (DOM.audioToggle) {
      DOM.audioToggle.addEventListener('click', toggleAudio);
    }

    // Fullscreen Toggle
    if (DOM.fullscreenToggle) {
      DOM.fullscreenToggle.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }

    // Keyboard Shortcuts (disabled inside form inputs and editable fields)
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'BUTTON' ||
          target.isContentEditable)
      ) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayback();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          stepFrame(e.shiftKey ? -10 : -1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          stepFrame(e.shiftKey ? 10 : 1);
          break;
        case 'Home':
          e.preventDefault();
          state.isPlaying = false;
          scrollToProgress(0);
          break;
        case 'End':
          e.preventDefault();
          state.isPlaying = false;
          scrollToProgress(1);
          break;
      }
    });
  }

  // =========================================================================
  // 6. Initialization
  // =========================================================================
  function init() {
    bindEvents();
    handleResize();
    requestAnimationFrame(animationTick);
    preloadFrames();
  }

  init();

})();
