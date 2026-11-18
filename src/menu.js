/* ============ AFTERMATH : ZERO — menus ============ */
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const clamp = (v,a,b) => v<a?a:(v>b?b:v);
const fmtN = n => n.toLocaleString('fr-FR');
const LS = {
  get(k,d){ try{ const v = localStorage.getItem(k); return v?JSON.parse(v):d; }catch(e){ return d; } },
  set(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};

/* ============ AUDIO ============ */
const Sound = {
  ctx:null, master:null, sfx:null, mus:null, musicOn:false, musicTimer:null,
  init(){ if(this.ctx) return;
    try{
      this.ctx = new (window.AudioContext||window.webkitAudioContext)();
      this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination);
      this.sfx = this.ctx.createGain(); this.sfx.connect(this.master);
      this.mus = this.ctx.createGain(); this.mus.connect(this.master);
      this.apply();
    }catch(e){}
  },
  apply(){ if(!this.ctx) return;
    const s = App.profile.settings;
    this.master.gain.value = (s.volGen/100)||0.7;
    this.sfx.gain.value = (s.volSfx/100)||0.3;
    this.mus.gain.value = (s.volMus/100)*0.5;
  },
  noise(dur, f0, f1, gain, type){
    if(!this.ctx) return;
    const c=this.ctx, n=c.createBufferSource(), len=Math.max(1,(dur*c.sampleRate)|0);
    const buf=c.createBuffer(1,len,c.sampleRate), d=buf.getChannelData(0);
    for(let i=0;i<len;i++) d[i]=Math.random()*2-1;
    n.buffer=buf;
    const flt=c.createBiquadFilter(); flt.type=type||'lowpass';
    flt.frequency.setValueAtTime(f0,c.currentTime);
    flt.frequency.exponentialRampToValueAtTime(Math.max(40,f1),c.currentTime+dur);
    const g=c.createGain();
    g.gain.setValueAtTime(gain,c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+dur);
    n.connect(flt); flt.connect(g); g.connect(this.sfx||this.master);
    n.start(); n.stop(c.currentTime+dur+0.02);
  },
  tone(freq,dur,gain,type,slideTo){
    if(!this.ctx) return;
    const c=this.ctx, o=c.createOscillator(), g=c.createGain();
    o.type=type||'sine'; o.frequency.setValueAtTime(freq,c.currentTime);
    if(slideTo) o.frequency.exponentialRampToValueAtTime(slideTo,c.currentTime+dur);
    g.gain.setValueAtTime(gain,c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001,c.currentTime+dur);
    o.connect(g); g.connect(this.sfx||this.master);
    o.start(); o.stop(c.currentTime+dur+0.02);
  },
  shot(kind){
    if(kind==='pistol'){ this.noise(0.13,2600,300,0.5); this.tone(160,0.08,0.3,'square',60); }
    else if(kind==='shotgun'){ this.noise(0.32,1500,120,0.75); this.tone(90,0.2,0.4,'square',40); }
    else if(kind==='lmg'){ this.noise(0.12,2100,260,0.55); this.tone(120,0.08,0.3,'square',50); }
    else { this.noise(0.16,2400,220,0.6); this.tone(150,0.09,0.32,'square',60); }
  },
  enemyShot(dist){ const g=clamp(0.35-dist*0.006,0.05,0.35); this.noise(0.18,1400,150,g); },
  hit(){ this.tone(2200,0.05,0.22,'triangle'); },
  kill(){ this.tone(600,0.1,0.3,'triangle',900); },
  pickup(){ this.tone(700,0.07,0.25,'sine',1100); setTimeout(()=>this.tone(1100,0.08,0.2,'sine',1400),70); },
  reload(){ this.tone(300,0.05,0.2,'square'); setTimeout(()=>this.tone(500,0.05,0.2,'square'),160); setTimeout(()=>this.tone(700,0.06,0.22,'square'),420); },
  hurt(){ this.noise(0.2,500,80,0.5); },
  beep(){ this.tone(880,0.09,0.3,'sine'); },
  rotor(on){
    if(on && !this._rot){ const c=this.ctx; if(!c) return;
      this._rot=c.createOscillator(); this._rg=c.createGain(); this._rlfo=c.createOscillator(); this._rLg=c.createGain();
      this._rot.type='triangle'; this._rot.frequency.value=58;
      this._rg.gain.value=0.0; this._rot.connect(this._rg); this._rg.connect(this.sfx||this.master);
      this._rlfo.frequency.value=13;
      this._rLg.gain.value=0.4; this._rlfo.connect(this._rLg); this._rLg.connect(this._rg.gain);
      this._rot.start(); this._rlfo.start();
    } else if(!on && this._rot){ try{ this._rot.stop(); this._rlfo.stop(); }catch(e){} this._rot=null; }
  },
  rotorVol(v){ if(this._rg) this._rg.gain.value=clamp(v,0,0.6); },
  music(on){
    if(on && !this.musicOn){ this.musicOn=true;
      const pad=()=>{
        if(!this.musicOn||!this.ctx) return;
        const c=this.ctx;
        [110, 164.8, 220, 277.2].forEach((f,i)=>{
          const o=c.createOscillator(), g=c.createGain();
          o.type='sine'; o.frequency.value=f;
          g.gain.setValueAtTime(0.0001,c.currentTime);
          g.gain.linearRampToValueAtTime(0.05-i*0.008,c.currentTime+2);
          g.gain.linearRampToValueAtTime(0.0001,c.currentTime+7);
          o.connect(g); g.connect(this.mus||this.master);
          o.start(); o.stop(c.currentTime+7.2);
        });
        this.musicTimer=setTimeout(pad, 6500);
      };
      pad();
    } else if(!on && this.musicOn){ this.musicOn=false; clearTimeout(this.musicTimer); }
  }
};

