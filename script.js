/* =============================================
   CINE — Custom Video Player
   script.js
   ============================================= */

'use strict';

/* ── Playlist Data ─────────────────────────────── */
/*
 * Each video has a `sources` array (tried in order on error).
 * Primary = storage.googleapis.com (direct GCS, reliable globally).
 * Fallback = commondatastorage mirror + w3.org hosted demos.
 */
const PLAYLIST = [
  {
    id: 'v1',
    title: 'Big Buck Bunny',
    desc: 'Blender Foundation · 9 min',
    sources: [
      'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      'https://media.w3.org/2010/05/bunny/trailer.mp4',
    ],
    thumb: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
    subtitleSrc: null,
    moments: [
      { label: 'Opening',     time: 0   },
      { label: 'First Scene', time: 60  },
      { label: 'Chase',       time: 180 },
      { label: 'Finale',      time: 480 },
    ],
  },
  {
    id: 'v2',
    title: "Elephant's Dream",
    desc: 'Blender Foundation · 11 min',
    sources: [
      'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      'https://media.w3.org/2010/05/sintel/trailer.mp4',
    ],
    thumb: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg',
    subtitleSrc: null,
    moments: [
      { label: 'Opening', time: 0   },
      { label: 'Emo',     time: 90  },
      { label: 'Machine', time: 250 },
      { label: 'End',     time: 570 },
    ],
  },
  {
    id: 'v3',
    title: 'For Bigger Blazes',
    desc: 'Google Sample · 15 sec',
    sources: [
      'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    ],
    thumb: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg',
    subtitleSrc: null,
    moments: [
      { label: 'Start',  time: 0 },
      { label: 'Action', time: 5 },
    ],
  },
  {
    id: 'v4',
    title: 'Subaru Outback',
    desc: 'Google Sample · 30 sec',
    sources: [
      'https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
      'https://media.w3.org/2010/05/video/movie_300.mp4',
    ],
    thumb: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/SubaruOutbackOnStreetAndDirt.jpg',
    subtitleSrc: null,
    moments: [
      { label: 'Start', time: 0  },
      { label: 'Road',  time: 12 },
    ],
  },
  {
    id: 'v5',
    title: 'Oceans (VideoJS Demo)',
    desc: 'VideoJS · 46 sec',
    sources: [
      'https://vjs.zencdn.net/v/oceans.mp4',
      'https://media.w3.org/2010/05/sintel/trailer.mp4',
    ],
    thumb: 'https://vjs.zencdn.net/v/oceans.png',
    subtitleSrc: null,
    moments: [
      { label: 'Start',   time: 0  },
      { label: 'Surface', time: 15 },
      { label: 'Deep',    time: 30 },
    ],
  },
];

/* ── DOM References ────────────────────────────── */
const video          = document.getElementById('mainVideo');
const playerWrap     = document.getElementById('playerWrap');
const subtitleTrack  = document.getElementById('subtitleTrack');

// Controls
const playPauseBtn   = document.getElementById('playPauseBtn');
const playIcon       = document.getElementById('playIcon');
const rewindBtn      = document.getElementById('rewindBtn');
const forwardBtn     = document.getElementById('forwardBtn');
const restartBtn     = document.getElementById('restartBtn');
const muteBtn        = document.getElementById('muteBtn');
const volIcon        = document.getElementById('volIcon');
const volumeSlider   = document.getElementById('volumeSlider');
const fullscreenBtn  = document.getElementById('fullscreenBtn');
const fullscreenIcon = document.getElementById('fullscreenIcon');
const pipBtn         = document.getElementById('pipBtn');
const skipIntroBtn   = document.getElementById('skipIntroBtn');
const subtitleBtn    = document.getElementById('subtitleBtn');
const speedBtn       = document.getElementById('speedBtn');
const speedDisplay   = document.getElementById('speedDisplay');
const speedMenu      = document.getElementById('speedMenu');
const speedOpts      = document.querySelectorAll('.speed-opt');

// Progress
const progressTrack  = document.getElementById('progressTrack');
const progressFill   = document.getElementById('progressFill');
const progressBuffer = document.getElementById('progressBuffer');
const progressThumb  = document.getElementById('progressThumb');
const progressArea   = progressTrack.closest('.progress-area');

// Time
const currentTimeEl  = document.getElementById('currentTime');
const totalDurEl     = document.getElementById('totalDuration');

// Overlays
const playFlash      = document.getElementById('playFlash');
const playFlashIcon  = document.getElementById('playFlashIcon');
const bufferSpinner  = document.getElementById('bufferSpinner');
const seekTooltip    = document.getElementById('seekTooltip');
const tooltipTime    = document.getElementById('tooltipTime');
const tooltipThumb   = document.getElementById('tooltipThumb');
const videoTitleText = document.getElementById('videoTitleText');

// Sidebar / playlist
const playlistEl     = document.getElementById('playlist');
const keyMomentsList = document.getElementById('keyMomentsList');
const subtitleToggle = document.getElementById('subtitleToggle');

// Theme
const themeToggle    = document.getElementById('themeToggle');

/* ── State ─────────────────────────────────────── */
let currentIdx       = 0;
let hideControlsTimer = null;
let isFullscreen     = false;
let isDraggingSeek   = false;
let subtitlesEnabled = false;
let toastTimer       = null;

/* ══════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════ */
function init() {
  buildPlaylist();
  loadVideo(0);
  setupEventListeners();
  showControls();
}

/* ══════════════════════════════════════════════
   PLAYLIST BUILDER
   ══════════════════════════════════════════════ */
function buildPlaylist() {
  playlistEl.innerHTML = '';
  PLAYLIST.forEach((item, idx) => {
    const savedTime = getSavedTime(item.id);
    const li = document.createElement('li');
    li.className = 'playlist-item' + (idx === 0 ? ' active' : '');
    li.dataset.idx = idx;
    li.innerHTML = `
      <div class="playlist-thumb">
        <img src="${item.thumb}" alt="${item.title}" loading="lazy" />
      </div>
      <div class="playlist-info">
        <div class="playlist-title">
          ${item.title}
          ${savedTime > 3 ? '<span class="resume-badge">Resume</span>' : ''}
        </div>
        <div class="playlist-meta">${item.desc}</div>
      </div>
      <div class="playlist-active-dot"></div>
    `;
    li.addEventListener('click', () => loadVideo(idx));
    playlistEl.appendChild(li);
  });
}

/* ══════════════════════════════════════════════
   LOAD VIDEO
   ══════════════════════════════════════════════ */
function loadVideo(idx) {
  currentIdx = idx;
  const item = PLAYLIST[idx];

  // Try each source URL in order; fall back on error
  let sourceIdx = 0;
  function trySource() {
    if (sourceIdx >= item.sources.length) {
      showToast('<i class="fa-solid fa-triangle-exclamation"></i> Could not load video');
      return;
    }
    video.onerror = () => {
      sourceIdx++;
      showToast('<i class="fa-solid fa-rotate-right"></i> Trying fallback source…');
      trySource();
    };
    video.src = item.sources[sourceIdx];
    video.load();
  }
  trySource();

  videoTitleText.textContent = item.title;

  // Subtitles
  if (item.subtitleSrc) {
    subtitleTrack.src = item.subtitleSrc;
    subtitleBtn.style.display = '';
    subtitleToggle.parentElement.parentElement.style.display = '';
  } else {
    subtitleTrack.removeAttribute('src');
    subtitleBtn.style.display = 'none';
  }

  // Key moments
  buildKeyMoments(item.moments);

  // Update playlist UI
  document.querySelectorAll('.playlist-item').forEach((li, i) => {
    li.classList.toggle('active', i === idx);
  });

  // Resume from saved position
  video.addEventListener('loadedmetadata', function onMeta() {
    video.removeEventListener('loadedmetadata', onMeta);
    const savedTime = getSavedTime(item.id);
    if (savedTime > 3 && savedTime < video.duration - 3) {
      video.currentTime = savedTime;
      showToast(`<i class="fa-solid fa-rotate-right"></i> Resuming from ${formatTime(savedTime)}`);
    }
    video.play().catch(() => {});
  });

  // Reset UI
  progressFill.style.width = '0%';
  progressThumb.style.left = '0%';
  currentTimeEl.textContent = '0:00';
  totalDurEl.textContent = '0:00';

  updateSubtitleState();
  rebuildPlaylistResumeBadges();
}

function rebuildPlaylistResumeBadges() {
  document.querySelectorAll('.playlist-item').forEach((li, i) => {
    const savedTime = getSavedTime(PLAYLIST[i].id);
    const titleEl = li.querySelector('.playlist-title');
    const existingBadge = titleEl.querySelector('.resume-badge');
    if (existingBadge) existingBadge.remove();
    if (savedTime > 3) {
      const badge = document.createElement('span');
      badge.className = 'resume-badge';
      badge.textContent = 'Resume';
      titleEl.appendChild(badge);
    }
  });
}

/* ══════════════════════════════════════════════
   KEY MOMENTS
   ══════════════════════════════════════════════ */
function buildKeyMoments(moments) {
  keyMomentsList.innerHTML = '';
  moments.forEach(m => {
    const btn = document.createElement('button');
    btn.className = 'moment-btn';
    btn.innerHTML = `<i class="fa-solid fa-flag"></i>${m.label} <span style="font-family:var(--font-mono);opacity:.55;">${formatTime(m.time)}</span>`;
    btn.addEventListener('click', () => {
      video.currentTime = m.time;
      video.play().catch(() => {});
      triggerFlash(true);
    });
    keyMomentsList.appendChild(btn);
  });
}

/* ══════════════════════════════════════════════
   EVENT LISTENERS
   ══════════════════════════════════════════════ */
function setupEventListeners() {

  /* ── Video events ── */
  video.addEventListener('play',       onPlay);
  video.addEventListener('pause',      onPause);
  video.addEventListener('ended',      onEnded);
  video.addEventListener('timeupdate', onTimeUpdate);
  video.addEventListener('volumechange', onVolumeChange);
  video.addEventListener('waiting',    () => bufferSpinner.classList.add('show'));
  video.addEventListener('playing',    () => bufferSpinner.classList.remove('show'));
  video.addEventListener('canplay',    () => bufferSpinner.classList.remove('show'));
  video.addEventListener('progress',   onBufferProgress);
  video.addEventListener('loadedmetadata', () => {
    totalDurEl.textContent = formatTime(video.duration);
  });

  /* ── Click on video = play/pause ── */
  video.addEventListener('click', togglePlay);

  /* ── Play / Pause button ── */
  playPauseBtn.addEventListener('click', togglePlay);

  /* ── Rewind / Forward ── */
  rewindBtn.addEventListener('click',  () => seekBy(-10));
  forwardBtn.addEventListener('click', () => seekBy(10));

  /* ── Restart ── */
  restartBtn.addEventListener('click', () => {
    video.currentTime = 0;
    video.play().catch(() => {});
  });

  /* ── Volume ── */
  muteBtn.addEventListener('click', toggleMute);
  volumeSlider.addEventListener('input', () => {
    video.volume = parseFloat(volumeSlider.value);
    if (video.volume === 0) video.muted = true;
    else video.muted = false;
  });

  /* ── Fullscreen ── */
  fullscreenBtn.addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('webkitfullscreenchange', onFullscreenChange);

  /* ── PiP ── */
  pipBtn.addEventListener('click', togglePiP);
  if (!document.pictureInPictureEnabled) pipBtn.style.display = 'none';

  /* ── Skip Intro ── */
  skipIntroBtn.addEventListener('click', () => {
    seekBy(60);
    showToast('<i class="fa-solid fa-forward-fast"></i> Skipped 60s');
  });

  /* ── Speed ── */
  speedBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    speedMenu.classList.toggle('open');
  });
  speedOpts.forEach(opt => {
    opt.addEventListener('click', () => {
      const spd = parseFloat(opt.dataset.speed);
      video.playbackRate = spd;
      speedDisplay.textContent = spd === 1 ? '1×' : spd + '×';
      speedOpts.forEach(o => o.classList.toggle('active', o === opt));
      speedMenu.classList.remove('open');
      showToast(`<i class="fa-solid fa-gauge-high"></i> Speed: ${spd}×`);
    });
  });
  document.addEventListener('click', () => speedMenu.classList.remove('open'));

  /* ── Subtitles ── */
  subtitleBtn.addEventListener('click', () => {
    subtitlesEnabled = !subtitlesEnabled;
    subtitleToggle.checked = subtitlesEnabled;
    updateSubtitleState();
    showToast(subtitlesEnabled
      ? '<i class="fa-solid fa-closed-captioning"></i> Subtitles On'
      : '<i class="fa-regular fa-closed-captioning"></i> Subtitles Off');
  });
  subtitleToggle.addEventListener('change', () => {
    subtitlesEnabled = subtitleToggle.checked;
    updateSubtitleState();
  });

  /* ── Progress Bar ── */
  progressArea.addEventListener('mousemove', onProgressHover);
  progressArea.addEventListener('mouseleave', hideSeekTooltip);
  progressArea.addEventListener('mousedown', startSeekDrag);
  document.addEventListener('mousemove', onSeekDrag);
  document.addEventListener('mouseup', endSeekDrag);

  /* ── Touch seek ── */
  progressArea.addEventListener('touchstart', (e) => {
    isDraggingSeek = true;
    seekToPosition(e.touches[0].clientX);
  }, { passive: true });
  document.addEventListener('touchmove', (e) => {
    if (!isDraggingSeek) return;
    seekToPosition(e.touches[0].clientX);
  }, { passive: true });
  document.addEventListener('touchend', () => { isDraggingSeek = false; });

  /* ── Controls auto-hide ── */
  playerWrap.addEventListener('mousemove', onPlayerMouseMove);
  playerWrap.addEventListener('mouseleave', () => {
    if (!video.paused) scheduleHideControls(800);
  });
  playerWrap.addEventListener('touchstart', showControls, { passive: true });

  /* ── Keyboard shortcuts ── */
  document.addEventListener('keydown', onKeyDown);

  /* ── Theme toggle ── */
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light');
    const isLight = document.body.classList.contains('light');
    showToast(isLight
      ? '<i class="fa-solid fa-sun"></i> Light Mode'
      : '<i class="fa-solid fa-moon"></i> Dark Mode');
  });
}

