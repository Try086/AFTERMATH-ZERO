/* ============ RENDU ============ */
Game.render = function(){
  const gc=$('#gc'), c=gc.getContext('2d');
  const [RW,RH]=Res(App.profile.settings);
  if(gc.width!==RW || gc.height!==RH){ gc.width=RW; gc.height=RH; }
  const W2=RW, H2=RH;
  const p=this.player;
  const foV=(App.profile.settings.fov||75)*Math.PI/180;
  const pitch=p.pitch||0;
  const horizon=H2/2 + pitch*H2*0.42;
  const z=p.z||0;
  const zid=this.zoneAt(p.x,p.y).id;
  // ciel / sol
  const skies={
    nord:['#8fa3b2','#dfe8ee'], ouest:['#3a3d46','#8a8078'], centre:['#26282e','#5c4a38'],
    village:['#2c3648','#8a6a58'], sud:['#4a3418','#d09038']
  };
  let top=skies[zid][0], bot=skies[zid][1];
  const g=c.createLinearGradient(0,0,0,Math.max(1,horizon));
  g.addColorStop(0,top); g.addColorStop(1,bot);
  c.fillStyle=g; c.fillRect(0,0,W2,Math.max(0,horizon));
  const fg=c.createLinearGradient(0,Math.max(0,horizon),0,H2);
  const floors={nord:'#dde5ea', ouest:'#6d6155', centre:'#4c4e54', village:'#5d7045', sud:'#b8996b'};
  // déjà vu
  const f=floors[zid];
  fg.addColorStop(0, shadeMix(f, bot, 0.5)); fg.addColorStop(1, shadeMix(f,f,-0.4));
  c.fillStyle=fg; c.fillRect(0,Math.max(0,horizon),W2,H2);
  // set document color compensation
  // murs (raycast)
  const m=this.map;
  const ca=Math.cos(p.ang), sa=Math.sin(p.ang);
  const planeW=Math.tan(foV/2);
  for(let col=0; col<W2; col++){
    const cx=2*col/W2-1;
    const ra=p.ang+Math.atan(cx*planeW);
    const rca=Math.cos(ra), rsa=Math.sin(ra);
    // DDA
    let mx=p.x|0, my=p.y|0;
    const ddx=Math.abs(1/rca), ddy=Math.abs(1/rsa);
    let sx,sy,sdx,sdy;
    if(rca<0){ sx=-1; sdx=(p.x-mx)*ddx; } else { sx=1; sdx=(mx+1-p.x)*ddx; }
    if(rsa<0){ sy=-1; sdy=(p.y-my)*ddy; } else { sy=1; sdy=(my+1-p.y)*ddy; }
    let side=0, tile=0, steps=0;
    while(steps++<128){
      if(sdx<sdy){ sdx+=ddx; mx+=sx; side=0; } else { sdy+=ddy; my+=sy; side=1; }
      tile=m[my*N+mx];
      if(tile) break;
    }
    if(!tile){ continue; }
    let dist = side===0 ? (mx-p.x+(1-sx)/2)/rca : (my-p.y+(1-sy)/2)/rsa;
    if(dist<0.01) dist=0.01;
    const hgt=(H2/dist)|0;
    let wallX = side===0 ? p.y+dist*rsa : p.x+dist*rca;
    wallX-=Math.floor(wallX);
    let tx=(wallX*64)|0;
    if((side===0&&rca>0)||(side===1&&rsa<0)) tx=63-tx;
    const tex=TEX[tile]||TEX[1];
    const yFace = horizon + ((z>0.05)? (dist*z*H2*0.3) : 0);
    const y0=horizon-hgt*0.5 + z*40/dist*8 + (z>0?0:0);
    // draw
    c.drawImage(tex, tx,0,1,64, col, y0, 1, hgt);
    // ombrage & brouillard
    let sh = side===1? 0.22:0;
    const fog=App.profile.settings.fog? clamp(dist/26,0,0.75):clamp(dist/60,0,0.85);
    const a=clamp(sh+fog,0,0.92);
    if(a>0.02){ c.fillStyle='rgba('+fogColor(zid)+','+a+')'; c.fillRect(col,y0-0.5,1,hgt+1); }
  }
  // SPRITES
  // sprites view

  for(const pr of this.props||[]) push2(pr.x,pr.y,pr.spr,pr.scale||1);
  for(const L of this.lootP||[]) if(!L.taken) push2(L.x,L.y,L.spr,0.55,0.28);
  for(const e of this.enemies||[]){
    if(e.dead && e.deadT>25) continue;
    push2(e.x,e.y,e.spr,1,0, e.dead? Math.max(0,1-e.deadT/25):1, e.dead);
  }
  for(const a of this.allies||[]) if(a.alive) push2(a.x,a.y,SPR.ally,1,0,1,false,true);
  const qlist=Game.renderQueue;
  qlist.sort((A,B)=>Math.hypot(B.x-p.x,B.y-p.y)-Math.hypot(A.x-p.x,A.y-p.y));
  for(const S of qlist) this.drawSprite(c,S,W2,H2,horizon,p,foV,planeW,z);
  // HELI
  if(this.heli) this.drawHeli(c,W2,H2,horizon,p,planeW);
  // arme en main
  if(!this.cine && !p.down) this.drawWeapon(c,W2,H2);
  // météo
  if(App.profile.settings.particles) this.weather(c,W2,H2);
  // cinématique d'escalade
  if(this.cine) this.cineOverlay(c,W2,H2);
  // flash tir lumière
  if(p.flash>0){ p.flash-=0.016;
    c.fillStyle='rgba(255,190,90,'+(clamp(p.flash,0,1)*0.25)+')';
    c.fillRect(0,0,W2,H2);
  }
  if(App.profile.settings.fps){
    this._fpsA=(this._fpsA||16)*0.9+16.7;
    c.fillStyle='#39d465'; c.font='10px monospace'; c.textAlign='left';
    c.fillText(Math.round(1000/Math.max(1,this._fpsA))+' FPS',6,H2-6);
  }
};
function fogColor(zid){
  return zid==='nord'?'200,214,224': zid==='sud'?'190,150,90': zid==='village'?'110,100,90':'40,40,46';
}
function shadeMix(h1,h2,amt){
  // approximation rapide: assombrit h1
  const n=parseInt(h1.slice(1),16);
  const f=1+amt;
  const r=clamp((n>>16)*f,0,255)|0, g2=clamp(((n>>8)&255)*f,0,255)|0, b=clamp((n&255)*f,0,255)|0;
  return 'rgb('+r+','+g2+','+b+')';
}
Game.spriteScale=function(pr,i){ return pr.scale||1; };