/* ============ ARMES ============ */
const SKINS = {
  none:{name:'Noir mat', price:0, c1:'#2b2e33', c2:'#1c1e22', c3:'#3d4148', acc:'#1a1c20'},
  arctic:{name:'Arctique', price:2000, c1:'#c9d3da', c2:'#8fa0ac', c3:'#e8eef2', acc:'#6f8b9a'},
  desert:{name:'Désert', price:2000, c1:'#c2a46b', c2:'#8f7444', c3:'#dcc494', acc:'#6b5330'},
  forest:{name:'Forêt', price:1500, c1:'#4a5d3a', c2:'#32412a', c3:'#6b7d52', acc:'#28331f'},
  gold:{name:'Or', price:8000, c1:'#d8a428', c2:'#9c6e12', c3:'#f4cf6a', acc:'#7a5510'},
  crimson:{name:'Rouge cristal', price:6000, c1:'#b3242c', c2:'#7a1018', c3:'#e05860', acc:'#4d0a10'},
  hazard:{name:'Uranium', price:10000, c1:'#9ab42c', c2:'#5f701a', c3:'#cfe45e', acc:'#3d4a10'}
};
const ATTACHMENTS = [
  {id:'acog',  name:'Lunette ACOG',       mods:{prec:+10, portee:+12, mob:-5}},
  {id:'long',  name:'Canon long',          mods:{portee:+14, prec:+5, mob:-4}},
  {id:'mag',   name:'Chargeur renforcé',   mods:{mag:+50, mob:-3, prec:+3}},
  {id:'stock', name:'Crosse renforcée',    mods:{prec:+8, mob:+2}},
  {id:'laser', name:'Laser (rouge)',       mods:{mob:+8, prec:+4}},
  {id:'brake', name:'Frein de bouche',     mods:{prec:+9, dmg:+2, portee:-2}}
];
const WEAPONS = {
  m4a1:   {cat:'ar', name:'M4A1',        lvl:14, dmg:26, rpm:780, mag:30, auto:true,  prec:78, portee:70, mob:62, kind:'rifle'},
  scarl:  {cat:'ar', name:'SCAR-L',      lvl:12, dmg:29, rpm:660, mag:25, auto:true,  prec:80, portee:72, mob:58, kind:'rifle'},
  acr:    {cat:'ar', name:'ACR',         lvl:12, dmg:27, rpm:720, mag:30, auto:true,  prec:84, portee:74, mob:60, kind:'rifle'},
  mk14:   {cat:'ar', name:'MK 14',       lvl:9,  dmg:42, rpm:420, mag:20, auto:false, prec:86, portee:84, mob:48, kind:'rifle'},
  famas:  {cat:'ar', name:'FAMAS',       lvl:18, dmg:28, rpm:950, mag:25, auto:true,  prec:76, portee:66, mob:66, kind:'bullpup'},
  tar21:  {cat:'ar', name:'TAR-21',      lvl:22, dmg:27, rpm:800, mag:30, auto:true,  prec:79, portee:70, mob:68, kind:'bullpup'},
  ak47:   {cat:'ar', name:'AK-47',       lvl:27, dmg:38, rpm:600, mag:30, auto:true,  prec:70, portee:76, mob:52, kind:'rifle'},
  mp5:    {cat:'smg', name:'MP5',        lvl:4,  dmg:22, rpm:900, mag:30, auto:true,  prec:74, portee:48, mob:82, kind:'smg'},
  uzi:    {cat:'smg', name:'UZI',        lvl:8,  dmg:20, rpm:960, mag:32, auto:true,  prec:64, portee:42, mob:86, kind:'smg'},
  vector: {cat:'smg', name:'Vector',     lvl:16, dmg:21, rpm:1100, mag:33, auto:true, prec:72, portee:46, mob:84, kind:'smg'},
  p90:    {cat:'smg', name:'P90',        lvl:20, dmg:23, rpm:900, mag:50, auto:true,  prec:75, portee:50, mob:80, kind:'bullpup'},
  m870:   {cat:'shotgun', name:'M870',   lvl:6,  dmg:13, rpm:75, mag:6, auto:false, pellets:8, prec:52, portee:26, mob:64, kind:'shotgun'},
  spas12: {cat:'shotgun', name:'SPAS-12',lvl:13, dmg:12, rpm:150,mag:8, auto:true,  pellets:7, prec:54, portee:28, mob:58, kind:'shotgun'},
  aa12:   {cat:'shotgun', name:'AA-12',  lvl:24, dmg:10, rpm:300,mag:20, auto:true, pellets:6, prec:50, portee:24, mob:56, kind:'shotgun'},
  m249:   {cat:'lmg', name:'M249',       lvl:17, dmg:30, rpm:850, mag:100, auto:true, prec:66, portee:80, mob:34, kind:'lmg'},
  pkm:    {cat:'lmg', name:'PKM',        lvl:30, dmg:40, rpm:650, mag:100, auto:true, prec:68, portee:86, mob:28, kind:'lmg'},
  m1911:  {cat:'pistol', name:'M1911',   lvl:1,  dmg:30, rpm:400, mag:8,  auto:false, prec:72, portee:36, mob:92, kind:'pistol'},
  glock18:{cat:'pistol', name:'Glock-18',lvl:3,  dmg:20, rpm:1000,mag:19, auto:true,  prec:62, portee:30, mob:94, kind:'pistol'},
  deagle: {cat:'pistol', name:'Desert Eagle', lvl:11, dmg:55, rpm:200, mag:7, auto:false, prec:78, portee:44, mob:88, kind:'pistol'}
};
const MELEE = [
  {id:'knife',  name:'Couteau',           lvl:1},
  {id:'tknife', name:'Couteau tactique',  lvl:5, bonus:{mob:+6}}
];
const CLASS_STARTERS = { m1911:1, knife:1 };
const SKIN_UNLOCK_LV = 2;