/* ══════════════════════════════════════════════
   VIDEO STATE HANDLERS
   ══════════════════════════════════════════════ */
function onPlay() {
  playIcon.className = 'fa-solid fa-pause';
  playerWrap.classList.remove('ended');
  scheduleHideControls();
}

function onPause() {
  playIcon.className = 'fa-solid fa-play';
  showControls();
  clearTimeout(hideControlsTimer);
}

function onEnded() {
  playIcon.className = 'fa-solid fa-rotate-right';
  playerWrap.classList.add('ended');
  showControls();
  // Auto-advance playlist
  const nextIdx = (currentIdx + 1) % PLAYLIST.length;
  setTimeout(() => loadVideo(nextIdx), 2500);
}

function onTimeUpdate() {
  if (!video.duration) return;
  const pct = (video.currentTime / video.duration) * 100;
  progressFill.style.width = pct + '%';
  progressThumb.style.left = pct + '%';
  currentTimeEl.textContent = formatTime(video.currentTime);

  // Save to localStorage
  saveTime(PLAYLIST[currentIdx].id, video.currentTime);
}

function onVolumeChange() {
  volumeSlider.value = video.muted ? 0 : video.volume;
  updateVolIcon();
}

function onBufferProgress() {
  if (!video.duration) return;
  const buffered = video.buffered;
  if (buffered.length > 0) {
    const buffEnd = buffered.end(buffered.length - 1);
    progressBuffer.style.width = (buffEnd / video.duration * 100) + '%';
  }
}

