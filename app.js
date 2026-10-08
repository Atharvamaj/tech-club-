(() => {
  const STAGE_W = 3840;
  const STAGE_H = 1080;
  const HALF_W = STAGE_W / 2;
  const config = window.IRHS_POSTER_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  let side = params.get('screen');
  let raf = 0;
  let wakeLock = null;
  let wakePending = false;
  let keepAwake = true;

  function wakeStatus(text) {
    $('wakeButton').textContent = text;
    $('wakeButton').setAttribute('aria-pressed', String(keepAwake));
  }

  async function requestWakeLock() {
    if (!keepAwake || wakeLock || wakePending || document.visibilityState !== 'visible' || !['left', 'right'].includes(side)) return;
    if (!('wakeLock' in navigator)) {
      wakeStatus('AWAKE MODE UNAVAILABLE');
      $('wakeButton').title = 'Set your computer’s display sleep to Never while showing the poster.';
      return;
    }
    wakePending = true;
    try {
      const lock = await navigator.wakeLock.request('screen');
      if (!keepAwake || !['left', 'right'].includes(side)) {
        await lock.release();
        return;
      }
      wakeLock = lock;
      wakeStatus('SCREEN STAYS AWAKE');
      lock.addEventListener('release', () => {
        if (wakeLock === lock) {
          wakeLock = null;
          wakeStatus(keepAwake ? 'RETRY AWAKE MODE' : 'KEEP SCREEN AWAKE');
        }
      });
    } catch {
      wakeStatus('RETRY AWAKE MODE');
      $('wakeButton').title = 'The browser could not keep the screen awake. Click to retry or adjust display sleep settings.';
    } finally {
      wakePending = false;
    }
  }

  async function releaseWakeLock() {
    const lock = wakeLock;
    wakeLock = null;
    if (lock) { try { await lock.release(); } catch {} }
  }

  $('wakeButton').addEventListener('click', async () => {
    if (wakeLock) {
      keepAwake = false;
      await releaseWakeLock();
      wakeStatus('KEEP SCREEN AWAKE');
    } else {
      keepAwake = true;
      await requestWakeLock();
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') requestWakeLock();
  });

  const saved = {
    x: Number(localStorage.getItem('irhs-poster-x') || 0),
    y: Number(localStorage.getItem('irhs-poster-y') || 0),
    zoom: Number(localStorage.getItem('irhs-poster-zoom') || 100)
  };

  function safeUrl(value) {
    if (!value) return '';
    try {
      const url = new URL(value);
      return /^https?:$/.test(url.protocol) ? url.href : '';
    } catch {
      return '';
    }
  }

  function qrUrl(value) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=800x800&margin=24&format=png&data=${encodeURIComponent(value)}`;
  }

  function setupQrCodes() {
    const instagram = safeUrl(config.instagramUrl);
    const discord = safeUrl(config.discordUrl);

    if (instagram) $('instagramQr').src = qrUrl(instagram);

    if (discord) {
      $('discordCaption').textContent = 'Scan to join the community.';
      $('discordQr').src = qrUrl(discord);
      $('discordQrWrap').classList.remove('hidden');
      $('discordMissing').classList.add('hidden');
    } else {
      $('discordCaption').textContent = 'Meet the team on Tuesday at lunch.';
      $('discordQrWrap').classList.add('hidden');
      $('discordMissing').classList.remove('hidden');
    }
  }

  function buildTicker(id) {
    const text = (config.tickerText || 'IRHS TECH CLUB').trim();
    const track = $(id);
    track.innerHTML = '';
    for (let i = 0; i < 8; i++) {
      const span = document.createElement('span');
      span.textContent = `${text}  ✦  `;
      track.appendChild(span);
    }
  }

  function animateTickers() {
    const speed = Number(config.tickerSpeedPxPerSecond || 125);
    const nowSeconds = Date.now() / 1000;

    const mid = $('tickerMid');
    const bottom = $('tickerBottom');
    const cycleMid = mid.firstElementChild ? mid.firstElementChild.offsetWidth : 3200;
    const cycleBottom = bottom.firstElementChild ? bottom.firstElementChild.offsetWidth : 3200;

    const x1 = -((nowSeconds * speed) % Math.max(cycleMid, 1));
    const x2 = -cycleBottom + ((nowSeconds * speed * 0.78) % Math.max(cycleBottom, 1));
    mid.style.transform = `translate3d(${x1}px,0,0)`;
    bottom.style.transform = `translate3d(${x2}px,0,0)`;
    raf = requestAnimationFrame(animateTickers);
  }

  function layoutStage() {
    if (!['left', 'right'].includes(side)) return;
    const vw = innerWidth;
    const vh = innerHeight;
    const scale = Math.min(vw / HALF_W, vh / STAGE_H) * (saved.zoom / 100);
    const visibleW = HALF_W * scale;
    const visibleH = STAGE_H * scale;
    const left = (vw - visibleW) / 2 + saved.x;
    const top = (vh - visibleH) / 2 + saved.y;
    const sliceOffset = side === 'right' ? -HALF_W : 0;

    $('stage').style.left = `${left}px`;
    $('stage').style.top = `${top}px`;
    $('stage').style.transform = `scale(${scale}) translateX(${sliceOffset}px)`;
  }

  function showPoster(chosenSide, pushUrl = true) {
    side = chosenSide;
    if (pushUrl) {
      const url = new URL(location.href);
      url.searchParams.set('screen', side);
      history.replaceState({}, '', url);
    }
    $('launcher').classList.add('hidden');
    $('posterView').classList.remove('hidden');
    $('sideBadge').textContent = side === 'left' ? 'LAPTOP 01 • LEFT' : 'LAPTOP 02 • RIGHT';
    setupQrCodes();
    buildTicker('tickerMid');
    buildTicker('tickerBottom');
    cancelAnimationFrame(raf);
    animateTickers();
    layoutStage();
    requestWakeLock();

    setTimeout(() => {
      $('sideBadge').classList.add('fade');
      $('fullscreenButton').classList.add('fade');
      $('exitButton').classList.add('fade');
    }, 6000);
  }

  async function requestFullscreen() {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch {}
    setTimeout(layoutStage, 120);
  }

  document.querySelectorAll('[data-side]').forEach((button) => {
    button.addEventListener('click', async () => {
      showPoster(button.dataset.side, true);
      await requestFullscreen();
    });
  });

  $('fullscreenButton').addEventListener('click', requestFullscreen);
  $('exitButton').addEventListener('click', () => {
    cancelAnimationFrame(raf);
    side = null;
    releaseWakeLock();
    wakeStatus('KEEP SCREEN AWAKE');
    $('calibration').classList.add('hidden');
    history.replaceState({}, '', location.pathname);
    $('posterView').classList.add('hidden');
    $('launcher').classList.remove('hidden');
  });

  $('closeCalibration').addEventListener('click', () => $('calibration').classList.add('hidden'));
  $('nudgeX').value = saved.x;
  $('nudgeY').value = saved.y;
  $('zoom').value = saved.zoom;

  $('nudgeX').addEventListener('input', (e) => {
    saved.x = Number(e.target.value);
    localStorage.setItem('irhs-poster-x', saved.x);
    layoutStage();
  });
  $('nudgeY').addEventListener('input', (e) => {
    saved.y = Number(e.target.value);
    localStorage.setItem('irhs-poster-y', saved.y);
    layoutStage();
  });
  $('zoom').addEventListener('input', (e) => {
    saved.zoom = Number(e.target.value);
    localStorage.setItem('irhs-poster-zoom', saved.zoom);
    layoutStage();
  });

  addEventListener('resize', layoutStage);
  document.addEventListener('fullscreenchange', () => setTimeout(layoutStage, 120));
  addEventListener('mousemove', () => {
    if (!['left', 'right'].includes(side)) return;
    $('fullscreenButton').classList.remove('fade');
    $('exitButton').classList.remove('fade');
  });

  addEventListener('keydown', (event) => {
    if (event.target.matches('input, textarea, select') || !['left', 'right'].includes(side)) return;
    const key = event.key.toLowerCase();
    if (key === 'f') requestFullscreen();
    if (key === 'c') $('calibration').classList.toggle('hidden');
    if (key === 'escape' && !document.fullscreenElement) $('calibration').classList.add('hidden');
  });

  if (side === 'left' || side === 'right') showPoster(side, false);
})();