function weaponUnlocked(id){
  const p = App.profile;
  if(CLASS_STARTERS[id]) return true;
  if(p.unlocked.includes(id)) return true;
  const w = WEAPONS[id]; if(!w) return false;
  return p.level >= w.lvl;
}
function standAttCount(p){ return (p._attDemo||[]).length; }
function playerAtts(){ /* attachments unlocked with levels: every 2 levels unlocks one */
  const lv = App.profile.level;
  const n = clamp(1+((lv/2)|0), 1, ATTACHMENTS.length);
  return ATTACHMENTS.slice(0, n-0);
}
function attUnlocked(i){ const p=App.profile; return i < Math.min(ATTACHMENTS.length, 1+((p.level/2)|0)); }

/* get effective stats with attachments + skin */
function effStats(id, attIds){
  const w = WEAPONS[id]; if(!w) return null;
  const s = {dmg:w.dmg, rpm:w.rpm, prec:w.prec, portee:w.portee, mob:w.mob, mag:w.mag, pellets:w.pellets||1, auto:w.auto};
  (attIds||[]).forEach(aid=>{
    const a = ATTACHMENTS.find(x=>x.id===aid); if(!a) return;
    for(const k in a.mods){
      if(k==='mag') s.mag = Math.round(s.mag*(1+a.mods.mag/100));
      else s[k] = clamp(s[k]+a.mods[k], 1, 100);
    }
  });
  return s;
}
const XP_FOR = lv => 400 + (lv-1)*260;