/* push2 définie au niveau du render initial (closure) non disponible → réimplémentation */
Game.renderQueue=[];
function push2(x,y,spr,scale,yOff,fade,dead,ally){
  Game.renderQueue.push({x,y,spr,scale:scale||1,yOff:yOff||0,fade:fade===undefined?1:fade,dead,ally});
}
/* refaire: render appelle push2 qui remplit la file;*/
const _origRender=Game.render;
Game.render=function(){
  Game.renderQueue=[];
  _origRender.call(Game);
};

Game.drawSprite=function(c,S,W2,H2,horizon,p,foV,planeW,z){
  const dx=S.x-p.x, dy=S.y-p.y;
  const d=Math.hypot(dx,dy);
  if(d<0.2) return;
  let rel=Math.atan2(dy,dx)-p.ang;
  rel=Math.atan2(Math.sin(rel),Math.cos(rel));
  if(Math.cos(rel)<0.25) return;
  const sx=(Math.tan(rel)/planeW+0.5)*W2;
  if(sx<-90||sx>W2+90) return;
  const hgt=(H2/d)*S.scale*1.0;
  const spr=S.spr;
  const ratio=spr.width/spr.height;
  const w=hgt*ratio;
  const yBase=horizon + (z*40/Math.max(0.5,d))*8;
  let y0=yBase + (H2/d)*(S.yOff);
  c.save();
  if(S.dead){
    c.translate(sx,y0);
    c.rotate(-1.5);
    c.globalAlpha=S.fade;
    c.drawImage(spr,-w/2,-hgt*0.5,w,hgt);
  } else {
    c.globalAlpha=S.fade;
    c.drawImage(spr,sx-w/2,y0-hgt,w,hgt);
  }
  c.restore();
};
Game.drawHeli=function(c,W2,H2,horizon,p,planeW){
  const h=this.heli; if(!h) return;
  const dx=h.lz.x-p.x, dy=h.lz.y-p.y;
  const d=Math.hypot(dx,dy);
  const rel=Math.atan2(dy,dx)-p.ang;
  const sx=Math.round((Math.tan(rel)/planeW+1)/2*W2);
  const scale=clamp(1.4-d*0.03,0.5,3);
  const w=W2*0.5*scale, hh=w*(SPR.heli.height/SPR.heli.width);
  const screenY=horizon - (h.alt*H2*0.12) ;
  c.drawImage(SPR.heli, sx-w/2, screenY-hh, w, hh);
  heliBlur(c, sx-w/2+w/2, screenY-hh+4, w*0.45);
  // corde pendant 'landed' et cinematic
  if(h.state==='landed'||this.cine){
    c.strokeStyle='rgba(30,30,34,0.9)'; c.lineWidth=Math.max(2,W2*0.004);
    c.beginPath(); c.moveTo(sx-w/2+w/2, screenY-hh+hh*0.8);
    c.lineTo(sx-w/2+w/2, Math.min(H2,screenY-hh+hh+h.alt*H2*0.11)); c.stroke();
  }
};
Game.drawWeapon=function(c,W2,H2){
  const p=this.player;
  const w=p.weapons[p.wi];
  if(!w) return;
  const skin=App.profile.skinByWeap[w.id]||'none';
  const out=WEAPONS[w.id];
  const cv=this.wcv||(this.wcv=document.createElement('canvas'));
  const ww=W2*0.42, hh=H2*0.34;
  if(cv.width!==ww*2){ cv.width=ww*2; cv.height=hh*2; }
  drawWeaponIcon(cv, w.id, skin);
  const c2=cv.getContext('2d');
  // accents du skin
  c2.save();
  c2.restore();
  const bob=Math.sin(p.bob)*H2*0.012*(p.ads?0.2:1);
  const bobX=Math.cos(p.bob*0.55)*W2*0.008*(p.ads?0.2:1);
  const rec=p.recoil*H2*0.05;
  const adsX=(W2/2 - W2*0.62)*p.adsT;
  const adsY=(H2*0.56 - H2*0.86)*p.adsT;
  const x=W2*0.62+bobX+adsX, y=H2 - hh*0.72 + bob + rec + adsY;
  c.save();
  if(p.sprint){ c.translate(W2*0.5,H2*0.95); c.rotate(-0.5+Math.sin(p.bob*0.7)*0.06); c.translate(-W2*0.5,-H2*0.95); }
  c.globalAlpha=1;
  c.drawImage(cv, x-ww/2, y, ww, hh);
  // flash
  if(p.flash>0){
    const fx=x+ww*0.32, fy=y-hh*0.05;
    c.fillStyle='rgba(255,210,90,0.85)';
    c.beginPath();
    c.moveTo(fx-ww*0.02,fy); c.lineTo(fx, fy-hh*0.2);
    c.lineTo(fx+ww*0.06,fy-hh*0.08); c.lineTo(fx+ww*0.09,fy);
    c.closePath(); c.fill();
    c.fillStyle='rgba(255,255,220,0.9)';
    c.beginPath(); c.arc(fx,fy-hh*0.06,ww*0.02,0,7); c.fill();
  }
  // mains (couleur tenue)
  const o=OUTFITS[App.profile.outfit]||OUTFITS.black;
  c.fillStyle=o.mask; c.globalAlpha=0.95;
  c.beginPath(); c.ellipse(x-ww*0.28, y+hh*0.32, ww*0.05, hh*0.10, -0.5, 0, 7); c.fill();
  c.beginPath(); c.ellipse(x+ww*0.18, y+hh*0.34, ww*0.05, hh*0.10, 0.4, 0, 7); c.fill();
  c.fillStyle=o.pouch;
  c.fillRect(x-ww*0.30,y+hh*0.3,ww*0.1,hh*0.2);
  c.fillRect(x+ww*0.13,y+hh*0.32,ww*0.1,hh*0.2);
  c.restore();
};
Game.weather=function(c,W2,H2){
  const t=this.time;
  const zid=this.zoneAt(this.player.x,this.player.y).id;
  c.save();
  if(!this._wp){
    this._wp={seed:Math.random()*1000};
  }
  const n=W2*(H2/180)|0;
  if(zid==='nord'){
    c.fillStyle='rgba(255,255,255,0.65)';
    for(let i=0;i<n;i++){
      const x=((i*97+Math.sin(t*0.7+i)*30+t*40)%W2+W2)%W2;
      const y=((i*61+t*90)%H2);
      c.fillRect(x,y,1.4,1.4);
    }
  } else if(zid==='sud'){
    c.fillStyle='rgba(220,190,130,0.25)';
    for(let i=0;i<n/2;i++){
      const x=((i*97+t*160)%W2+W2)%W2; const y=(i*53)%H2+Math.sin(t+i)*4;
      c.fillRect(x,y,6,1.2);
    }
  } else if(zid==='centre'){
    for(let i=0;i<n/3;i++){
      const x=((i*83+Math.sin(t*2+i)*12)%W2+W2)%W2;
      const y=H2-((i*73+t*35)%H2);
      c.fillStyle='rgba(240,'+(120+((i*37)%80))+',60,0.4)';
      c.fillRect(x,y,1.6,1.6);
    }
  } else {
    c.strokeStyle='rgba(160,180,200,0.25)';
    for(let i=0;i<n/3;i++){
      const x=((i*89+t*30)%W2+W2)%W2, y=(i*71+t*260)%H2;
      c.beginPath(); c.moveTo(x,y); c.lineTo(x-3,y+9); c.stroke();
    }
  }
  // vignette combat
  c.restore();
};
Game.cineOverlay=function(c,W2,H2){
  const t=this.cine.t;
  // caméra monte
  this.player.z=Math.min(1.6,t*0.6);
  this.player.pitch=Math.min(1.1,t*0.3);
  // barres noir
  c.fillStyle='rgba(0,0,0,0.92)';
  const bh=H2*0.1;
  c.fillRect(0,0,W2,bh*Math.min(1,t*3));
  c.fillRect(0,H2-bh*Math.min(1,t*3),W2,bh*Math.min(1,t*3));
  // tremble
  if(t<0.4){ c.fillStyle='rgba(255,255,255,'+(0.5-t)+')'; c.fillRect(0,0,W2,H2); }
  // mains qui grimpent (corde)
  const cx=W2*0.5, topY=H2*0.2;
  c.fillStyle='rgba(25,26,30,0.95)';
  c.fillRect(cx-W2*0.004, topY, W2*0.008, H2); // corde
  const o=OUTFITS[App.profile.outfit]||OUTFITS.black;
  const cyc=(t*2.4)%2;
  const h1=cyc<1? topY+H2*0.45 - cyc*H2*0.16 : topY+H2*0.62 - (2-cyc)*H2*0.16;
  const h2=cyc<1? topY+H2*0.62 - (1-Math.abs(cyc-1))*H2*0.0 : topY+H2*0.45 - (cyc-1)*H2*0.16;
  c.fillStyle=o.mask;
  c.beginPath(); c.ellipse(cx-W2*0.03,h1,W2*0.02,H2*0.03,-0.4,0,7); c.fill();
  c.beginPath(); c.ellipse(cx+W2*0.03,h2,W2*0.02,H2*0.03,0.4,0,7); c.fill();
  // vent lignes
  c.strokeStyle='rgba(255,255,255,0.12)';
  for(let i=0;i<14;i++){
    const y=(i*67+t*300)%H2;
    c.beginPath(); c.moveTo((i*53)%W2,y); c.lineTo((i*53+40)%W2,y+14); c.stroke();
  }
  // fade final
  if(t>3.6){ c.fillStyle='rgba(255,255,255,'+clamp((t-3.6)/0.8,0,1)+')'; c.fillRect(0,0,W2,H2); }
};