/* ══════════════════════════════════════════════
   CONTROLS
   ══════════════════════════════════════════════ */
function togglePlay() {
  if (video.paused || video.ended) {
    video.play().catch(() => {});
    triggerFlash(true);
  } else {
    video.pause();
    triggerFlash(false);
  }
}

function seekBy(seconds) {
  video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + seconds));
  showToast(seconds > 0
    ? `<i class="fa-solid fa-forward"></i> +${seconds}s`
    : `<i class="fa-solid fa-backward"></i> ${seconds}s`);
}

function toggleMute() {
  video.muted = !video.muted;
  if (video.muted) {
    volumeSlider.value = 0;
  } else {
    if (video.volume === 0) video.volume = 0.5;
    volumeSlider.value = video.volume;
  }
}

function updateVolIcon() {
  const v = video.muted ? 0 : video.volume;
  if (v === 0) volIcon.className = 'fa-solid fa-volume-xmark';
  else if (v < 0.5) volIcon.className = 'fa-solid fa-volume-low';
  else volIcon.className = 'fa-solid fa-volume-high';
}

/* ── Fullscreen ── */
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    playerWrap.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

function onFullscreenChange() {
  isFullscreen = !!document.fullscreenElement;
  fullscreenIcon.className = isFullscreen ? 'fa-solid fa-compress' : 'fa-solid fa-expand';
}