/* ============ TENUES ============ */
const OUTFITS = {
  black:  {name:'Opérateur Noir', price:0,    jacket:'#26282c', vest:'#17181b', helmet:'#1e2023', mask:'#101114', pouch:'#2e3136', pants:'#1c1e21', arm:'#26282c'},
  ghost:  {name:'Fantôme Gris',   price:0,    jacket:'#3b4046', vest:'#23262b', helmet:'#2c3036', mask:'#181a1e', pouch:'#474d54', pants:'#2e3238', arm:'#3b4046'},
  arctic: {name:'Arctique',       price:2500, jacket:'#c3ccd4', vest:'#7c868f', helmet:'#aab4bc', mask:'#20242a', pouch:'#8e99a3', pants:'#9aa5ae', arm:'#c3ccd4'},
  desert: {name:'Désert',         price:2500, jacket:'#b79a5e', vest:'#6d5a34', helmet:'#a08a52', mask:'#3a3226', pouch:'#83703f', pants:'#8a7442', arm:'#b79a5e'},
  forest: {name:'Forêt',          price:3000, jacket:'#44553a', vest:'#2b3724', helmet:'#3a4a30', mask:'#1c241a', pouch:'#4f6243', pants:'#333f2b', arm:'#44553a'},
  hazard: {name:'Uranium',        price:6000, jacket:'#5c6427', vest:'#2f3413', helmet:'#4a5218', mask:'#12140a', pouch:'#767f2f', pants:'#3c421a', arm:'#5c6427'}
};

/* ============ NOTIFICATIONS ============ */
function notify(title, desc){
  const d = document.createElement('div');
  d.className='notif';
  d.innerHTML = '<div class="nt">'+title+'</div>'+(desc?'<div class="nd">'+desc+'</div>':'');
  $('#notif').appendChild(d);
  Sound.beep();
  setTimeout(()=>d.remove(), 5100);
}

