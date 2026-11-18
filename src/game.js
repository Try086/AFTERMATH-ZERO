'use strict';
/* ============ MOTEUR DE JEU DMZ ============ */
function mulberry(seed){ let a=seed>>>0; return function(){ a|=0; a=a+0x6D2B79F5|0;
  let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

const Res = W => W.res==='basse'?[320,180]:W.res==='haute'?[640,360]:[480,270];

/* textures procédurales 64x64 */
function makeTex(draw){
  const cv=document.createElement('canvas'); cv.width=64; cv.height=64;
  const c=cv.getContext('2d'); draw(c); return cv;
}
function noiseTex(base, spec, n, seed){
  return makeTex(c=>{
    c.fillStyle=base; c.fillRect(0,0,64,64);
    let r=seed;
    const rnd=()=>{ r=(r*16807)%2147483647; return r/2147483647; };
    c.fillStyle=spec;
    for(let i=0;i<n;i++){ c.fillRect((rnd()*64)|0,(rnd()*64)|0,2,2); }
    c.strokeStyle='rgba(0,0,0,0.25)';
    c.strokeRect(0.5,0.5,63,63);
  });
}
const TEX = [];
TEX[1]=noiseTex('#7d8088','#6d7078',90,7);   // béton ruiné
TEX[2]=noiseTex('#6e5642','#5c4636',80,13);  // brique village
TEX[3]=noiseTex('#b5a072','#9c8858',80,29);  // adobe / sable
TEX[4]=noiseTex('#4d565f','#3c444c',70,41);  // métal base
TEX[5]=noiseTex('#5d6068','#4a4d55',120,57); // béton sombre
TEX[6]=noiseTex('#3a3f46','#2e3238',60,71);  // métal sombre
TEX[7]=noiseTex('#5d6544','#4c5338',90,83);  // bois

/* sprites */
function makeSprite(w,h,draw){
  const cv=document.createElement('canvas'); cv.width=w; cv.height=h;
  draw(cv.getContext('2d'), w, h); return cv;
}
function soldierSprite(outfit, ally){
  return makeSprite(64,128,(c)=>{
    const o=ally?{jacket:'#2c3546',vest:'#1a212e',helmet:'#232c3c',mask:'#12161e',pouch:'#37455c',pants:'#20293a',arm:'#2c3546'}:outfit;
    // jambes
    c.fillStyle=o.pants; c.fillRect(22,96,8,32); c.fillRect(34,96,8,32);
    c.fillStyle='#141518'; c.fillRect(20,124,12,4); c.fillRect(32,124,12,4);
    // torse
    c.fillStyle=o.jacket; c.fillRect(16,56,32,42);
    // gilet
    c.fillStyle=o.vest; c.fillRect(18,58,28,30);
    c.fillStyle=o.pouch; c.fillRect(21,66,7,12); c.fillRect(31,66,7,12); c.fillRect(41,66,7,12);
    // bras
    c.fillStyle=o.arm; c.fillRect(8,58,8,34); c.fillRect(48,58,8,34);
    // tête
    c.fillStyle=o.mask; c.fillRect(24,34,16,20);
    c.fillStyle=o.helmet; c.fillRect(22,28,20,10);
    c.fillStyle='#3d81c4'; c.fillRect(27,40,10,4);
    if(ally){ c.fillStyle='#3d81c4'; c.fillRect(50,60,6,14); }
    // arme
    c.fillStyle='#17181c'; c.fillRect(14,78,36,5);
    c.fillRect(2,80,12,3);
  });
}
const SPR = {};
function buildSprites(){
  SPR.enemy=soldierSprite(OUTFITS.black,false);
  SPR.enemyN=soldierSprite(OUTFITS.arctic,false);
  SPR.enemyD=soldierSprite(OUTFITS.desert,false);
  SPR.ally=soldierSprite(null,true);
  const cr=(c,col,glow)=>{ c.fillStyle='#4a3c26'; c.fillRect(10,34,44,26);
    c.fillStyle='#5d4c30'; c.fillRect(10,34,44,8);
    c.strokeStyle='#2c2416'; c.strokeRect(10,34,44,26);
    c.fillStyle=col; c.fillRect(26,44,12,8);
    c.globalAlpha=0.5; c.fillStyle=glow; c.beginPath(); c.arc(32,46,22,0,Math.PI*2); c.fill(); };
  SPR.lootW=makeSprite(64,64,c=>cr(c,'#f0862c','#f0862c'));
  SPR.lootA=makeSprite(64,64,c=>{ c.fillStyle='#3a4550'; c.fillRect(14,36,36,24);
    c.fillStyle='#5b9bd5'; c.fillRect(14,36,36,6); });
  SPR.lootC=makeSprite(64,64,c=>{ c.fillStyle='#20502e'; c.fillRect(16,40,32,20);
    c.fillStyle='#39d465'; c.font='bold 18px sans-serif'; c.fillText('$',28,56); });
  SPR.lootK=makeSprite(64,64,c=>{ c.fillStyle='#8a2430'; c.fillRect(14,36,36,24); c.fillStyle='#ff8a90'; c.fillRect(14,36,36,6); });
  SPR.lootR=makeSprite(64,64,c=>{ c.fillStyle='#8a6a12'; c.fillRect(14,36,36,24); c.fillStyle='#ffd24a'; c.fillRect(14,36,36,6); });
  SPR.barrel=makeSprite(48,80,c=>{ c.fillStyle='#5d3a2a'; c.fillRect(6,8,36,68);
    c.fillStyle='#4a2e20'; c.fillRect(6,30,36,8); c.fillRect(6,54,36,8);
    c.fillStyle='#6d4634'; c.fillRect(6,8,36,6); });
  SPR.box=makeSprite(48,48,c=>{ c.fillStyle='#6b5a3a'; c.fillRect(4,10,40,34);
    c.strokeStyle='#4a3c26'; c.strokeRect(4,10,40,34); c.strokeRect(4,10,20,17); });
  SPR.pine=makeSprite(80,160,c=>{ c.fillStyle='#3d3126'; c.fillRect(36,130,10,30);
    c.fillStyle='#2e4a2e';
    for(let i=0;i<4;i++){ c.beginPath(); c.moveTo(40,10+i*32); c.lineTo(8,52+i*32); c.lineTo(72,52+i*32); c.closePath(); c.fill(); }
    c.fillStyle='#e8eef2'; c.globalAlpha=0.25;
    c.beginPath(); c.moveTo(40,10); c.lineTo(16,52); c.lineTo(64,52); c.closePath(); c.fill(); });
  SPR.palm=makeSprite(90,160,c=>{ c.strokeStyle='#6b5330'; c.lineWidth=7;
    c.beginPath(); c.moveTo(45,158); c.quadraticCurveTo(40,80,52,20); c.stroke();
    c.strokeStyle='#4a6b2a'; c.lineWidth=5;
    for(let i=0;i<6;i++){ const a=i/6*Math.PI*2;
      c.beginPath(); c.moveTo(52,20); c.quadraticCurveTo(52+Math.cos(a)*30,28+Math.sin(a)*14, 52+Math.cos(a)*44, 24+Math.abs(Math.sin(a))*16+10);
      c.stroke(); } });
  SPR.heli=makeSprite(160,100,c=>{
    c.fillStyle='#23262b'; c.fillRect(30,44,84,24);
    c.beginPath(); c.moveTo(30,44); c.quadraticCurveTo(10,52,4,66); c.lineTo(30,66); c.closePath(); c.fill();
    c.fillStyle='#31353c'; c.fillRect(96,40,50,12);
    c.fillStyle='#1c1e22'; c.fillRect(114,52,12,16);
    c.fillStyle='#0e1116'; c.fillRect(50,48,20,12);
    c.fillStyle='#39dbe0'; c.globalAlpha=0.5; c.fillRect(52,50,16,4);
  });
}
function heliBlur(c,x,y,rad,len){
  c.save(); c.translate(x,y);
  c.strokeStyle='rgba(20,22,26,0.65)'; c.lineWidth=3;
  for(let i=0;i<2;i++){
    const a=Game.time*20+i*Math.PI;
    c.beginPath(); c.moveTo(-Math.cos(a)*rad, -Math.sin(a)*rad*0.22);
    c.lineTo(Math.cos(a)*rad, Math.sin(a)*rad*0.22); c.stroke();
  }
  c.restore();
}

/* ============ MONDE ============ */
const N=200;
const Game = {
  map:null, seenMap:null, curZone:'centre', running:false,
  time:0, zoneKey:'centre', saved:false,
  start(zoneKey){
    this.zoneKey=zoneKey;
    Sound.music(false); Sound.init();
    buildSprites();
    this.genWorld(zoneKey);
    this.resetPlayer(zoneKey);
    $('#scr-deploy').classList.remove('active');
    $('#game-wrap').hidden=false;
    // any screen
    $$('.screen').forEach(s=>s.classList.remove('active'));
    document.exitPointerLock && document.exitPointerLock();
    this.running=true; this.cine=null; this.paused=false; this.heli=null; this.saved=false; this.finishing=false;
    this.lastT=performance.now();
    requestAnimationFrame(t=>this.loop(t));
    notify('RAID ENGAG\u00c9', ZONES[zoneKey].name+'. Lootz et rejoignez un LZ vert pour exfiltrer.');
    const gc=$('#gc'); gc.onclick=()=>{ if(!this.paused&&!this.cine) gc.requestPointerLock&&gc.requestPointerLock(); };
  },
  resetPlayer(zk){
    const p=this.player={
      x:0,y:0,ang:0, hp:100,armor:0,down:false,bleed:0, kits:1,
      weapons:[], wi:0, reserve:'', mag:'', reloading:0, fireT:0, ads:false, adsT:0,
      recoil:0, bob:0, sprint:false, z:0, lootCash:0, lootCount:0, revived:0, kills:0
    };
    const zc={nord:[60,24], ouest:[30,104], centre:[100,101], village:[172,104], sud:[100,172]}[zk];
    let pos=this.findOpen(0.4), tries=0;
    while(tries<40){
      pos=this.findOpen(0.4); tries++;
      if(Math.hypot(pos.x-zc[0],pos.y-zc[1])<14) break;
    }
    p.x=pos.x; p.y=pos.y; p.ang=Math.atan2(N/2-p.y, N/2-p.x);
    const cls=App.profile.classes[App.profile.classIdx];
    const list=[];
    if(cls.primary && weaponUnlocked(cls.primary)) list.push(cls.primary);
    list.push(cls.secondary||'m1911');
    p.weapons=list.map(id=>({id, mag:effStats(id,cls.atts).mag, reserve:120, s:effStats(id,cls.atts)}));
    p.wi=0; p.attIds=cls.atts;
    p.kits=1;
    // alliés
    this.allies=[]; 
    for(let i=0;i<2;i++) this.allies.push({name:i===0?'BRAVO':'CHARLIE', x:p.x+ (i?1.5:-1.5), y:p.y+1.5, ang:0, hp:100, down:false, alive:true, revT:0, fireCd:2, target:null, followAng:0});
    // ennemis & loot sont générés dans genWorld
  },
  findOpen(rad){
    for(let i=0;i<400;i++){
      const x=(Math.random()*(N-8)+4)|0, y=(Math.random()*(N-8)+4)|0;
      if(this.isOpen(x+0.5,y+0.5,rad)) return {x:x+0.5, y:y+0.5};
    }
    return {x:N/2, y:N/2};
  },
  isOpen(x,y,r){
    for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){
      const cx=(x+dx*r)|0, cy=(y+dy*r)|0;
      if(cx<0||cy<0||cx>=N||cy>=N) return false;
      if(this.map[cy*N+cx]) { // mur
        if(Math.abs(x-cx-0.5)<0.5+r && Math.abs(y-cy-0.5)<0.5+r) return false;
      }
    }
    return true;
  },
  zoneAt(x,y){
    if(y<64) return {id:'nord', name:'ZONE NORD (BASE)'};
    if(y>140) return {id:'sud', name:'ZONE SUD'};
    if(x>136) return {id:'village', name:'VILLAGE (EST)'};
    if(x<64) return {id:'ouest', name:'ZONE OUEST (ZO)'};
    return {id:'centre', name:'VILLE EN RUINES'};
  },
  genWorld(zk){
    const m=new Uint8Array(N*N);
    this.map=m;
    const set=(x,y,v)=>{ if(x>0&&y>0&&x<N-1&&y<N-1) m[y*N+x]=v; };
    // pourtout bord
    for(let i=0;i<N;i++){ set(i,0,7); set(i,N-1,7); set(0,i,7); set(N-1,i,7); }
    const rnd=mulberry(1337+zk.length*77);
    const house=(cx,cy,w,h,tex,doors)=>{
      for(let x=cx;x<cx+w;x++){ set(x,cy,tex); set(x,cy+h-1,tex); }
      for(let y=cy;y<cy+h;y++){ set(cx,y,tex); set(cx+w-1,y,tex); }
      for(let i=0;i<doors;i++){
        const side=(rnd()*4)|0;
        if(side===0){ const x=cx+1+((rnd()*(w-2))|0); set(x,cy,0); }
        else if(side===1){ const x=cx+1+((rnd()*(w-2))|0); set(x,cy+h-1,0); }
        else if(side===2){ const y=cy+1+((rnd()*(h-2))|0); set(cx,y,0); }
        else { const y=cy+1+((rnd()*(h-2))|0); set(cx+w-1,y,0); }
      }
      // loot interior
      for(let i=0;i<1+(rnd()*2|0);i++){
        const lx=cx+1.5+rnd()*(w-3), ly=cy+1.5+rnd()*(h-3);
        if(this.isOpen(lx,ly,0.3)) this.lootP.push(this.makeLoot(lx,ly,tex));
      }
    };
    this.lootP=[];
    // VILLE en ruines (centre)
    for(let i=0;i<30;i++){
      const cx=66+((rnd()*60)|0), cy=66+((rnd()*60)|0);
      house(cx,cy,4+(rnd()*6|0),4+(rnd()*6|0), rnd()<0.5?1:5, 1+(rnd()*2|0));
    }
    // OUEST ZO
    for(let i=0;i<18;i++){
      const cx=8+((rnd()*48)|0), cy=70+((rnd()*60)|0);
      house(cx,cy,5+(rnd()*7|0),4+(rnd()*5|0), rnd()<0.5?5:4, 2);
    }
    // VILLAGE est
    for(let i=0;i<16;i++){
      const cx=142+((rnd()*44)|0), cy=70+((rnd()*60)|0);
      house(cx,cy,4+(rnd()*4|0),4+(rnd()*4|0), 2, 1);
    }
    // église
    house(160,66,7,9,2,2);
    // BASE nord
    for(let i=0;i<12;i++){
      const cx=10+((rnd()*160)|0), cy=6+((rnd()*44)|0);
      house(cx,cy,5+(rnd()*6|0),4+(rnd()*5|0), rnd()<0.6?4:6, 2);
    }
    // SUD avant-postes
    for(let i=0;i<12;i++){
      const cx=10+((rnd()*160)|0), cy=148+((rnd()*40)|0);
      house(cx,cy,4+(rnd()*4|0),4+(rnd()*4|0), 3, 1);
    }
    // eau (étang est + rivière ouest)
    for(let i=0;i<250;i++){
      const a=rnd()*Math.PI*2, r=rnd()*7;
      set((156+Math.cos(a)*r)|0,(116+Math.sin(a)*r*0.6)|0,7);
    }
    for(let i=0;i<40;i++) set((30+ Math.sin(i)*3)|0, 20+i, 7);
    // rochers / débris島
    for(let i=0;i<220;i++){
      const x=(2+rnd()*(N-4))|0, y=(2+rnd()*(N-4))|0;
      if(zk==='nord'&&y>64) continue;
      if(!m[y*N+x] && rnd()<0.4) set(x,y, rnd()<0.7?5:1);
    }
    // LZ clairés
    this.LZs=[
      {x:100,y:24, name:'LZ BASE NORD'},
      {x:48,y:132, name:'LZ VILLE'},
      {x:150,y:110, name:'LZ VILLAGE'}
    ];
    this.LZs.forEach(lz=>{
      for(let x=lz.x-4;x<=lz.x+4;x++) for(let y=lz.y-4;y<=lz.y+4;y++){ m[(y|0)*N+(x|0)]=0; }
    });
    // ennemis
    this.enemies=[];
    const spawnZone=(x0,y0,x1,y1,cnt,spr,dmg)=>{
      for(let i=0;i<cnt;i++){
        let e, tries=0;
        do{ e=this.findOpen(0.3); tries++; }while(tries<20 && !(e.x>=x0&&e.x<=x1&&e.y>=y0&&e.y<=y1));
        if(!(e.x>=x0&&e.x<=x1&&e.y>=y0&&e.y<=y1)) continue;
        this.enemies.push({x:e.x,y:e.y,ang:rnd()*6.28,hp:100,spr, state:'patrol', tx:e.x,ty:e.y,
          fireCd:rnd()*3, dmg, dead:false, deadT:0, hurtT:0, home:{x:e.x,y:e.y}});
      }
    };
    spawnZone(2,2,198,64,26,SPR.enemyN,9);
    spawnZone(2,68,62,138,22,SPR.enemy,7);
    spawnZone(66,68,134,138,26,SPR.enemy,8);
    spawnZone(140,68,198,138,18,SPR.enemy,8);
    spawnZone(2,144,198,198,16,SPR.enemyD,7);
    // loot aussi extérieur caisses
    for(let i=0;i<70;i++){ const e=this.findOpen(0.3);
      this.lootP.push(this.makeLoot(e.x,e.y,2));
    }
    // props
    this.props=[];
    for(let i=0;i<160;i++){ const e=this.findOpen(0.35);
      if(e.y<64) this.props.push({x:e.x,y:e.y,spr:SPR.pine,scale:1.6,solid:true});
      else if(e.y>146) this.props.push({x:e.x,y:e.y,spr:SPR.palm,scale:1.7,solid:true});
      if(rnd()<0.5){ const e2=this.findOpen(0.3); this.props.push({x:e2.x,y:e2.y,spr:rnd()<0.5?SPR.barrel:SPR.box,scale:0.8,solid:true}); }
    }
  },
  makeLoot(x,y,tex){
    const r=Math.random();
    let type;
    if(tex===2) type = r<0.35?'weapon': r<0.55?'ammo': r<0.75?'cash': r<0.9?'armor':'kit';
    else if(tex===4) type = r<0.4?'weapon': r<0.6?'ammo': r<0.8?'armor':'cash';
    else type = r<0.22?'weapon': r<0.45?'ammo': r<0.65?'cash': r<0.8?'armor': r<0.9?'kit':'revive';
    return {x,y,type, spr: type==='weapon'?SPR.lootW: type==='ammo'?SPR.lootA: type==='cash'?SPR.lootC: (type==='armor')?SPR.lootK: (type==='kit')?SPR.lootK: SPR.lootR};
  },
  loop(t){
    if(!this.running) return;
    requestAnimationFrame(tt=>this.loop(tt));
    let dt=(t-this.lastT)/1000; this.lastT=t;
    if(dt>0.06) dt=0.06;
    if(!this.paused){
      this.time+=dt;
      this.update(dt);
    }
    this.render();
    this.hud(dt);
  },
    update(dt){
    const p=this.player;
    if(this.cine){ this.cine.t+=dt; if(this.cine.t>4.4){ this.finish(true); } return; }
    // input
    const k=this.keys||{}, sens=(App.profile.settings.sens/100)*0.0025+0.001;
    let dx=0,dy=0;
    if(k.KeyW||k.ArrowUp)dy+=1;
    if(k.KeyS||k.ArrowDown)dy-=1;
    if(k.KeyA||k.ArrowLeft)dx-=1;
    if(k.KeyD||k.ArrowRight)dx+=1;
    p.sprint=(k.ShiftLeft||k.ShiftRight)&&dy>0&&!p.ads;
    const spd=(p.down?0.7:p.sprint?4.4:2.6)*(p.reloading>0?0.8:1);
    if(!p.down&&(dx||dy)){
      const l=Math.hypot(dx,dy), ca=Math.cos(p.ang), sa=Math.sin(p.ang);
      const f=dy/l, st=dx/l;
      const mx=ca*f - sa*st;
      const my=sa*f + ca*st;
      this.move(p, mx*spd*dt, my*spd*dt);
      p.bob+=dt*(p.sprint?13:8);
    }
    // ADS
    p.adsT += (p.ads?1:-1)*dt*6; p.adsT=clamp(p.adsT,0,1);
    // recoil decay
    p.recoil=Math.max(0,p.recoil-dt*4);
    // feu
    const w=p.weapons[p.wi];
    if(p.fireHold && w && !p.down && p.reloading<=0 && w.s && w.s.auto){
      w.s=w.s||effStats(w.id,p.attIds);
      if(this.time-p.fireT>60/w.s.rpm){
        if(w.mag>0){ this.shoot(); p.fireT=this.time; }
      }
    }
    if(p.reloading>0){ p.reloading-=dt; if(p.reloading<=0){ 
      const need=w.s.mag-w.mag;
      const take=Math.min(need,w.reserve);
      w.mag+=take; w.reserve-=take; Sound.reload();
    }}
    // helm / rotate handled par mouse
    // alliés & ennemis
    this.updateAllies(dt);
    this.updateEnemies(dt);
    // loot proximity
    p.nearLoot=null;
    if(!p.down){ for(const L of this.lootP){ if(L.taken) continue;
      const d2=(L.x-p.x)**2+(L.y-p.y)**2;
      if(d2<1.44){ p.nearLoot=L; this.interactTxt(this.lootName(L)); break; }
    }}
    if(!p.nearLoot){ $('#interact').hidden = true; }
    // LZ / extraction
    let lz=null;
    for(const L of this.LZs){ const d=Math.hypot(L.x-p.x,L.y-p.y); if(d<3.5){ lz=L; break; } }
    this.nearLZ=lz;
    if(lz && !this.heli){
      this.interactTxt('F — APPELER L\u2019EXFILTRATION');
      $('#interact').hidden=false;
      if(k.KeyF){ this.callExfil(lz); }
    }
    if(this.heli) this.updateHeli(dt);
    // zone label
    const z=this.zoneAt(p.x,p.y);
    if(z.name!==this.curZone){ this.curZone=z.name; $('#hud-zone').textContent=z.name.toUpperCase(); }
    // downed
    if(p.down){
      p.bleed-=dt;
      $('#bleed-fill').style.width=clamp(p.bleed/60*100,0,100)+'%';
      if(p.bleed<=0) this.finish(false);
    }
  },
  move(o, mx, my){
    const r=0.22;
    const nx=o.x+mx, ny=o.y+my;
    if(this.isOpen(nx,o.y,r)) o.x=nx;
    if(this.isOpen(o.x,ny,r)) o.y=ny;
  },
  interactTxt(t){ $('#interact').hidden=false; $('#interact-txt').textContent=t; },
  lootName(L){
    if(L.type==='weapon'){ const id=this.rollWeapon(); return 'Ramasser : '+WEAPONS[id].name; }
    return {ammo:'Ramasser : munitions', cash:'Ramasser : Argent', armor:'Ramasser : plaque de gilet', kit:'Ramasser : kit de soin', revive:'Ramasser : KIT DE R\u00c9ANIMATION'}[L.type];
  },
  rollWeapon(){
    const pool=Object.keys(WEAPONS);
    return pool[(Math.random()*pool.length)|0];
  },
  shoot(){
    const p=this.player, w=p.weapons[p.wi];
    w.s=w.s||effStats(w.id,p.attIds);
    w.mag--;
    p.recoil=Math.min(1,p.recoil+0.25);
    p.bob+=0.7;
    Sound.shot(WEAPONS[w.id].kind==='pistol'?'pistol':WEAPONS[w.id].kind);
    p.flash=0.05;
    // hit-scan
    const pellets=w.s.pellets||1;
    for(let i=0;i<pellets;i++){
      const spread=(100-w.s.prec)*0.0022*(p.ads?0.35:1)+p.recoil*0.012+(p.sprint?0.02:0);
      const a=p.ang+(Math.random()-0.5)*spread*(pellets>1?6:1);
      this.rayHit(p.x,p.y,a,w.s);
    }
    // characters react
    this.alertNear(p.x,p.y,14);
  },
  rayHit(x,y,a,w){
    // murs
    const dist=this.castWall(x,y,a);
    // cibles (ennemis) : angle/distance
    let best=null, bestD=dist;
    for(const e of this.enemies){ if(e.dead) continue;
      const dx=e.x-x, dy=e.y-y;
      const d=Math.hypot(dx,dy);
      let da=Math.atan2(dy,dx)-a;
      da=Math.atan2(Math.sin(da),Math.cos(da));
      const halfSize=Math.atan2(0.32, Math.max(0.5,d));
      if(Math.abs(da)<halfSize && d<bestD){ best=e; bestD=d; }
    }
    for(const al of this.allies){ if(!al.alive||al.down) continue;
      const dx=al.x-x, dy=al.y-y, d=Math.hypot(dx,dy);
      if(d<0.1) continue;
      let da=Math.atan2(dy,dx)-a; da=Math.atan2(Math.sin(da),Math.cos(da));
      const halfSize=Math.atan2(0.32,Math.max(0.5,d));
      if(Math.abs(da)<halfSize && d<bestD){ // friendly fire désactivé, mais bloque
        return;
      }
    }
    if(best){
      const falloff=clamp(1-(Math.max(0,bestD-w.portee*0.6))/40,0.35,1);
      const dmg=w.dmg*falloff*(Math.random()<0.18?1.7:1);
      best.hp-=dmg; best.hurtT=0.15; best.state='fight'; best.tx=x; best.ty=y; best.seeT=this.time;
      this.showHit();
      Sound.hit();
      if(best.hp<=0){ best.dead=true; best.deadT=0; p.kills++; App.profile.kills++;
        App.addXP(25); Sound.kill();
        // drop
        if(Math.random()<0.5){ const r=Math.random();
          this.lootP.push(this.makeLoot(best.x,best.y, r<0.5?2:1));
        }
      }
    }
  },
  castWall(x,y,a){
    const ca=Math.cos(a), sa=Math.sin(a);
    let mx=x,my=y;
    const step=0.05;
    for(let d=0;d<50;d+=step){ mx+=ca*step; my+=sa*step;
      if(this.map[(my|0)*N+(mx|0)]) return d;
    }
    return 50;
  },
  alertNear(x,y,r){
    for(const e of this.enemies){ if(e.dead) continue;
      const d=Math.hypot(e.x-x,e.y-y);
      if(d<r && Math.random()<0.8){ e.state='search'; e.tx=x; e.ty=y; e.seeT=this.time; }
    }
  },
  showHit(){ const h=$('#hitmark'); h.hidden=false; setTimeout(()=>h.hidden=true,90); },
  damagePlayer(dmg, from){
    const p=this.player;
    if(p.down||this.cine) return;
    if(p.armor>0){ const abs=Math.min(p.armor, dmg*0.6); p.armor-=abs; dmg-=abs; }
    p.hp-=dmg;
    Sound.hurt();
    if(p.hp<=0){
      p.hp=0;
      if(p.kits_used===undefined) p.kits_used=0;
      p.down=true; p.bleed=60; p.downAt=this.time;
      $('#downed-ui').hidden=false;
      $('#down-kit').hidden = p.kits<=0;
      $('#down-sub').textContent = this.allies.some(a=>a.alive&&!a.down)? 'Un allié peut vous réanimer...' : 'Plus d\u2019alliés debout — utilisez le kit ou la partie est finie.';
      if(p.kits<=0 && !this.allies.some(a=>a.alive&&!a.down)){} // le bleed gérera
    }
    const td=$('#taken-dmg'); td.hidden=false; td.style.opacity=0.9;
    setTimeout(()=>{ td.style.opacity=0; }, 120);
  },
  selfRevive(){
    const p=this.player;
    if(!p.down||p.kits<=0) return;
    p.kits--; p.down=false; p.hp=50;
    $('#downed-ui').hidden=true;
    notify('R\u00c9ANIM\u00c9','Kit de réanimation utilisé.');
  },
  updateAllies(dt){
    const p=this.player;
    for(const al of this.allies){
      if(!al.alive) continue;
      if(al.down){ // saignement + auto mort
        al.revT=(al.revT||6)-dt;
        if(al.revT<=0){ al.alive=false; notify('ALLIÉ PERDU','Votre coéquipier est tombé.'); }
        continue;
      }
      if(p.down){ // aller réanimer
        const d=Math.hypot(al.x-p.x,al.y-p.y);
        if(d>1.1){ const a=Math.atan2(p.y-al.y,p.x-al.x);
          this.move(al, Math.cos(a)*2.2*dt, Math.sin(a)*2.2*dt); al.ang=a;
        } else {
          al.reviving=(al.reviving||6)-dt;
          $('#revive-progress').hidden=false;
          $('#rev-fill').style.width=((6-al.reviving)/6*100)+'%';
          if(al.reviving<=0){ p.down=false; p.hp=60; $('#downed-ui').hidden=true; $('#revive-progress').hidden=true;
            p.revived++; App.addXP(30);
            notify('RÉANIMÉ', al.name+' vous a remis sur pied.');
            al.reviving=6;
          }
        }
        continue;
      }
      // combat
      al.fireCd-=dt;
      let tgt=null, td=18;
      for(const e of this.enemies){ if(e.dead) continue;
        const d=Math.hypot(e.x-al.x,e.y-al.y);
        if(d<td && this.los(al,e)){ tgt=e; td=d; }
      }
      if(tgt){ al.ang=Math.atan2(tgt.y-al.y,tgt.x-al.x);
        if(al.fireCd<=0){ al.fireCd=0.28+Math.random()*0.4;
          Sound.enemyShot(td*0.6);
          if(Math.random()<0.5){ tgt.hp-=14; tgt.hurtT=0.15; tgt.state='fight'; tgt.tx=al.x; tgt.ty=al.y;
            if(tgt.hp<=0){ tgt.dead=true; App.addXP(12); tgt.deadT=0; } }
        }
        if(td<7 && Math.random()<0.04){ this.move(al, 0,0); }
      } else {
        const d=Math.hypot(al.x-p.x,al.y-p.y);
        if(d>2.6){ const a=Math.atan2(p.y-al.y,p.x-al.x)+Math.sin(this.time+i)*0.2;
          this.move(al, Math.cos(a)*2.4*dt, Math.sin(a)*2.4*dt); al.ang=a;
        }
      }
    }
  },
  los(a,b){
    const d=Math.hypot(b.x-a.x,b.y-a.y);
    const ang=Math.atan2(b.y-a.y,b.x-a.x);
    return this.castWall(a.x,a.y,ang)>=d-0.4;
  },
  updateEnemies(dt){
    const p=this.player;
    for(const e of this.enemies){
      if(e.dead){ e.deadT+=dt; continue; }
      e.hurtT=Math.max(0,(e.hurtT||0)-dt);
      const dP=Math.hypot(p.x-e.x,p.y-e.y);
      let vis=false;
      if(!p.down&&dP<16 && this.los(e,p)) vis=true;
      if(vis){ e.state='fight'; e.tx=p.x; e.ty=p.y; e.seeT=this.time; }
      else if(this.time-(e.seeT||0)>6 && e.state!=='patrol'){ e.state='patrol'; }
      if(e.state==='patrol'){
        if(Math.hypot(e.tx-e.x,e.ty-e.y)<1||Math.random()<0.003){ 
          e.tx=e.home.x+(Math.random()-0.5)*10; e.ty=e.home.y+(Math.random()-0.5)*10;
        }
        const a=Math.atan2(e.ty-e.y,e.tx-e.x);
        this.move(e,Math.cos(a)*0.8*dt,Math.sin(a)*0.8*dt); e.ang=a;
      } else {
        const d=Math.hypot(e.tx-e.x,e.ty-e.y);
        // cible: joueur ou allié le plus proche visible
        let tgt=p, tdd=dP;
        for(const al of this.allies){ if(!al.alive||al.down) continue;
          const d2=Math.hypot(al.x-e.x,al.y-e.y);
          if(d2<tdd&&this.los(e,al)){ tgt=al; tdd=d2; }
        }
        e.ang=Math.atan2(tgt.y-e.y,tgt.x-e.x);
        const want=7;
        if(tdd>want+1) this.move(e,Math.cos(e.ang)*1.7*dt,Math.sin(e.ang)*1.7*dt);
        else if(tdd<want-2) this.move(e,-Math.cos(e.ang)*1.4*dt,-Math.sin(e.ang)*1.4*dt);
        else { e.ang+=(Math.random()-0.5)*0.04; }
        e.fireCd-=dt;
        if(e.fireCd<=0 && tdd<15 && this.los(e,tgt)){
          e.fireCd=1.1+Math.random()*1.4;
          Sound.enemyShot(tdd);
          if(Math.random()<0.42- tdd*0.02){
            if(tgt===p){ this.damagePlayer(e.dmg*(0.7+Math.random()*0.6), e); }
            else {
              tgt.hp-=e.dmg;
              if(tgt.hp<=0){ tgt.down=true; tgt.alive=true; notify('ALLIÉ À TERRE','Réanimez-le en vous rapprochant (il se relève seul si vous saignez longtemps).'); }
            }
          }
        }
      }
    }
  },
  callExfil(lz){
    // Helicopter called — player must have looted at least a bit
    this.heli={ state:'inbound', t:0, x:lz.x-40, y:lz.y-40, alt:14, lz, board:0 };
    $('#hud-timer').textContent='EXFIL : HÉLICO EN APPROCHE...';
    Sound.rotor(true);
    notify('EXFILTRATION','Le Pilote arrive. Restez dans la zone LZ.');
  },
  updateHeli(dt){
    const h=this.heli, p=this.player;
    h.t+=dt;
    const lz=h.lz;
    if(h.state==='inbound'){
      const dx=lz.x-h.x, dy=lz.y-h.y, d=Math.hypot(dx,dy);
      h.x+=dx/d*10*dt; h.y+=dy/d*10*dt; h.alt=14;
      Sound.rotorVol(clamp(0.6-d*0.02,0.1,0.6));
      if(d<2){ h.state='landing'; h.t=0; }
    } else if(h.state==='landing'){
      h.alt=Math.max(0,h.alt-4*dt);
      Sound.rotorVol(0.55);
      if(h.alt<=0){ h.state='landed'; h.t=0;
        $('#extract-ui').hidden=false;
        $('#ex-fill').style.width='0%';
        notify('HÉLICOPOPTÈRE EN PLACE','Montez sur le LZ (restez-y).');
      }
    } else if(h.state==='landed'){
      const d=Math.hypot(lz.x-p.x,lz.y-p.y);
      h.board=clamp(h.board+ (d<2? dt/4: -dt/10), 0, 1);
      $('#ex-fill').style.width=(h.board*100)+'%';
      $('#extract-ui').querySelector('.ex-sub').textContent = d<2? 'Récupération en cours...' : 'REJOIGNEZ LE LZ !';
      Sound.rotorVol(0.4);
      if(h.board>=1){ h.state='takeoff'; h.t=0;
        // cinématique
        this.cine={t:0};
        $('#extract-ui').hidden=true;
        $('#hud-timer').textContent='EXFIL : EN VOL...';
        document.exitPointerLock && document.exitPointerLock();
      }
    } else if(h.state==='takeoff'){
      h.alt+=6*dt*8; h.x+=dt*3; h.y+=dt*1.5;
      Sound.rotorVol(0.6);
      if(this.cine) this.cine.t=h.t;
    }
  },
  finish(extracted){
    if(this.saved) return; this.saved=true;
    this.running=false; Sound.rotor(false); Sound.rotorVol(0);
    const p=this.player;
    const prof=App.profile;
    let rows=[];
    if(extracted){
      prof.extractions++; prof.raidCount++;
      const xp=300+p.kills*25+p.lootCount*10;
      App.addXP(xp);
      App.addCash(Math.round(p.lootCash));
      prof.bestLoot=Math.max(prof.bestLoot,p.lootCash|0);
      rows.push(['Exfiltration','+300 XP']);
      rows.push(['Mises à mort',p.kills+' — +'+(p.kills*25)+' XP']);
      rows.push(['Objets récupérés',p.lootCount+' — +'+(p.lootCount*10)+' XP']);
      rows.push(['Argent exfiltré','+'+fmtN(Math.round(p.lootCash))+' \u25cf']);
      rows.push(['Niveau',prof.level+' (XP '+prof.xp+'/'+XP_FOR(prof.level)+')']);
      $('#res-title').textContent='MISSION RÉUSSIE'; $('#res-title').style.color='#8ef29a';
    } else {
      prof.deaths++; prof.raidCount++;
      App.addXP(p.kills*25+50);
      rows.push(['Mises à mort',p.kills+' — +'+(p.kills*25)+' XP']);
      rows.push(['Argent','perdu (réanimez ou exfiltrez pour le garder)']);
      rows.push(['Niveau',prof.level]);
      $('#res-title').textContent='MISE À MORT';
      $('#res-title').style.color='#ff5b4d';
    }
    App.save();
    $('#res-list').innerHTML=rows.map(r=>'<div class="resrow"><span>'+r[0]+'</span><span class="rv">'+r[1]+'</span></div>').join('');
    $('#results').hidden=false;
    $('#game-wrap').querySelectorAll('#downed-ui,#death-ui,#extract-ui').forEach(e=>e.hidden=true);
  },
  exitToMenu(){
    this.running=false;
    Sound.rotor(false); Sound.rotorVol(0);
    $('#game-wrap').hidden=true;
    document.exitPointerLock && document.exitPointerLock();
    App.profile.raidCount++; App.save();
    App.showMain();
  }
};