/* ── PiP ── */
async function togglePiP() {
  try {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else {
      await video.requestPictureInPicture();
      showToast('<i class="fa-solid fa-window-restore"></i> Picture-in-Picture');
    }
  } catch (e) {
    showToast('<i class="fa-solid fa-triangle-exclamation"></i> PiP not supported');
  }
}

/* ── Subtitles ── */
function updateSubtitleState() {
  if (!video.textTracks.length) return;
  const track = video.textTracks[0];
  track.mode = subtitlesEnabled ? 'showing' : 'hidden';
  subtitleBtn.classList.toggle('active', subtitlesEnabled);
  subtitleToggle.checked = subtitlesEnabled;
}

/* ── Flash animation ── */
function triggerFlash(isPlay) {
  playFlashIcon.className = isPlay ? 'fa-solid fa-play' : 'fa-solid fa-pause';
  playFlash.classList.remove('flash');
  void playFlash.offsetWidth; // reflow
  playFlash.classList.add('flash');
}

/* ══════════════════════════════════════════════
   SEEK / PROGRESS BAR
   ══════════════════════════════════════════════ */
function onProgressHover(e) {
  const rect = progressTrack.getBoundingClientRect();
  const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  const time = pct * (video.duration || 0);

  // Position tooltip
  const containerRect = playerWrap.getBoundingClientRect();
  const relX = e.clientX - containerRect.left;
  const clampedX = Math.max(45, Math.min(containerRect.width - 45, relX));

  seekTooltip.style.left = clampedX + 'px';
  tooltipTime.textContent = formatTime(time);
  tooltipThumb.textContent = 'Frame ~' + Math.floor(time * 24);
  seekTooltip.classList.add('visible');

  // Update thumb position
  progressThumb.style.left = (pct * 100) + '%';
}