/* ============ APP / ÉTAT ============ */
const App = {
  profile:null, accountId:null,
  newProfile(name, mail, pass){
    return {
      name, mail, pass, created:Date.now(),
      xp:0, level:1, cash:750,
      kills:0, deaths:0, extractions:0, loots:0, raidCount:0, bestLoot:0,
      unlocked:[], stash:[],
      attOwned:[], skinsOwned:['none'], skinByWeap:{}, outfitsOwned:['black','ghost'], outfit:'black',
      classes:[
        {name:'Assaut', primary:null, secondary:'m1911', melee:'knife', atts:[]},
        {name:'', primary:null, secondary:null, melee:'knife', atts:[]},
        {name:'', primary:null, secondary:null, melee:'knife', atts:[]},
        {name:'', primary:null, secondary:null, melee:'knife', atts:[]},
        {name:'', primary:null, secondary:null, melee:'knife', atts:[]}
      ], classIdx:0,
      settings:{lang:'fr', sens:50, volGen:70, volMus:60, volSfx:30,
        res:'moy', fog:true, particles:true, fov:75,
        cross:{style:'cross', color:'#ffffff', size:7, thick:2, gap:4, dot:true}},
      notifsSeen:0
    };
  },
  guests:0,
  save(){ LS.set('az_prof_'+this.accountId, this.profile); },
  load(){
    const cur = LS.get('az_current', null);
    if(!cur){ this.showLogin(); return; }
    const p = LS.get('az_prof_'+cur, null);
    if(!p){ this.showLogin(); return; }
    this.accountId = cur; this.profile = p;
    this.showMain();
  },
  showLogin(){ showScreen('scr-login'); },
  showMain(){
    showScreen('scr-main');
    $('#mm-pseudo').textContent = this.profile.name.toUpperCase();
    $('#mm-lvl').textContent = this.profile.level;
    Sound.init(); Sound.apply();
    if(!App.menuMusicStarted){ App.menuMusicStarted=true; Sound.music(true); }
    drawAvatar($('#mm-avatar'));
    updateOnline();
    refreshBell();
  },
  addXP(n){
    const p=this.profile;
    p.xp += n;
    let up=false;
    while(p.xp >= XP_FOR(p.level)){ p.xp -= XP_FOR(p.level); p.level++; up=true;
      // niveau >= lvl d'une arme => notification
      WEAPONS && Object.keys(WEAPONS).forEach(id=>{
        if(WEAPONS[id].lvl===p.level) notify('ARME DÉBLOQUÉE', WEAPONS[id].name+' est disponible dans l\u2019Armurerie.');
      });
      MELEE.forEach(m=>{ if(m.lvl===p.level && m.lvl>1) notify('ÉQUIPEMENT DÉBLOQUÉ', m.name+'.'); });
      if(attUnlocked(Math.min(ATTACHMENTS.length-1, 1+((p.level)/2)|0)) && p.level%2===0){
        const a = ATTACHMENTS[Math.min(ATTACHMENTS.length-1, 1+((p.level/2)|0))-1];
        if(a) notify('ACCESSOIRE DÉBLOQUÉ', a.name+'.');
      }
    }
    if(up) notify('NIVEAU SUPÉRIEUR', 'Vous êtes passé niveau '+p.level+'.');
    this.save();
  },
  addCash(n){ this.profile.cash=Math.max(0,this.profile.cash+n); this.save(); }
};

function showScreen(id){
  $$('.screen').forEach(s=>s.classList.remove('active'));
  $('#'+id).classList.add('active');
  const inGame = id==='game-wrap';
  $('#menuFx').style.visibility = inGame?'hidden':'visible';
  if(id==='scr-armory') buildArmory();
  if(id==='scr-classes') buildClasses();
  if(id==='scr-settings') buildSettings();
  if(id==='scr-operator') buildOperator();
  if(id==='scr-progress') buildProgress();
  if(id==='scr-shop'){ $('#shop-cash').textContent=fmtN(App.profile.cash); buildShop(); }
  if(id==='scr-stash') buildStash();
  if(id==='scr-deploy') drawIsland();
}

/* ============ COMPTE À JOUR EN LIGNE ============ */
function onlineNow(){
  const d = new Date();
  const dayT = (d.getHours()*60+d.getMinutes())/1440;
  const base = 9300 + 4200*Math.sin(Math.PI*(dayT-0.32)/0.86);
  const wobble = 160*Math.sin(d.getTime()/42000) + 90*Math.sin(d.getTime()/9100);
  return Math.max(1800, Math.round((base+wobble)/7)*7);
}
function updateOnline(){ const el=$('#online-count'); if(el) el.textContent=fmtN(onlineNow()); }
setInterval(updateOnline, 4000);

