(() => {
  const STAGE_W = 3840, STAGE_H = 1080, HALF_W = 1920;
  const qs = new URLSearchParams(location.search);
  let room = (qs.get('room') || '').toUpperCase();
  let role = qs.get('side') === 'right' ? 'right' : qs.get('side') === 'left' ? 'left' : null;
  let peer = null, conn = null, syncTimer = null;
  let fit = localStorage.getItem('duowall-fit') || 'contain';
  let guide = localStorage.getItem('duowall-guide') !== 'off';
  const cal = {x:Number(localStorage.getItem('duowall-x')||0),y:Number(localStorage.getItem('duowall-y')||0)};

  const state = {
    tickerText:'FOLLOW @IRHS_TECH.CLUB  •  JOIN OUR DISCORD  •  BUILD SOMETHING COOL  •  WEDNESDAYS AT LUNCH  •  IRHS TECH CLUB',
    tickerSpeed:28,
    tickerPhase:0,
    cardScale:100,
    instagramUrl:'https://www.instagram.com/irhs_tech.club/',
    discordUrl:'',
    websiteUrl:'https://irhs-tech-club.vercel.app/'
  };
  let tickerStarted = performance.now();
  const $ = id => document.getElementById(id);

  function makeRoomCode(){const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let out='';crypto.getRandomValues(new Uint32Array(6)).forEach(n=>out+=chars[n%chars.length]);return out;}
  function safeUrl(v){if(!v)return'';try{const u=new URL(v);return ['http:','https:'].includes(u.protocol)?u.href:''}catch{return''}}
  function qrUrl(v){return `https://api.qrserver.com/v1/create-qr-code/?size=700x700&margin=12&data=${encodeURIComponent(v)}`}

  function showSetup(){$('setupView').classList.remove('hidden');$('wallView').classList.add('hidden')}
  function showWall(){
    $('setupView').classList.add('hidden');$('wallView').classList.remove('hidden');
    $('roomCodeLabel').textContent=room;$('roleTitle').textContent=`${role.toUpperCase()} SCREEN`;
    $('hostControls').classList.toggle('hidden',role!=='left');$('nudgeX').value=cal.x;$('nudgeY').value=cal.y;
    $('toggleFitBtn').textContent=`FIT: ${fit.toUpperCase()}`;$('toggleGuideBtn').textContent=`SEAM: ${guide?'ON':'OFF'}`;
    $('seamGuide').classList.toggle('hidden',!guide);syncControls();render();layoutStage();
  }
  function setConnection(label,kind=''){$('connectionBadge').className=`connection-badge ${kind}`;$('connectionBadge').querySelector('b').textContent=label}
  function buildCard(index,title,subtitle,url){
    const card=document.createElement('article');card.className='qr-card';
    const clean=safeUrl(url);
    card.innerHTML=`<div class="index">0${index}</div><div class="qr-box"></div><div><h2>${title}</h2><p>${subtitle}</p></div>`;
    const box=card.querySelector('.qr-box');
    if(clean){const img=document.createElement('img');img.src=qrUrl(clean);img.alt=`${title} QR code`;box.appendChild(img)}
    else {const p=document.createElement('div');p.className='qr-placeholder';p.textContent='ADD DISCORD INVITE';box.appendChild(p)}
    return card;
  }
  function render(){
    const grid=$('qrGrid');grid.innerHTML='';
    grid.appendChild(buildCard(1,'INSTAGRAM','@irhs_tech.club',state.instagramUrl));
    grid.appendChild(buildCard(2,'DISCORD','Scan to join the server',state.discordUrl));
    grid.appendChild(buildCard(3,'WEBSITE','IRHS Tech Club online',state.websiteUrl));
    grid.style.transform=`scale(${state.cardScale/100})`;
    renderTicker();
  }
  function renderTicker(){
    const msg=(state.tickerText||'IRHS TECH CLUB').trim();
    const repeated=`${msg}    ✦    ${msg}    ✦    `;
    ['tickerTop','tickerBottom'].forEach(id=>{
      const el=$(id);el.innerHTML=`<span>${repeated}</span><span>${repeated}</span>`;
      el.style.animationDuration=`${state.tickerSpeed}s`;
      const phase=((state.tickerPhase||0)%state.tickerSpeed+state.tickerSpeed)%state.tickerSpeed;
      el.style.animationDelay=`-${phase}s`;
    });
  }
  function currentTickerPhase(){return (((performance.now()-tickerStarted)/1000)+(state.tickerPhase||0))%state.tickerSpeed}
  function layoutStage(){
    if($('wallView').classList.contains('hidden'))return;
    const vw=innerWidth,vh=innerHeight,sx=vw/HALF_W,sy=vh/STAGE_H,scale=fit==='cover'?Math.max(sx,sy):Math.min(sx,sy);
    const left=(vw-HALF_W*scale)/2+cal.x,top=(vh-STAGE_H*scale)/2+cal.y,offset=role==='right'?-HALF_W:0;
    $('stage').style.left=`${left}px`;$('stage').style.top=`${top}px`;$('stage').style.transform=`scale(${scale}) translateX(${offset}px)`;
  }
  function syncControls(){
    ['tickerText','tickerSpeed','cardScale','instagramUrl','discordUrl','websiteUrl'].forEach(k=>{if($(k))$(k).value=state[k]});
  }
  function broadcastState(){if(role!=='left'||!conn||!conn.open)return;const payload={...state,tickerPhase:currentTickerPhase()};conn.send({type:'state',state:payload})}
  function receive(data){if(!data||typeof data!=='object')return;if(data.type==='hello'&&role==='left')broadcastState();if(data.type==='state'&&role==='right'){Object.assign(state,data.state||{});tickerStarted=performance.now();syncControls();render()}}
  function setupConnection(c){
    conn=c;conn.on('open',()=>{setConnection('PAIRED','connected');if(role==='right')conn.send({type:'hello'});else{broadcastState();clearInterval(syncTimer);syncTimer=setInterval(broadcastState,5000)}});
    conn.on('data',receive);conn.on('close',()=>setConnection('DISCONNECTED','offline'));conn.on('error',()=>setConnection('CONNECTION ERROR','offline'));
  }
  function startPeer(){
    if(!window.Peer){setConnection('PEER LIBRARY BLOCKED','offline');return}
    showWall();setConnection(role==='left'?'WAITING FOR RIGHT':'FINDING LEFT');
    const id=role==='left'?`irhs-wall-${room.toLowerCase()}`:undefined;peer=new Peer(id,{debug:1});
    peer.on('open',()=>{if(role==='right')setupConnection(peer.connect(`irhs-wall-${room.toLowerCase()}`,{reliable:true}))});
    if(role==='left')peer.on('connection',c=>{if(conn&&conn.open)conn.close();setupConnection(c)});
    peer.on('error',err=>{console.error(err);if(err.type==='unavailable-id'&&role==='left'){location.href=`?room=${makeRoomCode()}&side=left`;return}setConnection('PEER ERROR','offline')});
  }

  $('createRoomBtn').addEventListener('click',()=>location.href=`?room=${makeRoomCode()}&side=left`);
  $('showJoinBtn').addEventListener('click',()=>{$('joinPanel').classList.remove('hidden');$('roomInput').focus()});
  function join(){const v=$('roomInput').value.trim().toUpperCase();if(!/^[A-Z2-9]{6}$/.test(v)){$('joinError').textContent='Enter the 6-character code from the left laptop.';return}location.href=`?room=${v}&side=right`}
  $('joinRoomBtn').addEventListener('click',join);$('roomInput').addEventListener('keydown',e=>{if(e.key==='Enter')join()});$('roomInput').addEventListener('input',e=>e.target.value=e.target.value.toUpperCase().replace(/[^A-Z2-9]/g,'').slice(0,6));

  ['tickerText','tickerSpeed','cardScale','instagramUrl','discordUrl','websiteUrl'].forEach(k=>$(k).addEventListener('input',e=>{
    if(k==='tickerSpeed'){state.tickerPhase=currentTickerPhase();tickerStarted=performance.now();state[k]=Number(e.target.value)}
    else if(k==='cardScale')state[k]=Number(e.target.value);else state[k]=e.target.value;
    render();broadcastState();
  }));
  $('nudgeX').addEventListener('input',e=>{cal.x=Number(e.target.value);localStorage.setItem('duowall-x',cal.x);layoutStage()});
  $('nudgeY').addEventListener('input',e=>{cal.y=Number(e.target.value);localStorage.setItem('duowall-y',cal.y);layoutStage()});
  $('toggleFitBtn').addEventListener('click',()=>{fit=fit==='contain'?'cover':'contain';localStorage.setItem('duowall-fit',fit);$('toggleFitBtn').textContent=`FIT: ${fit.toUpperCase()}`;layoutStage()});
  $('toggleGuideBtn').addEventListener('click',()=>{guide=!guide;localStorage.setItem('duowall-guide',guide?'on':'off');$('seamGuide').classList.toggle('hidden',!guide);$('toggleGuideBtn').textContent=`SEAM: ${guide?'ON':'OFF'}`});
  $('toggleControlsBtn').addEventListener('click',()=>$('controlPanel').classList.toggle('closed'));$('closeControlsBtn').addEventListener('click',()=>$('controlPanel').classList.add('closed'));
  $('fullscreenBtn').addEventListener('click',async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen()}catch{}});
  document.addEventListener('fullscreenchange',()=>{$('fullscreenBtn').textContent=document.fullscreenElement?'Exit fullscreen':'Enter fullscreen';setTimeout(layoutStage,80)});
  $('leaveBtn').addEventListener('click',()=>location.href=location.pathname);
  $('copyRoomBtn').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(room);$('copyRoomBtn').textContent='COPIED';setTimeout(()=>$('copyRoomBtn').textContent='COPY',1100)}catch{}});
  addEventListener('resize',layoutStage);addEventListener('keydown',e=>{if(e.key.toLowerCase()==='f'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName))$('fullscreenBtn').click();if(e.key.toLowerCase()==='h'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName))$('controlPanel').classList.toggle('closed')});
  if(room&&role)startPeer();else showSetup();
})();