function hideSeekTooltip() {
  seekTooltip.classList.remove('visible');
}

function startSeekDrag(e) {
  isDraggingSeek = true;
  seekToPosition(e.clientX);
}

function onSeekDrag(e) {
  if (!isDraggingSeek) return;
  seekToPosition(e.clientX);
  onProgressHover(e);
}

function endSeekDrag() {
  isDraggingSeek = false;
  hideSeekTooltip();
}

function seekToPosition(clientX) {
  const rect = progressTrack.getBoundingClientRect();
  const pct  = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  video.currentTime = pct * (video.duration || 0);
}

/* ══════════════════════════════════════════════
   AUTO-HIDE CONTROLS
   ══════════════════════════════════════════════ */
function showControls() {
  playerWrap.classList.add('controls-visible', 'cursor-visible');
  clearTimeout(hideControlsTimer);
}

function scheduleHideControls(delay = 2800) {
  clearTimeout(hideControlsTimer);
  hideControlsTimer = setTimeout(() => {
    if (!video.paused) {
      playerWrap.classList.remove('controls-visible', 'cursor-visible');
    }
  }, delay);
}

function onPlayerMouseMove() {
  showControls();
  if (!video.paused) scheduleHideControls();
}

/* ══════════════════════════════════════════════
   KEYBOARD SHORTCUTS
   ══════════════════════════════════════════════ */
function onKeyDown(e) {
  // Don't trigger when typing in an input
  if (e.target.tagName === 'INPUT') return;

  switch (e.code) {
    case 'Space':
      e.preventDefault();
      togglePlay();
      break;
    case 'ArrowRight':
      e.preventDefault();
      seekBy(10);
      break;
    case 'ArrowLeft':
      e.preventDefault();
      seekBy(-10);
      break;
    case 'ArrowUp':
      e.preventDefault();
      video.volume = Math.min(1, video.volume + 0.1);
      video.muted  = false;
      showToast(`<i class="fa-solid fa-volume-high"></i> Volume ${Math.round(video.volume * 100)}%`);
      break;
    case 'ArrowDown':
      e.preventDefault();
      video.volume = Math.max(0, video.volume - 0.1);
      showToast(`<i class="fa-solid fa-volume-low"></i> Volume ${Math.round(video.volume * 100)}%`);
      break;
    case 'KeyF':
      toggleFullscreen();
      break;
    case 'KeyM':
      toggleMute();
      break;
  }
}

/* ══════════════════════════════════════════════
   LOCAL STORAGE — WATCH PROGRESS
   ══════════════════════════════════════════════ */
function saveTime(id, time) {
  try {
    localStorage.setItem('cine_progress_' + id, String(Math.floor(time)));
  } catch (_) {}
}

function getSavedTime(id) {
  try {
    return parseInt(localStorage.getItem('cine_progress_' + id) || '0', 10);
  } catch (_) { return 0; }
}

/* ══════════════════════════════════════════════
   TOAST NOTIFICATIONS
   ══════════════════════════════════════════════ */
let toastEl = null;

function showToast(html) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    document.body.appendChild(toastEl);
  }
  toastEl.innerHTML = html;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove('show');
  }, 1800);
}

/* ══════════════════════════════════════════════
   UTILITIES
   ══════════════════════════════════════════════ */
function formatTime(sec) {
  if (!isFinite(sec) || isNaN(sec)) return '0:00';
  const s = Math.floor(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

/* ══════════════════════════════════════════════
   KICK OFF
   ══════════════════════════════════════════════ */
init();