function refreshBell(){
  const p=App.profile;
  const unseen = (WEAPONS && Object.keys(WEAPONS).some(id=>p.level>=WEAPONS[id].lvl && !p.notifsSeen));
  $('#bell-dot').hidden = !(p.notifsSeen===0);
}

/* ============ LOGIN ============ */
(function initLogin(){
  const tabs=$$('.ltab');
  const flip=(t)=>{
    tabs.forEach(b=>b.classList.toggle('active', b.dataset.t===t));
    $('#form-login').hidden = t!=='login';
    $('#form-signup').hidden = t!=='signup';
    $('#login-err').textContent='';
  };
  tabs.forEach(b=>b.onclick=()=>{ Sound.init(); Sound.click(); flip(b.dataset.t); });
  $('#btn-guest').onclick=()=>{
    Sound.init(); Sound.click();
    App.guests++; const id='guest_'+Date.now();
    const g=App.newProfile('INVITÉ'+App.guests, '', '');
    App.accountId=id; App.profile=g;
    LS.set('az_prof_'+id, g); LS.set('az_current', id);
    App.showMain();
  };
  $('#form-login').onsubmit=(e)=>{
    e.preventDefault(); Sound.init();
    const idv=$('#li-id').value.trim().toLowerCase();
    const pw=$('#li-pass').value;
    const accs=LS.get('az_accounts', {});
    let found=null;
    for(const k in accs){ const a=accs[k];
      if((a.mail && a.mail.toLowerCase()===idv) || a.name.toLowerCase()===idv){ found=k; break; }
    }
    if(!found){ $('#login-err').textContent='Compte introuvable.'; return; }
    const p=LS.get('az_prof_'+accs[found].pid, null);
    if(!p || p.pass!==pw){ $('#login-err').textContent='Mot de passe incorrect.'; return; }
    LS.set('az_current', accs[found].pid);
    App.accountId=accs[found].pid; App.profile=p;
    App.showMain();
  };
  $('#form-signup').onsubmit=(e)=>{
    e.preventDefault(); Sound.init();
    const name=$('#su-name').value.trim();
    const mail=$('#su-mail').value.trim();
    const p1=$('#su-pass').value, p2=$('#su-pass2').value;
    if(p1!==p2){ $('#login-err').textContent='Les mots de passe ne correspondent pas.'; return; }
    if(name.length<3){ $('#login-err').textContent='Le pseudo doit faire au moins 3 caractères.'; return; }
    const accs=LS.get('az_accounts', {});
    for(const k in accs) if(accs[k].mail.toLowerCase()===mail.toLowerCase() || accs[k].name.toLowerCase()===name.toLowerCase()){
      $('#login-err').textContent='Pseudo ou e-mail déjà utilisé.'; return;
    }
    const pid='u_'+Date.now();
    accs['id'+pid]={name, mail, pid};
    LS.set('az_accounts', accs);
    const prof=App.newProfile(name, mail, p1);
    LS.set('az_prof_'+pid, prof); LS.set('az_current', pid);
    App.accountId=pid; App.profile=prof;
    App.showMain();
    notify('COMPTE CRÉÉ', 'Bienvenue '+' '+name+' !');
  };
})();

