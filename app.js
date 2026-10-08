(() => {
  const STAGE_W = 3840;
  const STAGE_H = 1080;
  const HALF_W = STAGE_W / 2;
  const config = window.IRHS_POSTER_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  let side = params.get('screen') || params.get('side');
  let room = (params.get('room') || '').toUpperCase();
  if (!/^[A-Z2-9]{6}$/.test(room)) room = '';
  let peer = null, conn = null, syncInterval = 0;
  let remoteClock = null, bestRtt = Infinity;
  let synchronizedSpeed = null;
  const pendingPings = new Map();
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
    zoom: Number(localStorage.getItem('irhs-poster-zoom') || 100),
    timing: Number(localStorage.getItem('irhs-poster-timing') || 0)
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

  const embeddedQr = {"https://www.instagram.com/irhs.technology/":"data:image/png;base64,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","https://discord.gg/eJXv5R6YJy":"data:image/png;base64,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","https://classroom.google.com/c/ODkwMDIwOTE0NTQ2?cjc=6iepwule":"data:image/png;base64,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"};
  function qrUrl(value) {
    return embeddedQr[value] || "";
  }

  function setupQrCodes() {
    const classroom = safeUrl(config.classroomUrl);
    if (classroom) $('classroomQr').src = qrUrl(classroom);
    const instagram = safeUrl(config.instagramUrl);
    const discord = safeUrl(config.discordUrl);

    if (instagram) $('instagramQr').src = qrUrl(instagram);

    if (discord) {
      $('discordCaption').textContent = 'Scan to join.';
      $('discordQr').src = qrUrl(discord);
      $('discordQrWrap').classList.remove('hidden');
      $('discordMissing').classList.add('hidden');
    } else {
      $('discordCaption').textContent = 'Tuesdays • Lunch • Room 131';
      $('discordQrWrap').classList.add('hidden');
      $('discordMissing').classList.remove('hidden');
    }
  }

  let tickerItems = (config.tickerText || 'IRHS TECH CLUB').split('•').map(text => text.trim()).filter(Boolean);
  const CELL_WIDTH = 640;
  let cycleWidth = tickerItems.length * CELL_WIDTH;

  function buildTicker(id) {
    const track = $(id);
    track.innerHTML = '';
    for (let repeat = 0; repeat < 4; repeat++) {
      const cycle = document.createElement('div');
      cycle.className = 'ticker-cycle';
      for (const text of tickerItems) {
        const span = document.createElement('span');
        span.textContent = text;
        cycle.appendChild(span);
      }
      track.appendChild(cycle);
    }
  }

  function animateTickers() {
    const speed = synchronizedSpeed || Number(config.tickerSpeedPxPerSecond || 125);
    // Fixed cycle geometry avoids font and display-scale differences.
    const seconds = tickerSeconds();
    const phase = ((seconds * speed) % cycleWidth + cycleWidth) % cycleWidth;
    const reverse = ((seconds * speed * 0.78) % cycleWidth + cycleWidth) % cycleWidth;
    $('tickerMid').style.transform = `translate3d(${-phase}px,0,0)`;
    $('tickerBottom').style.transform = `translate3d(${-cycleWidth + reverse}px,0,0)`;
    raf = requestAnimationFrame(animateTickers);
  }

  function tickerSeconds() {
    if (side === 'right' && remoteClock) return remoteClock.seconds + (performance.now() - remoteClock.at) / 1000;
    return (Date.now() + saved.timing) / 1000;
  }

  function setConnection(message) {
    $('connectionStatus').textContent = message;
    $('roomCodeLabel').textContent = room ? 'ROOM ' + room + ' ·' : '';
    $('pairInfo').classList.toggle('hidden', !room);
  }

  function makeRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from(crypto.getRandomValues(new Uint32Array(6)), n => chars[n % chars.length]).join('');
  }

  function stopPairing() {
    clearInterval(syncInterval);
    const oldConn = conn;
    conn = null;
    if (oldConn) oldConn.close();
    if (peer) peer.destroy();
    peer = null;
    pendingPings.clear();
    remoteClock = null;
    bestRtt = Infinity;
    synchronizedSpeed = null;
  }

  function sendPing() {
    if (!conn || !conn.open || side !== 'right') return;
    const at = performance.now();
    pendingPings.set(at, at);
    for (const [id, sent] of pendingPings) if (at - sent > 10000) pendingPings.delete(id);
    conn.send({type: 'clock-ping', id: at});
  }

  function receive(data) {
    if (!data || typeof data !== 'object') return;
    if (side === 'left' && data.type === 'clock-ping' && Number.isFinite(data.id)) {
      conn.send({type: 'clock-pong', id: data.id, seconds: tickerSeconds(), speed: Number(config.tickerSpeedPxPerSecond || 125), items: tickerItems});
    }
    if (side === 'right' && data.type === 'clock-pong' && pendingPings.has(data.id)) {
      const now = performance.now();
      const rtt = now - pendingPings.get(data.id);
      pendingPings.delete(data.id);
      if (!Number.isFinite(data.seconds) || !Number.isFinite(data.speed) || data.speed <= 0 || data.speed > 500) return;
      if (!Array.isArray(data.items) || !data.items.length || data.items.length > 40 || data.items.some(text => typeof text !== 'string' || text.length > 100)) return;
      if (rtt <= bestRtt + 25 || !remoteClock || now - remoteClock.at > 10000) {
        bestRtt = rtt;
        remoteClock = {seconds: data.seconds + rtt / 2000, at: now};
        synchronizedSpeed = data.speed;
        if (JSON.stringify(tickerItems) !== JSON.stringify(data.items)) {
          tickerItems = data.items;
          cycleWidth = tickerItems.length * CELL_WIDTH;
          buildTicker('tickerMid');
          buildTicker('tickerBottom');
        }
      }
      setConnection('PAIRED');
    }
  }

  function setupConnection(connection) {
    if (conn && conn !== connection) conn.close();
    conn = connection;
    connection.on('open', () => {
      if (conn !== connection) return;
      setConnection(side === 'left' ? 'PAIRED' : 'SYNCING');
      if (side === 'right') { sendPing(); clearInterval(syncInterval); syncInterval = setInterval(sendPing, 2000); }
    });
    connection.on('data', data => { if (conn === connection) receive(data); });
    connection.on('close', () => { if (conn === connection) { clearInterval(syncInterval); setConnection('DISCONNECTED · click to retry'); } });
    connection.on('error', () => setConnection('CONNECTION ERROR · click to retry'));
  }

  function startPairing() {
    stopPairing();
    if (!room) { setConnection(''); return; }
    if (!window.Peer) { setConnection('PAIRING UNAVAILABLE'); return; }
    setConnection(side === 'left' ? 'WAITING FOR RIGHT' : 'CONNECTING');
    peer = new Peer(side === 'left' ? 'irhs-wall-' + room.toLowerCase() : undefined, {debug: 0});
    peer.on('open', () => { if (side === 'right') setupConnection(peer.connect('irhs-wall-' + room.toLowerCase(), {reliable: true})); });
    peer.on('connection', connection => {
      if (side === 'left') setupConnection(connection); else connection.close();
    });
    peer.on('error', error => {
      if (error.type === 'unavailable-id' && side === 'left') {
        room = makeRoomCode();
        updateRoomUrl();
        startPairing();
      } else setConnection('PAIRING ERROR · click to retry');
    });
  }

  function updateRoomUrl() {
    const url = new URL(location.href);
    url.searchParams.set('room', room);
    url.searchParams.set('screen', side);
    url.searchParams.delete('side');
    history.replaceState({}, '', url);
  }

  $('createRoomBtn').addEventListener('click', () => {
    room = makeRoomCode();
    showPoster('left');
    updateRoomUrl();
    startPairing();
    requestFullscreen();
  });
  $('showJoinBtn').addEventListener('click', () => { $('joinPanel').classList.remove('hidden'); $('roomInput').focus(); });
  $('roomInput').addEventListener('input', event => { event.target.value = event.target.value.toUpperCase().replace(/[^A-Z2-9]/g, '').slice(0, 6); });
  $('joinPanel').addEventListener('submit', event => {
    event.preventDefault();
    const code = $('roomInput').value.trim().toUpperCase();
    if (!/^[A-Z2-9]{6}$/.test(code)) { $('joinError').textContent = 'Enter the six-character code shown on the left laptop.'; return; }
    room = code;
    showPoster('right');
    updateRoomUrl();
    startPairing();
    requestFullscreen();
  });
  $('pairInfo').addEventListener('click', () => {
    if (conn && conn.open) { if (side === 'right') sendPing(); } else startPairing();
  });

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
    stopPairing();
    room = '';
    setConnection('');
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

  $('timing').value = saved.timing;
  $('timingValue').textContent = saved.timing + ' ms';
  $('timing').addEventListener('input', (event) => {
    saved.timing = Number(event.target.value);
    localStorage.setItem('irhs-poster-timing', saved.timing);
    $('timingValue').textContent = saved.timing + ' ms';
  });
  $('resetAlignment').addEventListener('click', () => {
    for (const [key, value, input] of [['x', 0, 'nudgeX'], ['y', 0, 'nudgeY'], ['zoom', 100, 'zoom'], ['timing', 0, 'timing']]) {
      saved[key] = value;
      localStorage.setItem('irhs-poster-' + key, value);
      $(input).value = value;
    }
    $('timingValue').textContent = '0 ms';
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

  if (side === 'left' || side === 'right') { showPoster(side, false); startPairing(); }
})();




