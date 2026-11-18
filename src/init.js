/* ============ FOND ANIMÉ DU MENU ============ */
(function(){
  const cv=$('#menuFx'); let W2=0,H2=0, base=null;
  // scène statique pré-rendue
  function buildBase(){
    W2=cv.width=innerWidth; H2=cv.height=innerHeight;
    base=document.createElement('canvas'); base.width=W2; base.height=H2;
    const c=base.getContext('2d');
    // ciel orageux
    let g=c.createLinearGradient(0,0,0,H2);
    g.addColorStop(0,'#17181d'); g.addColorStop(0.55,'#3a2f24');
    g.addColorStop(0.75,'#7a4c22'); g.addColorStop(0.86,'#1a1a20'); g.addColorStop(1,'#0b0c10');
    c.fillStyle=g; c.fillRect(0,0,W2,H2);
    // nuages
    for(let i=0;i<26;i++){
      const x=(i*i*97)%W2, y=H2*0.08+((i*53)%Math.max(1,H2*0.3));
      c.fillStyle='rgba(60,52,44,'+(0.12+ (i%3)*0.05)+')';
      c.beginPath(); c.ellipse(x,y, 120+ (i%5)*40, 26+(i%4)*12, 0.2,0,7); c.fill();
    }
    // lueur incendie à l'horizon
    g=c.createRadialGradient(W2*0.68,H2*0.78,10,W2*0.68,H2*0.78,W2*0.4);
    g.addColorStop(0,'rgba(244,140,50,0.5)');
    g.addColorStop(0.3,'rgba(200,90,30,0.22)');
    g.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=g; c.fillRect(0,H2*0.4,W2,H2*0.6);
    // skyline en ruines
    c.fillStyle='#101116';
    let x=0;
    while(x<W2){
      const w=30+((x*7)%60), h=H2*(0.12+((x*13)%22)/160);
      c.fillRect(x,H2*0.72-h, w, h);
      // étage effondré
      if(x%3===0){ c.beginPath(); c.moveTo(x,H2*0.72-h); c.lineTo(x+w*0.5,H2*0.72-h-8); c.lineTo(x+w,H2*0.72-h); c.closePath(); c.fill(); }
      x+=w+4+((x*3)%22);
    }
    // château d'eau
    const tx=W2*0.16, ty=H2*0.72;
    c.strokeStyle='#0d0e12'; c.lineWidth=5;
    c.strokeRect(tx-34,ty-150,68,54);
    c.beginPath(); c.moveTo(tx-34,ty-150); c.lineTo(tx-46,ty-96); c.moveTo(tx+34,ty-150); c.lineTo(tx+46,ty-96);
    c.moveTo(tx-20,ty-96); c.lineTo(tx-20,ty); c.moveTo(tx+20,ty-96); c.lineTo(tx+20,ty); c.stroke();
    // fenêtres éteintes/allumées
    for(let i=0;i<70;i++){
      const bx=((i*67)%W2), bh=H2*0.72;
      c.fillStyle=(i%7===0)?'rgba(244,150,60,0.85)':'rgba(20,20,26,0.9)';
      c.fillRect(bx, bh-14-((i*29)%110), 4,6);
    }
    // sol dévasté
    g=c.createLinearGradient(0,H2*0.72,0,H2);
    g.addColorStop(0,'#131417'); g.addColorStop(1,'#07080a');
    c.fillStyle=g; c.fillRect(0,H2*0.72,W2,H2*0.28);
    // gravats
    for(let i=0;i<90;i++){
      const rx=(i*89)%W2, ry=H2*0.74+((i*37)%(H2*0.24));
      c.fillStyle=(i%2)?'#1b1d22':'#101216';
      const s=3+(i%9);
      c.beginPath(); c.moveTo(rx,ry); c.lineTo(rx+s,ry-s*0.6); c.lineTo(rx+s*2,ry); c.closePath(); c.fill();
    }
    // soldat 1 (gauche, plus proche, debout arme en main)
    drawMenuSoldier(c, W2*0.18, H2*1.02, H2*0.52, '#1b1c20', 1);
    // soldat 2 (droite, plus loin)
    drawMenuSoldier(c, W2*0.30, H2*0.99, H2*0.4, '#111216', -0.5);
  }
  function drawMenuSoldier(c,footX,footY,scale,col,lean){
    c.save(); c.translate(footX,footY); c.scale(scale/ (H2*0.5), scale/(H2*0.5));
    const U=60;
    c.fillStyle=col;
    // jambes
    c.fillRect(-U*0.28,-U*1.6,U*0.5,U*1.6);
    c.fillRect(U*0.05,-U*1.6,U*0.5,U*1.6);
    // torse blindé
    c.fillRect(-U*0.72,-U*2.6,U*1.44,U*1.1);
    // pochettes
    c.fillRect(-U*0.6,-U*2.45,U*0.42,U*0.5);
    c.fillRect(U*0.18,-U*2.45,U*0.42,U*0.5);
    // bras
    c.fillRect(-U*1.0,-U*2.5,U*0.3,U*0.9);
    c.fillRect(U*0.7,-U*2.5,U*0.3,U*0.9);
    // tête + casque
    c.fillRect(-U*0.34,-U*3.05,U*0.68,U*0.5);
    c.beginPath(); c.ellipse(0,-U*3.1,U*0.5,U*0.34,0,Math.PI,0); c.fill();
    // arme tenue en traverse
    c.save(); c.rotate(lean*0.06);
    c.fillRect(-U*0.2,-U*2.35,U*1.9,U*0.16);
    c.fillRect(-U*0.35,-U*2.28,U*0.4,U*0.3);
    c.restore();
    c.restore();
  }
  let t=0, embers=[];
  function frame(){
    if(!$('#scr-main').classList.contains('active') && !$('#scr-login').classList.contains('active')){ t+=0.016; requestAnimationFrame(frame); return; }
    const c=cv.getContext('2d');
    if(!base||cv.width!==innerWidth){ buildBase(); }
    t+=0.016;
    c.clearRect(0,0,W2,H2);
    c.drawImage(base,0,0);
    // lueur pulsée horizon
    c.fillStyle='rgba(244,140,50,'+(0.05+0.04*Math.sin(t*1.7))+')';
    c.fillRect(0,H2*0.6,W2,H2*0.2);
    // hélico
    const hx=W2*0.66+Math.sin(t*0.11)*W2*0.06, hy=H2*0.22+Math.sin(t*0.23)*10;
    c.globalAlpha=0.95;
    c.drawImage(SPR.heli, hx, hy, W2*0.13, W2*0.13*SPR.heli.height/SPR.heli.width);
    heliBlur(c, hx+W2*0.065, hy+6, W2*0.058);
    c.globalAlpha=1;
    // braises
    if(embers.length<60 && Math.random()<0.4) embers.push({x:Math.random()*W2, y:H2*0.75, v:0.4+Math.random(), drift:Math.random()*2-1, r:1+Math.random()*2});
    for(let i=embers.length-1;i>=0;i--){
      const e=embers[i];
      e.y-=e.v; e.x+=Math.sin(t*2+e.r)*0.4+e.drift*0.2;
      c.fillStyle='rgba(250,'+(140+((i*29)%80))+',50,'+clamp((e.y-H2*0.2)/(H2*0.6),0,0.8)+')';
      c.beginPath(); c.arc(e.x,e.y,e.r,0,7); c.fill();
      if(e.y< H2*0.1) embers.splice(i,1);
    }
    // vignette tempête
    c.fillStyle='rgba(5,6,10,'+(0.1+0.05*Math.sin(t*0.4))+')';
    c.fillRect(0,0,W2,H2);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  addEventListener('resize',()=>{ base=null; });
})();

/* ============ RETOURS (compat pause) ============ */
$$('.btn-back').forEach(b=>b.onclick=()=>{
  Sound.click();
  $$('.screen').forEach(s=>s.classList.remove('active'));
  if(Game.running){ $('#pause-menu').hidden=false; }
  else App.showMain();
});

/* ============ MINIATURE ACTUS ============ */
(function(){
  const cv=document.createElement('canvas'); cv.width=78; cv.height=48;
  const c=cv.getContext('2d');
  c.fillStyle='#2c2117'; c.fillRect(0,0,78,48);
  c.fillStyle='#3a2c1c'; c.fillRect(0,30,78,18);
  c.fillStyle='#f0862c'; c.globalAlpha=0.7;
  c.beginPath(); c.ellipse(56,26,10,14,0,0,7); c.fill();
  c.globalAlpha=1;
  const el=$('#news-thumb'); if(el) el.appendChild(cv);
})();

/* ============ BOOT ============ */
buildSprites();
App.load();
document.addEventListener('click',()=>Sound.init(),{once:true});