/* ============ DESSIN D'ARMES (SVG-like canvas) ============ */
function drawWeaponIcon(cv, id, skinId){
  const w = WEAPONS[id];
  const ctx = cv.getContext('2d');
  const Wc=cv.width, Hc=cv.height;
  ctx.clearRect(0,0,Wc,Hc);
  const sk = SKINS[skinId] || SKINS.none;
  const c1=sk.c1, c2=sk.c2, c3=sk.c3, acc=sk.acc;
  const s = Wc/160;
  const R=(x,y,ww,hh,c)=>{ ctx.fillStyle=c; ctx.fillRect(x*s, y*s, ww*s, hh*s); };
  ctx.save();
  ctx.translate(Wc/2 - 80*s, Hc/2 - 20*s);
  const kind = w? w.kind : 'rifle';
  if(kind==='rifle' || kind==='bullpup'){
    R(30,16,80,9,c1);           // corps
    R(14,18,22,5,c3);           // canon
    R(6,15,12,3,c2);            // bouche
    if(kind==='rifle'){ R(96,14,26,7,c2); R(112,12,16,9,c2); } // crosse
    else { R(88,10,30,14,c1); R(30,24,14,14,c2); }             // bullpup poignée + chargeur avant
    R(56,25,12,17,c2);          // chargeur
    R(74,25,7,10,acc);          // poignée
    if(w && w.prec>80){ R(50,8,26,6,c3); }                     // lunette
    R(46,13,8,4,c3);            // viseur avant
  } else if(kind==='smg'){
    R(30,16,64,10,c1);
    R(12,18,20,6,c3);
    R(2,16,12,4,c2);
    R(92,17,20,6,c2); R(104,15,10,5,c3);
    R(52,26,10,20,c2);
    R(68,26,7,9,acc);
    R(34,12,18,5,c3);
  } else if(kind==='shotgun'){
    R(30,16,86,8,c1);
    R(10,24,70,5,c3);           // tube
    R(0,18,14,5,c2);
    R(98,14,24,8,c2); R(112,13,14,7,c2);
    R(40,24,10,9,'#6b4a2a');    // garde bois
    R(70,25,7,9,acc);
  } else if(kind==='lmg'){
    R(26,15,78,11,c1);
    R(10,17,18,6,c3);
    R(0,16,12,4,c2);
    R(96,13,26,9,c2);
    R(46,26,16,16,c2);          // boîte bande
    R(70,26,8,10,acc);
    R(36,30,3,14,c2); R(88,30,3,14,c2); // bipied
  } else if(kind==='pistol'){
    R(48,18,44,9,c1);
    R(28,20,22,6,c3);
    R(62,27,8,14,c2);           // poignée
    R(92,18,6,5,c3);
    R(54,24,4,3,'#fff');
  }
  ctx.restore();
}

/* ============ TOAST AVATAR ============ */
function drawAvatar(cv){
  const o = OUTFITS[App.profile.outfit] || OUTFITS.black;
  const c=cv.getContext('2d'), W2=cv.width, H2=cv.height;
  c.clearRect(0,0,W2,H2); c.fillStyle=o.helmet;
  c.fillRect(3,2,20,14);
  c.fillStyle=o.mask; c.fillRect(5,14,16,10);
  c.fillStyle='#3d81c4'; c.fillRect(7,16,5,4);
  c.fillStyle=o.jacket; c.fillRect(1,25,24,10);
}

/* ============ MENU PRINCIPAL ============ */
$$('#mm-menu .mm-btn').forEach(b=>{
  b.onclick=()=>{ Sound.init(); Sound.click();
    const go=b.dataset.go;
    if(go==='play') showScreen('scr-deploy');
    else if(go==='multi'){ notify('MULTIJOUER', 'Les serveurs sont en maintenance. Les missions DMZ avec escouade IA restent disponibles.'); }
    else if(go==='settings') showScreen('scr-settings');
    else if(go==='progress') showScreen('scr-progress');
    else if(go==='shop') showScreen('scr-shop');
    else if(go==='quit'){ Sound.music(false); if(App.profile) App.save(); $('#scr-main').classList.remove('active'); showScreen('scr-login'); }
  };
});
$('#mm-profile').onclick=()=>showScreen('scr-operator');
$('#mm-cog').onclick=()=>showScreen('scr-settings');
$('#mm-bell').onclick=()=>{ App.profile.notifsSeen=1; refreshBell(); App.save();
  const lvls=[];
  Object.keys(WEAPONS).forEach(id=>{ if(App.profile.level>=WEAPONS[id].lvl) lvls.push(WEAPONS[id].name); });
  notify('NOTIFICATIONS', 'Armes débloquées : '+ (lvls.length? lvls.join(', ') : 'aucune pour le moment.'));
};
$$('.btn-back').forEach(b=>b.onclick=()=>{ Sound.click(); App.showMain(); });
$('#btn-armory').onclick=()=>showScreen('scr-armory');