/* ============ HUD ============ */
Game.hud=function(dt){
  const p=this.player;
  if(!p) return;
  $('#hp-fill').style.width=p.hp+'%';
  $('#hp-fill').className=p.hp<35?'low':'';
  $('#ar-fill').style.width=(p.armor||0)*2+'%';
  $('#hud-kit-n').textContent=p.kits;
  $('#hud-loot').textContent=p.lootCount;
  $('#hud-cash').textContent=fmtN(Math.round(p.lootCash));
  const w=p.weapons[p.wi];
  if(w){ $('#hud-weap').textContent=(WEAPONS[w.id].name+(App.profile.skinByWeap[w.id]?' \u2014 '+SKINS[App.profile.skinByWeap[w.id]].name:'')).toUpperCase();
    $('#hud-ammo').textContent=w.mag; $('#hud-skin').innerHTML='<span id="hud-ammo">'+w.mag+'</span><b class="ammo-res"> / '+w.reserve+'</b>'; }
  // crosshair dynamic
  const cr=App.profile.settings.cross;
  const spread=p.recoil*10 + (p.sprint?6:0);
  const ch=$('#crosshair');
  if(ch._cfg!==cr||ch._sp!==spread){ ch._cfg=cr; ch._sp=spread; applyCrosshair(ch,cr,spread*1.5); }
  // minimap
  const mm=$('#minimap'), mc=mm.getContext('2d');
  if(!this.mapCv){
    this.mapCv=document.createElement('canvas'); this.mapCv.width=N; this.mapCv.height=N;
    const c2=this.mapCv.getContext('2d');
    c2.fillStyle='#0a0f14'; c2.fillRect(0,0,N,N);
    const im=c2.createImageData(N,N);
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){
      const t2=this.map[y*N+x];
      let r=10,g2=14,b=20;
      if(t2===1){r=100;g2=102;b=106;} else if(t2===2){r=110;g2=86;b=66;}
      else if(t2===3){r=181;g2=160;b=114;} else if(t2===4||t2===6){r=77;g2=86;b=95;}
      else if(t2===5){r=93;g2=96;b=104;} else if(t2===7){r=18;g2=58;b=82;}
      const i2=(y*N+x)*4;
      im.data[i2]=r; im.data[i2+1]=g2; im.data[i2+2]=b; im.data[i2+3]=255;
    }
    c2.putImageData(im,0,0);
  }
  mc.imageSmoothingEnabled=false;
  mc.clearRect(0,0,150,150);
  const view=56; // cellules affichées
  const px=p.x, py=p.y;
  const sx0=clamp(px-view,0,N-view*2), sy0=clamp(py-view,0,N-view*2);
  mc.drawImage(this.mapCv, sx0, sy0, view*2, view*2, 0,0,150,150);
  const dot=(x,y,col,s)=>{
    const f=75/view;
    const X=75+(x-px)*f, Y=75+(y-py)*f;
    if(X<0||Y<0||X>150||Y>150) return;
    mc.fillStyle=col; mc.fillRect(X-s/2,Y-s/2,s,s);
  };
  for(const L of this.lootP) if(!L.taken) dot(L.x,L.y,'rgba(240,134,44,0.9)',3);
  for(const e of this.enemies) if(!e.dead) dot(e.x,e.y,'#ff5b4d',4);
  for(const a of this.allies) if(a.alive&&!a.down) dot(a.x,a.y,'#5b9bd5',4);
  for(const L of this.LZs){ dot(L.x,L.y,'#39d465',6); }
  if(this.heli&&this.heli.state!=='inbound') dot(this.heli.lz.x,this.heli.lz.y,'#8ef29a',8);
  // flèche joueur
  mc.save(); mc.translate(75,75); mc.rotate(-p.ang - Math.PI/2 + Math.PI);
  mc.fillStyle='#fff'; mc.beginPath(); mc.moveTo(0,-6); mc.lineTo(4,4); mc.lineTo(-4,4); mc.closePath(); mc.fill();
  mc.restore();
  if(p.down){ mc.fillStyle='rgba(120,0,0,0.25)'; mc.fillRect(0,0,150,150); }
};
function applyCrosshair(el,cr,spread){
  el.innerHTML='';
  const th=(cr.thick||2), len=(cr.size||7), gap=(cr.gap||4)+ (spread||0);
  if(cr.style==='cross'||cr.style==='crossdot'){
    const mk=(x,y,w,h)=>{ const i=document.createElement('i'); i.style.left=x+'px'; i.style.top=y+'px'; i.style.width=w+'px'; i.style.height=h+'px'; el.appendChild(i); };
    mk(-gap-len, -th/2, len, th);
    mk(gap, -th/2, len, th);
    mk(-th/2, -gap-len, th, len);
    mk(-th/2, gap, th, len);
  }
  if(cr.style==='circle'){
    const i=document.createElement('i');
    i.className='cd'; i.style.collection='';
    i.style.left=(-(gap+len))+'px'; i.style.top=(-(gap+len))+'px';
    i.style.width=((gap+len)*2)+'px'; i.style.height=((gap+len)*2)+'px';
    i.style.background='transparent'; i.style.border=th+'px solid '+cr.color; i.style.borderRadius='50%';
    el.appendChild(i);
  }
  if(cr.style==='dot'||cr.style==='crossdot'){
    const i=document.createElement('i'); i.className='cd';
    i.style.left=(-th)+'px'; i.style.top=(-th)+'px'; i.style.width=(th*2)+'px'; i.style.height=(th*2)+'px';
    el.appendChild(i);
  }
  el.style.color=cr.color;
  const st=el.style; 
  el.style.left='50%'; el.style.top='50%';
}

/* ============ INPUT ============ */
Game.keys={};
document.addEventListener('keydown',e=>{
  if(!Game.running||Game.cine) return;
  Game.keys[e.code]=true;
  if(['KeyW','KeyA','KeyS','KeyD','Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(e.code)) e.preventDefault();
  if(e.code==='KeyR') Game.reload();
  if(e.code==='KeyE') Game.action();
  if(e.code==='KeyF' && Game.nearLZ && !Game.heli) Game.callExfil(Game.nearLZ);
  if(e.code==='Digit1') Game.switchW(0);
  if(e.code==='Digit2') Game.switchW(1);
  if(e.code==='Escape'){ /* pointer lock exit triggers pause */ }
});
document.addEventListener('keyup',e=>{ Game.keys[e.code]=false; });
document.addEventListener('pointerlockchange',()=>{
  const locked=document.pointerLockElement===($('#gc'));
  const pauseOpen=!$('#pause-menu').hidden;
  if(Game.running&&!locked&&!Game.cine&&!pauseOpen&&!Game.finishing){
    Game.paused=true; $('#pause-menu').hidden=false; Sound.click();
  }
});
$('#pm-resume').onclick=()=>{ $('#pause-menu').hidden=true; Game.paused=false; $('#gc').requestPointerLock(); };
$('#pm-settings').onclick=()=>{ showScreen('scr-settings'); };
$('#pm-classes').onclick=()=>{ showScreen('scr-classes'); };
$('#pm-quit').onclick=()=>{ $('#pause-menu').hidden=true; Game.finish(false); };
$('#btn-death-menu').onclick=()=>{ $('#death-ui').hidden=true; Game.exitToMenu(); };
$('#btn-res-menu').onclick=()=>{ Game.exitToMenu(); };
$('#down-kit').onclick=()=>Game.selfRevive();

Game.reload=function(){
  const p=this.player, w=p.weapons[p.wi];
  if(!w||p.down||p.reloading>0||w.mag>=w.s.mag||w.reserve<=0) return;
  p.reloading=WEAPONS[w.id].kind==='shotgun'?3:2.3;
  Sound.reload();
};
Game.switchW=function(i){
  const p=this.player;
  if(p.down||!p.weapons[i]) return;
  if(i===p.wi) return;
  p.wi=i; p.reloading=0; Sound.click();
};
Game.action=function(){
  const p=this.player;
  if(p.down){ this.selfRevive(); return; }
  if(p.nearLoot){ this.pickup(p.nearLoot); }
  else if(this.nearLZ && !this.heli){ this.callExfil(this.nearLZ); }
};
Game.pickup=function(L){
  L.taken=true;
  const p=this.player;
  App.profile.loots++; p.lootCount++;
  App.addXP(10);
  if(L.type==='weapon'){
    const id=this.rollWeapon();
    if(!App.profile.unlocked.includes(id)){
      App.profile.unlocked.push(id);
      notify('NOUVELLE ARME \u2014 STASH', WEAPONS[id].name+' a été ajoutée à votre Armurerie.');
    }
    // ramasser physiquement
    const atts=App.profile.classes[App.profile.classIdx].atts;
    p.weapons.push({id, mag:effStats(id,atts).mag, reserve:90, s:effStats(id,atts)});
    p.wi=p.weapons.length-1;
  } else if(L.type==='ammo'){
    const add=40+((Math.random()*60)|0);
    p.weapons.forEach(w=>w.reserve+=w.s.mag*2);
    notify('MUNITIONS','+'+add+' balles réservées.');
  } else if(L.type==='cash'){
    const v=(100+((Math.random()*500)|0))*(1+this.zoneVal());
    p.lootCash+=v;
  } else if(L.type==='armor'){
    p.armor=Math.min(50,(p.armor||0)+25);
    notify('GILET','Plaque de gilet équipée.');
  } else if(L.type==='kit'){
    p.hp=Math.min(100,p.hp+45);
    notify('SOIN','Kit de soin utilisé.');
  } else if(L.type==='revive'){
    p.kits++;
    notify('KIT DE RÉANIMATION','Vous pouvez désormais être réanimé une fois.');
  }
  Sound.pickup();
  App.save();
};
Game.zoneVal=function(){
  const z=this.zoneAt(this.player.x,this.player.y).id;
  return z==='centre'?0.6: z==='nord'?1.0: z==='ouest'?0.3: z==='village'?0.4:0.2;
};

/* ============ SOURIS ============ */
document.addEventListener('mousemove',e=>{
  if(!Game.running||Game.paused||Game.cine) return;
  if(document.pointerLockElement!==$('#gc')) return;
  const sens=(App.profile.settings.sens/100)*0.003+0.0004;
  Game.player.ang+=e.movementX*sens;
  Game.player.pitch=clamp((Game.player.pitch||0)-e.movementY*sens*0.8,-0.8,0.8);
});
document.addEventListener('mousedown',e=>{
  if(!Game.running||Game.cine) return;
  if(document.pointerLockElement!==$('#gc')){ return; }
  if(e.button===0){ const w0=Game.player.weapons[Game.player.wi];
    if(w0&&w0.s&&w0.s.auto){ Game.player.fireHold=true; }
    else if(w0){ Game.shoot(); } }
  if(e.button===2){ Game.player.ads=true; }
});
document.addEventListener('mouseup',e=>{
  if(e.button===0) Game.player.fireHold=false;
  if(e.button===2) Game.player.ads=false;
});
document.addEventListener('contextmenu',e=>{ if(Game.running) e.preventDefault(); });
document.addEventListener('wheel',e=>{
  if(!Game.running||Game.paused) return;
  Game.switchW((Game.player.wi+1)%Game.player.weapons.length);
},{passive:true});

document.addEventListener('contextmenu',e=>{ if(Game.running) e.preventDefault(); });
document.addEventListener('wheel',e=>{
  if(!Game.running||Game.paused) return;
  Game.switchW((Game.player.wi+1)%Game.player.weapons.length);
},{passive:true});

/* semi-auto: reset fireT when mouse pressed anew */
const _fireHoldProto=null;
Game.tickSemi=function(){};
setInterval(()=>{ if(Game.player&&Game.player.fireHold===false) Game.player._semiReady=true; }, 50);
