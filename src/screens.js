/* ============ ARMURERIE ============ */
let armSel = {cat:'ar', id:null};
const CATNAMES = {ar:'FUSILS D\u2019ASSAUT', smg:'PM', shotgun:'FUSILS \u00c0 POMPE', lmg:'MUNITIONS LOURDES', pistol:'PISTOLETS'};

function buildArmory(){
  const p = App.profile;
  $$('#arm-tabs .atab').forEach(b=>{
    b.classList.toggle('active', b.dataset.cat===armSel.cat);
    b.onclick=()=>{ armSel.cat=b.dataset.cat; armSel.id=null; Sound.click(); buildArmory(); };
  });
  const list = $('#arm-list'); list.innerHTML='';
  const ids = Object.keys(WEAPONS).filter(id=>WEAPONS[id].cat===armSel.cat);
  ids.forEach(id=>{
    const w=WEAPONS[id], un=weaponUnlocked(id);
    const d=document.createElement('div');
    d.className='wnode'+(un?'':' locked')+(armSel.id===id?' active':'');
    const cv=document.createElement('canvas'); cv.width=160; cv.height=56;
    drawWeaponIcon(cv, id, p.skinByWeap[id]||'none');
    const t=document.createElement('div');
    t.innerHTML='<div class="wname">'+w.name+'</div><div class="wlv">'+(un?CATNAMES[w.cat]+' \u2014 NV '+w.lvl:'Verrouill\u00e9e \u2014 NV '+w.lvl)+'</div>';
    d.appendChild(cv); d.appendChild(t);
    d.onclick=()=>{ armSel.id=id; Sound.click(); buildArmory(); };
    list.appendChild(d);
  });
  buildArmDetail();
}

function buildArmDetail(){
  const p=App.profile;
  const det=$('#arm-detail'); det.innerHTML='';
  if(!armSel.id || WEAPONS[armSel.id].cat!==armSel.cat){
    const first = Object.keys(WEAPONS).find(id=>WEAPONS[id].cat===armSel.cat);
    armSel.id=first;
  }
  const id=armSel.id, w=WEAPONS[id];
  if(!w) return;
  const un=weaponUnlocked(id);
  const cls=App.profile.classes[App.profile.classIdx];
  const h=document.createElement('div');
  h.innerHTML='<h2>'+w.name+'</h2><div class="wsub">'+CATNAMES[w.cat]+' \u2014 '+(un?'D\u00c9BLOQU\u00c9E \u2014 D\u00e9bloqu\u00e9e niveau '+w.lvl:'VERROUILL\u00c9E \u2014 atteignez le niveau '+w.lvl+' ou lootz-la en raid')+'</div>';

  const cvWrap=document.createElement('div');
  cvWrap.style.cssText='background:#0a0d12;border:1px solid #1a1d24;padding:18px;margin-bottom:18px;';
  const cv=document.createElement('canvas'); cv.width=520; cv.height=160; cv.style.width='100%'; 
  drawWeaponIcon(cv,id,p.skinByWeap[id]||'none');
  cvWrap.appendChild(cv); h.appendChild(cvWrap);

  // skins
  const skT=document.createElement('div'); skT.className='sec-t'; skT.textContent='SKIN D\u2019ARME';
  h.appendChild(skT);
  const skRow=document.createElement('div'); skRow.className='att-list';
  Object.keys(SKINS).forEach(skId=>{
    if(skId==='none') return;
    const owned=p.skinsOwned.includes(skId);
    const btn=document.createElement('div');
    btn.className='att'+((p.skinByWeap[id]||'none')===skId?' on':'')+(owned?'':' locked');
    btn.textContent=SKINS[skId].name+(owned?'':' \u2014 Boutique');
    btn.onclick=()=>{ if(!owned){ notify('SKIN VERROUILL\u00c9','Achetez-le dans la Boutique.'); return; }
      p.skinByWeap[id]=skId; App.save(); Sound.click(); buildArmDetail(); };
    skRow.appendChild(btn);
  });
  h.appendChild(skRow);

  // stats
  const cur = effStats(id, un?cls.atts:[]);
  const base = effStats(id, []);
  const pct = (v,max)=>clamp(v/max*100,2,100);
  const stat=(name,k,max)=>{
    const row=document.createElement('div'); row.className='statrow';
    row.innerHTML='<div class="sname">'+name+'</div><div class="sbar"><i style="width:'+pct(base[k],max)+'%"></i>'+(cur!==base?'<span class="sadd" style="width:'+pct(cur[k],max)+'%"></span>':'')+'</div>';
    return row;
  };
  const box=document.createElement('div'); box.style.marginTop='20px';
  box.appendChild(stat('D\u00c9G\u00c2TS','dmg',60));
  box.appendChild(stat('CADENCE DE TIR','rpm',1100));
  box.appendChild(stat('PR\u00c9CISION','prec',100));
  box.appendChild(stat('PORT\u00c9E','portee',100));
  box.appendChild(stat('MOBILIT\u00c9','mob',100));
  h.appendChild(box);
  const info=document.createElement('div');
  info.style.cssText='color:#9aa0aa;font-size:12px;margin-top:10px;';
  info.textContent='Chargeur : '+cur.mag+' balles \u2014 '+(w.auto?'Automatique':'Semi-auto')+(w.pellets?' \u2014 '+w.pellets+' plombs':'');
  h.appendChild(info);

  // actions
  const act=document.createElement('div'); act.id='arm-actions';
  const bEdit=document.createElement('button'); bEdit.className='btn-orange';
  bEdit.textContent='MODIFIER';
  bEdit.onclick=()=>{
    if(!weaponUnlocked(id)){ notify('ARME VERROUILL\u00c9E','Atteignez le niveau '+w.lvl+' ou lootz-la pendant un raid.'); return; }
    App.showClassEdit = ()=>{};
    App.profile.classIdx=App.profile.classIdx||0;
    showScreen('scr-classes');
    selectPrimary(id);
  };
  act.appendChild(bEdit);
  if(cls.primary===id){
    const lbl=document.createElement('span'); lbl.className='skiplabel';
    lbl.textContent='Équipée dans la classe '+(cls.name||('Slot '+(App.profile.classIdx+1)));
    act.appendChild(lbl);
  }
  h.appendChild(act);
  det.appendChild(h);
}
function selectPrimary(id){ App.profile.classes[App.profile.classIdx].primary=id; }

/* ============ MES CLASSES ============ */
let clsAttOpen = false;
function buildClasses(){
  const p=App.profile;
  $$('#cls-tabs .ctab').forEach(b=>{
    b.classList.toggle('active', +b.dataset.slot===p.classIdx);
    b.onclick=()=>{ p.classIdx=+b.dataset.slot; Sound.click(); buildClasses(); };
  });
  const cls=p.classes[p.classIdx];
  $('#cls-name').value=cls.name||'';
  $('#cls-name').oninput=()=>{ cls.name=$('#cls-name').value; App.save(); };
  buildEquipGrid('#cls-primary','primary');
  buildEquipGrid('#cls-secondary','secondary');
  buildEquipGrid('#cls-melee','melee', true);
  buildClassAtts();
  drawClassWeapon();
}

function buildEquipGrid(sel, field, melee){
  const p=App.profile, cls=p.classes[p.classIdx];
  const grid=$(sel); grid.innerHTML='';
  const items = melee? MELEE.map(m=>({id:m.id,name:m.name,lvl:m.lvl,cat:'melee'}))
    : Object.keys(WEAPONS).filter(id=>WEAPONS[id].cat===(field==='primary'?'ar':'pistol')).map(id=>({id, ...WEAPONS[id], cat:WEAPONS[id].cat}));
  items.forEach(it=>{
    const un=melee? App.profile.level>=it.lvl : weaponUnlocked(it.id);
    const card=document.createElement('div');
    card.className='wcard'+(cls[field]===it.id?' on':'')+(un?'':' locked');
    if(!melee){ const cv=document.createElement('canvas'); cv.width=160; cv.height=56;
      drawWeaponIcon(cv,it.id,p.skinByWeap[it.id]||'none'); card.appendChild(cv); }
    const t=document.createElement('div');
    t.innerHTML='<div class="wnm">'+it.name+'</div><div class="wlv">'+(un?(melee?'M\u00eal\u00e9e':'NV '+it.lvl):'NV '+it.lvl)+'</div>';
    card.appendChild(t);
    card.onclick=()=>{
      if(!un){ notify('VERROUILL\u00c9',(melee?it.name:WEAPONS[it.id].name)+' \u2014 niveau '+it.lvl+' requis, ou lootz-le en raid.'); return; }
      cls[field]=cls[field]===it.id?null:it.id;
      Sound.click(); App.save(); buildClasses();
    };
    grid.appendChild(card);
  });
}

function buildClassAtts(){
  const p=App.profile, cls=p.classes[p.classIdx];
  const box=$('#cls-attn'); box.innerHTML='';
  $('#btn-save-class').onclick=()=>{
    App.save(); Sound.kill();
    notify('CLASSE SAUVEGARD\u00c9E', (cls.name||('Classe '+(p.classIdx+1)))+' est pr\u00eate au d\u00e9ploiement.');
  };
  const used=cls.atts.length;
  $('#cls-att-title').textContent='ACCESSOIRES ('+used+'/5)';
  const row=document.createElement('div'); row.className='att-list';
  ATTACHMENTS.forEach((a,i)=>{
    const on=cls.atts.includes(a.id), un=attUnlocked(i);
    const b=document.createElement('div');
    b.className='att'+(on?' on':'')+(un&&!un?'':'')+(un?'':' locked');
    b.textContent=a.name+(un?'':' \u2014 NV');
    b.onclick=()=>{
      if(!un){ notify('ACCESSOIRE VERROUILL\u00c9','D\u00e9bloqu\u00e9 tous les '+2+' niveaux.'); return; }
      if(on) cls.atts=cls.atts.filter(x=>x!==a.id);
      else if(cls.atts.length<5) cls.atts.push(a.id);
      else { notify('ACCESSOIRES PLEINS','Maximum 5 accessoires par classe.'); return; }
      Sound.click(); App.save(); buildClasses();
    };
    row.appendChild(b);
  });
  box.appendChild(row);
}

function drawClassWeapon(){
  const cv=$('#cls-wview');
  const p=App.profile, cls=p.classes[p.classIdx];
  const ctx=cv.getContext('2d'), W2=cv.width, H2=cv.height;
  ctx.clearRect(0,0,W2,H2);
  const id = cls.primary || cls.secondary;
  if(!id){ ctx.fillStyle='#5b616b'; ctx.font='14px sans-serif'; ctx.textAlign='center';
    ctx.fillText('Aucune arme \u00e9quip\u00e9e \u2014 s\u00e9lectionnez-en une', W2/2, H2/2); return; }
  drawWeaponIcon(cv,id,p.skinByWeap[id]||'none');
  const s=effStats(id,cls.atts);
  ctx.fillStyle='#5b9bd5'; ctx.font='11px sans-serif'; ctx.textAlign='right';
  ctx.fillText('DMG '+s.dmg+'  \u2014  '+s.rpm+' RPG  \u2014  CHARG '+s.mag, W2-8, H2-8);
}

/* ============ OP\u00c9RATEUR ============ */
function buildOperator(){
  const p=App.profile;
  const list=$('#op-outfits'); list.innerHTML='';
  Object.keys(OUTFITS).forEach(k=>{
    const o=OUTFITS[k], owned=p.outfitsOwned.includes(k);
    const d=document.createElement('div');
    d.className='outfit'+(p.outfit===k?' on':'')+(owned?'':' locked');
    d.innerHTML='<div class="sw"><i style="background:'+o.jacket+'"></i><i style="background:'+o.vest+'"></i><i style="background:'+o.helmet+'"></i><i style="background:'+o.mask+'"></i></div>'+
      '<div class="onm">'+o.name+(owned?'':' \u2014 Boutique')+'</div>';
    d.onclick=()=>{ if(!owned){ notify('TENUE VERROUILL\u00c9E','Achetez-la dans la Boutique.'); return; }
      p.outfit=k; App.save(); Sound.click(); buildOperator(); };
    list.appendChild(d);
  });
  drawOperatorFull();
}

function drawOperatorFull(){
  const cv=$('#op-view'); const c=cv.getContext('2d');
  const W2=cv.width,H2=cv.height;
  const o=OUTFITS[App.profile.outfit]||OUTFITS.black;
  c.clearRect(0,0,W2,H2);
  // fond
  const g=c.createRadialGradient(W2/2,H2*0.35,20,W2/2,H2*0.35,W2*0.8);
  g.addColorStop(0,'#1a2430'); g.addColorStop(1,'#08090c');
  c.fillStyle=g; c.fillRect(0,0,W2,H2);
  const cx=W2/2;
  // torse + veste
  c.fillStyle=o.jacket; c.beginPath();
  c.moveTo(cx-95,H2); c.quadraticCurveTo(cx-105,H2*0.62,cx-70,H2*0.45);
  c.lineTo(cx+70,H2*0.45); c.quadraticCurveTo(cx+105,H2*0.62,cx+95,H2); c.closePath(); c.fill();
  // gilet tactique
  c.fillStyle=o.vest; c.fillRect(cx-58,H2*0.5,116,150);
  c.fillStyle='rgba(255,255,255,0.05)'; c.fillRect(cx-58,H2*0.5,116,10);
  // poches chargeurs
  c.fillStyle=o.pouch;
  for(let i=0;i<3;i++){ c.fillRect(cx-46+i*34, H2*0.56, 26, 34);
    c.fillStyle='rgba(0,0,0,0.35)'; c.fillRect(cx-46+i*34, H2*0.56+8, 26, 4); c.fillStyle=o.pouch; }
  // ceinture + holsters
  c.fillStyle='#141517'; c.fillRect(cx-70,H2*0.72,140,14);
  c.fillStyle='#3a3d42'; c.fillRect(cx+34,H2*0.735,18,30);
  // bras gauche (patch ALPHA-01)
  c.fillStyle=o.arm; c.fillRect(cx-100,H2*0.5,30,120);
  c.fillStyle='#1d2024'; c.fillRect(cx-98,H2*0.58,26,22);
  c.fillStyle='#c8cdd4'; c.font='bold 9px sans-serif'; c.fillText('ALPHA-01',cx-96,H2*0.58+14);
  c.fillStyle=o.pouch; c.fillRect(cx-124,H2*0.86,26,18); // gant
  // bras droit
  c.fillStyle=o.arm; c.fillRect(cx+70,H2*0.5,30,130);
  c.fillStyle=o.pouch; c.fillRect(cx+70,H2*0.86,28,18);
  // cou + cagoule
  c.fillStyle=o.mask; c.fillRect(cx-22,H2*0.36,44,34);
  // casque
  c.fillStyle=o.helmet; c.beginPath(); c.ellipse(cx,H2*0.3,52,44,0,Math.PI,0); c.fill();
  c.fillRect(cx-52,H2*0.28,104,10);
  // visi\u00e8re / lunettes NVG
  c.fillStyle='#0c0e12'; c.fillRect(cx-30,H2*0.335,60,12);
  c.fillStyle='#3d81c4'; c.fillRect(cx-22,H2*0.34,14,6); c.fillRect(cx+6,H2*0.34,14,6);
  c.fillStyle=o.helmet; c.fillRect(cx-14,H2*0.19,8,16); // fixation NVG
  c.fillStyle='#14161a'; c.fillRect(cx-16,H2*0.13,12,8);
  // arme tenue en travers (rifle, assombrot)
  c.save(); c.translate(cx,H2*0.66); c.rotate(-0.18);
  const tmp=document.createElement('canvas'); tmp.width=360; tmp.height=100;
  const id=(App.profile.classes[0].primary)||'m4a1';
  drawWeaponIcon(tmp,id,App.profile.skinByWeap[id]||'none');
  tc_dark(tmp);
  c.drawImage(tmp,-150,-30,340,95);
  c.restore();
  drawAvatar($('.mm-avatar')||$('#mm-avatar'));
}
function tc_dark(cv){
  const c=cv.getContext('2d');
  c.globalCompositeOperation='source-atop';
  c.fillStyle='rgba(0,0,0,0.22)';
  c.fillRect(0,0,cv.width,cv.height);
  c.globalCompositeOperation='source-over';
}
function shade(hex,amt){
  const n=parseInt(hex.slice(1),16);
  let r=clamp((n>>16)+amt,0,255), g=clamp(((n>>8)&255)+amt,0,255), b=clamp((n&255)+amt,0,255);
  return 'rgb('+r+','+g+','+b+')';
}

/* ============ PARAM\u00c8TRES ============ */
const BINDS=[['Avancer','Z'],['Reculer','S'],['Gauche','Q'],['Droite','D'],['Sauter / Monter','ESPACE'],
  ['Sprint','MAJ'],['Tirer','CLIC GAUCHE'],['Viser','CLIC DROIT'],['Recharger','R'],['Interagir / Ramasser','E'],
  ['Exfiltrer','F'],['Tableau du butin','TAB'],['Pause','\u00c9CHAP']];
function buildSettings(){
  $$('#set-tabs .stab').forEach(b=>{
    b.classList.toggle('active', b.dataset.t===App.setTab);
    b.onclick=()=>{ App.setTab=b.dataset.t; Sound.click(); buildSettings(); };
  });
  const body=$('#set-body'); const st=App.profile.settings;
  const T=App.setTab||'general';
  body.innerHTML='';
  const wrap=document.createElement('div'); wrap.className='set-cols';
  const col=(html)=>{ const d=document.createElement('div'); d.className='set-col'; d.innerHTML=html; wrap.appendChild(d); return d; };
  const sub=(t)=>'<div class="set-sub">'+t+'</div>';
  const slider=(label,val,cb)=>'<div class="orow"><span class="olab">'+label+'</span><div class="oright"><input class="range" type="range" min="0" max="100" value="'+val+'"><span class="oval">'+val+'%</span></div></div>';
  const opts=(label,vals,cur,cb)=>{
    let s='<div class="orow"><span class="olab">'+label+'</span><div class="oright"><div class="seg">';
    vals.forEach(v=>{ s+='<button class="'+(v===cur?'on':'')+'" data-v="'+v+'">'+v+'</button>'; });
    return s+'</div></div></div>';
  };
  const toggle=(label,on,cb)=>'<div class="orow"><span class="olab">'+label+'</span><div class="oright"><div class="toggle '+(on?'on':'')+'"><i></i></div></div></div>';

  if(T==='general'){
    const c1=col(sub('LANGUE')+
      '<div class="orow"><span class="olab">Langue</span><div class="oright"><span class="oval" style="text-align:left"><span class="flag"></span>Fran\u00e7ais</span></div></div>'+
      sub('JEU')+
      '<div class="orow"><span class="olab">Notification de butin</span><div class="oright"><div class="toggle on"><i></i></div></div></div>'+
      '<div class="orow"><span class="olab">Affichage FPS</span><div class="oright"><div class="toggle '+(st.fps?'on':'')+'" id="t-fps"><i></i></div></div></div>'+
      sub('PROFIL')+
      '<div class="orow"><span class="olab">Compte</span><div class="oright"><span class="oval" style="text-align:left">'+App.profile.name+' \u2014 niveau '+App.profile.level+'</span></div></div>'+
      '<button class="btn-ghost" id="btn-open-op">PERSONNALISER L\u2019OP\u00c9RATEUR (TENUE)</button>');
    c1.querySelector('#btn-open-op').onclick=()=>showScreen('scr-operator');
    c1.querySelector('#t-fps').onclick=function(){ st.fps=!st.fps; this.classList.toggle('on',st.fps); App.save(); };
  }
  if(T==='gfx'){
    const c1=col(sub('QUALIT\u00c9')+opts('R\u00e9solution',['Basse','Moyenne','Haute'],st.res)+
      toggle('Brouillard / distance',st.fog)+
      toggle('Particules (neige, sable)',st.particles)+
      '<div class="orow"><span class="olab">Champ de vision (FOV)</span><div class="oright"><input class="range" type="range" min="60" max="100" value="'+st.fov+'"><span class="oval">'+st.fov+'</span></div></div>');
    c1.querySelectorAll('.seg button').forEach(b=>b.onclick=()=>{ st.res=b.dataset.v; App.save(); Sound.click(); buildSettings(); });
    c1.querySelectorAll('.toggle').forEach(t=>t.onclick=function(){ this.classList.toggle('on'); st.fog=c1.querySelectorAll('.toggle')[0].classList.contains('on'); st.particles=c1.querySelectorAll('.toggle')[1].classList.contains('on'); App.save(); });
    const c2=col(sub('VISEUR'));
    const pv=document.createElement('canvas'); pv.id='ch-preview'; c2.appendChild(pv);
    c2.insertAdjacentHTML('beforeend',
      '<div class="orow"><span class="olab">Style</span><div class="oright"><div class="seg" id="ch-style">'+['croix','point','croix + point','cercle'].map((v,i)=>'<button class="'+(i===st.cross._s?'on':'')+'" data-v="'+i+'">'+v+'</button>').join('')+'</div></div></div>'+
      '<div class="orow"><span class="olab">Couleur</span><div class="oright"><input type="color" id="ch-color" value="'+st.cross.color+'" style="width:100%;height:34px;background:#12141a;border:1px solid #2a2c33;padding:2px;"></div></div>'+
      '<div class="orow"><span class="olab">Taille</span><div class="oright"><input class="range" id="ch-size" type="range" min="2" max="20" value="'+st.cross.size+'"><span class="oval">'+st.cross.size+'</span></div></div>'+
      '<div class="orow"><span class="olab">\u00c9paisseur</span><div class="oright"><input class="range" id="ch-thick" type="range" min="1" max="5" value="'+st.cross.thick+'"><span class="oval">'+st.cross.thick+'</span></div></div>'+
      '<div class="orow"><span class="olab">\u00c9cart</span><div class="oright"><input class="range" id="ch-gap" type="range" min="0" max="14" value="'+st.cross.gap+'"><span class="oval">'+st.cross.gap+'</span></div></div>');
    if(st.cross._s===undefined) st.cross._s=0;
    c2.querySelectorAll('#ch-style button').forEach(b=>b.onclick=()=>{ st.cross._s=+b.dataset.v; st.cross.style=['cross','dot','crossdot','circle'][st.cross._s]; App.save(); buildSettings(); });
    c2.querySelector('#ch-color').oninput=e=>{ st.cross.color=e.target.value; App.save(); drawCrossPreview(); };
    c2.querySelector('#ch-size').oninput=e=>{ st.cross.size=+e.target.value; e.target.nextElementSibling.textContent=e.target.value; App.save(); drawCrossPreview(); };
    c2.querySelector('#ch-thick').oninput=e=>{ st.cross.thick=+e.target.value; e.target.nextElementSibling.textContent=e.target.value; App.save(); drawCrossPreview(); };
    c2.querySelector('#ch-gap').oninput=e=>{ st.cross.gap=+e.target.value; e.target.nextElementSibling.textContent=e.target.value; App.save(); drawCrossPreview(); };
    drawCrossPreview();
  }
  if(T==='audio'){
    const ca=col(sub('VOLUME')+
      slider('Volume g\u00e9n\u00e9ral',st.volGen)+
      slider('Musique',st.volMus)+
      slider('Effets sonores',st.volSfx));
    const keys=['volGen','volMus','volSfx'];
    ca.querySelectorAll('input.range').forEach((r,i)=>{
      r.oninput=e=>{ const v=+e.target.value; e.target.nextElementSibling.textContent=v+'%';
        st[keys[i]]=v; App.save(); Sound.apply(); };
    });
  }
  if(T==='controls'){
    col(sub(' Souris')+
      '<div class="orow"><span class="olab">Sensibilit\u00e9</span><div class="oright"><input class="range" type="range" min="1" max="100" value="'+st.sens+'"><span class="oval">'+st.sens+'%</span></div></div>'+
      '<div class="orow"><span class="olab">Inverser l\u2019axe Y</span><div class="oright"><div class="toggle"><i></i></div></div></div>')+
    col(sub('TOUCHES')+ '<div>'+(BINDS.map(b=>'<div class="orow"><span class="olab">'+b[0]+'</span><div class="oright"><span class="oval" style="text-align:right"><b>'+b[1]+'</b></span></div></div>').join(''))+'</div>');
    wrap.querySelectorAll('.set-col input.range').forEach(r=>{
      r.oninput=e=>{ st.sens=+e.target.value; e.target.nextElementSibling.textContent=e.target.value+'%'; App.save(); };
      r.nextElementSibling.textContent=r.value+'%';
    });
  }
  body.appendChild(wrap);
}
function drawCrossPreview(){
  const pv=$('#ch-preview'); if(!pv) return;
  const pvctx=pv.getContext('2d');
  pvctx.clearRect(0,0,pv.width,pv.height);
  drawCrosshairOn(pvctx,pv.width/2,pv.height/2,App.profile.settings.cross,1);
}
function drawCrosshairOn(c,x,y,cr,spread){
  if(!cr) return;
  c.save(); c.fillStyle=cr.color; c.strokeStyle=cr.color;
  const th=cr.thick||2, len=cr.size||7, gap=(cr.gap||4)+(spread||0);
  if(cr.style==='cross'||cr.style==='crossdot'){
    c.fillRect(x-gap-len,y-th/2,len,th); c.fillRect(x+gap,y-th/2,len,th);
    c.fillRect(x-th/2,y-gap-len,th,len); c.fillRect(x-th/2,y+gap,th,len);
  }
  if(cr.style==='circle'){
    c.lineWidth=th; c.beginPath();
    c.arc(x,y,gap+Math.max(4,len),0,Math.PI*2); c.stroke();
  }
  if(cr.style==='dot'||cr.style==='crossdot'||cr._dot){
    c.beginPath(); c.arc(x,y,Math.max(1.5,th),0,Math.PI*2); c.fill();
  }
  c.restore();
}

/* ============ PROGRESSION ============ */
function buildProgress(){
  const p=App.profile;
  const need=XP_FOR(p.level);
  let html='<div class="prow"><div class="wlv-big">NV '+p.level+'</div><div style="flex:1">'+
    '<div class="xpbar"><i style="width:'+(p.xp/need*100)+'%"></i></div>'+
    '<div style="font-size:12px;color:#9aa0aa;margin-top:6px">'+p.xp+' / '+need+' XP \u2014 prochaine r\u00e9compense bient\u00f4t</div></div></div>';
  const stats=[['Raids jou\u00e9s',p.raidCount],['Exfiltrations r\u00e9ussies',p.extractions],['Mises \u00e0 mort',p.kills],['Objets r\u00e9cup\u00e9r\u00e9s',p.loots],['Morts',p.deaths]];
  html+=sub2('STATISTIQUES')+'<table class="un"><tr><th>BUTIN</th><th>R\u00c9SULTAT</th></tr>'+stats.map(s=>'<tr><td>'+s[0]+'</td><td>'+s[1]+'</td></tr>').join('')+'</table>';
  html+=sub2('ARMES D\u00c9BLOQU\u00c9ES')+'<table class="un"><tr><th>ARME</th><th>NIVEAU REQUIS</th><th>\u00c9TAT</th></tr>';
  Object.keys(WEAPONS).forEach(id=>{ const w=WEAPONS[id];
    const ok=weaponUnlocked(id);
    html+='<tr><td>'+w.name+'</td><td>NV '+w.lvl+'</td><td>'+(ok?'<span class="own">\u2713 D\u00c9BLOQU\u00c9E</span>':'<span style="color:#8a4a44">Verrouill\u00e9e</span>')+'</td></tr>'; });
  html+='</table>';
  function sub2(t){ return '<div class="set-sub" style="border-bottom:1px solid #1e2128;">'+t+'</div>'; }
  $('#prog-body').innerHTML=html;
}

/* ============ BOUTIQUE ============ */
const SHOP_ITEMS = [
  {type:'skin', id:'arctic'},{type:'skin',id:'desert'},{type:'skin',id:'forest'},
  {type:'skin', id:'crimson'},{type:'skin',id:'gold'},{type:'skin',id:'hazard'},
  {type:'outfit', id:'arctic'},{type:'outfit', id:'desert'},{type:'outfit', id:'forest'},{type:'outfit', id:'hazard'}
];
function buildShop(){
  const p=App.profile;
  $('#shop-cash').textContent=fmtN(p.cash);
  const body=$('#shop-body'); body.innerHTML='<div class="shrow"></div>';
  const row=body.querySelector('.shrow');
  SHOP_ITEMS.forEach(it=>{
    const d=document.createElement('div'); d.className='shitem';
    const cv=document.createElement('canvas'); cv.width=160; cv.height=70;
    const cn=it.type==='skin'? SKINS[it.id].name : OUTFITS[it.id].name;
    const price=it.type==='skin'? SKINS[it.id].price : OUTFITS[it.id].price;
    const owned=it.type==='skin'? p.skinsOwned.includes(it.id) : p.outfitsOwned.includes(it.id);
    if(it.type==='skin') drawWeaponIcon(cv,'m4a1',it.id);
    else { // mini tenue
      const c=cv.getContext('2d'); const o=OUTFITS[it.id];
      c.fillStyle=o.helmet; c.fillRect(30,6,44,30); c.fillStyle=o.mask; c.fillRect(36,32,32,20);
      c.fillStyle=o.jacket; c.fillRect(14,54,76,16); c.fillStyle=o.vest; c.fillRect(30,54,44,16);
      d.appendChild(cv);
    }
    if(it.type==='skin') d.appendChild(cv);
    d.insertAdjacentHTML('beforeend','<div class="snm">'+cn+' <span style="color:#6d8aa5;font-size:10px">('+(it.type==='skin'?'SKIN D\u2019ARME':'TENUE')+')</span></div>'+
      '<div class="sprice">'+(owned?'':fmtN(price)+' \u25cf')+'</div>');
    const b=document.createElement('button');
    b.className=owned?'btn-ghost':'btn-orange';
    b.textContent=owned?'D\u00c9TENU':'ACHETER';
    b.onclick=()=>{
      if(owned) return;
      if(p.cash<price){ notify('FONDS INSUFFISANTS','Vous avez besoin de '+fmtN(price)+' \u25cf. Exfiltrez du butin pour en gagner.'); return; }
      p.cash-=price;
      if(it.type==='skin') p.skinsOwned.push(it.id); else p.outfitsOwned.push(it.id);
      App.save(); Sound.kill(); notify('ACHAT EFFECTU\u00c9', cn+' vous appartient d\u00e9sormais.');
      buildShop();
    };
    d.appendChild(b); row.appendChild(d);
  });
}

/* ============ STASH ============ */
function buildStash(){
  const p=App.profile;
  const body=$('#stash-body');
  let html='<div style="color:#9aa0aa;font-size:13px;margin-bottom:16px">Toutes les armes r\u00e9cup\u00e9r\u00e9es en raid, m\u00eame si vous \u00eates tomb\u00e9 au combat. Elles restent dans votre Armurerie \u2014 utilisez-les dans vos classes.</div>';
  html+='<div class="shrow">';
  const all=p.unlocked.length? p.unlocked : Object.keys(WEAPONS).filter(id=>weaponUnlocked(id));
  if(!p.unlocked.length){
    html+='<div style="color:#8a8d95">Caisse vide \u2014 partez en raid dans la VILLE EN RUINES et ramassez des armes (touche E) pour remplir votre stash.</div>';
  } else {
    html+= p.unlocked.map(id=>{ const w=WEAPONS[id]; return '<div class="strow;"><div class="wnode" style="border:none;background:transparent;width:420px"><div class="wname">'+(w?w.name:id)+'</div><div class="wlv">'+(w?CATNAMES[w.cat]:'')+'</div></div><span class="own">\u2713</span></div>'; }).join('');
  }
  html+='</div>';
  body.innerHTML=html;
  body.querySelectorAll('.strow').forEach((r,i)=>{ const cv=document.createElement('canvas'); cv.width=160; cv.height=56;
    drawWeaponIcon(cv,p.unlocked[i],'none'); r.insertBefore(cv, r.firstChild); });
}

/* ============ CARTE DE D\u00c9PLOIEMENT ============ */
const ZONES = {
  nord:   {name:'ZONE NORD (BASE)',  color:'#dde8ef', desc:'Base militaire enneig\u00e9e en haute altitude. Garnisons lourdes,镇江 loot rare. Extraction cl\u00e9 en main.'},
  ouest:  {name:'ZONE OUEST (ZO)',   color:'#9aa2a8', desc:'Zone d\u2019op\u00e9rations ouverte : usines et entrep\u00f4ts abandonn\u00e9s. Beaucoup de loot, beaucoup d\u2019IA.'},
  centre: {name:'VILLE EN RUINES',   color:'#8a8d95', desc:'Le c\u0153ur d\u00e9vast\u00e9 de l\u2019\u00eele. Butin de qualit\u00e9 dans les immeubles effondr\u00e9s.'},
  village:{name:'VILLAGE (EST)',     color:'#7da05c', desc:'Habitations intactes, \u00e9glise et fermes. Loot solide, ennemis nerveux.'},
  sud:    {name:'ZONE SUD',          color:'#c2a46b', desc:'Biome sablonneux, palmiers et avant-postes isol\u00e9s. Ceinture duhafte s\u00fbre.'}
};
let pickZone='centre';
function drawIsland(){
  const cv=$('#island-map'); const c=cv.getContext('2d');
  const W2=cv.width, H2=cv.height;
  c.fillStyle='#0d1b2a'; c.fillRect(0,0,W2,H2);
  // \u00eele (polygon)
  c.fillStyle='#274b31';
  c.beginPath();
  c.moveTo(W2*0.12,H2*0.3); c.quadraticCurveTo(W2*0.2,H2*0.04,W2*0.5,H2*0.06);
  c.quadraticCurveTo(W2*0.82,H2*0.1,W2*0.9,H2*0.35);
  c.quadraticCurveTo(W2*0.97,H2*0.6,W2*0.8,H2*0.88);
  c.quadraticCurveTo(W2*0.5,H2*0.98,W2*0.24,H2*0.9);
  c.quadraticCurveTo(W2*0.03,H2*0.7,W2*0.12,H2*0.3); c.closePath();
  c.fill();
  // zones de biome
  const zone=(y0,y1,color)=>{ c.save(); c.globalAlpha=0.85; c.fillStyle=color; c.fillRect(0,y0,W2,y1-y0); c.restore(); };
  // Clip l'\u00eele? simple: redessiner les rect zone clipped par le path
  c.save(); c.clip();
  // redessiner les rect zones clippées par le path de l’île
  zone(H2*0.0, H2*0.36, '#cfd9de');          // neige
  zone(H2*0.36,H2*0.42, '#a7b6a0');
  zone(H2*0.42,H2*0.72, '');                  // ruines (vert fond)
  zone(H2*0.72,H2*0.82, '#a8b26a');
  zone(H2*0.82,H2*1.0,  '#c8a76a');          // sable
  c.fillStyle='#5a6870'; c.fillRect(W2*0.06,H2*0.4,W2*0.34,H2*0.34); // ouest urbain
  c.fillStyle='#6b7075'; c.fillRect(W2*0.34,H2*0.34,W2*0.34,H2*0.3); // centre
  c.restore();
  // village
  c.save(); c.beginPath(); c.moveTo(W2*0.12,H2*0.3); c.quadraticCurveTo(W2*0.2,H2*0.04,W2*0.5,H2*0.06);
  c.quadraticCurveTo(W2*0.82,H2*0.1,W2*0.9,H2*0.35); c.quadraticCurveTo(W2*0.97,H2*0.6,W2*0.8,H2*0.88);
  c.quadraticCurveTo(W2*0.5,H2*0.98,W2*0.24,H2*0.9); c.quadraticCurveTo(W2*0.03,H2*0.7,W2*0.12,H2*0.3); c.closePath(); c.clip();
  // eau
  c.fillStyle='#123a52'; c.beginPath(); c.ellipse(W2*0.82,H2*0.62,60,36,0.4,0,Math.PI*2); c.fill();
  c.fillStyle='#123a52'; c.fillRect(W2*0.3,H2*0.28,220,7);
  // routes
  c.strokeStyle='#b8b39a'; c.lineWidth=4;
  c.beginPath(); c.moveTo(W2*0.2,H2*0.62); c.lineTo(W2*0.86,H2*0.6); c.moveTo(W2*0.5,H2*0.1); c.lineTo(W2*0.48,H2*0.92);
  c.moveTo(W2*0.22,H2*0.3); c.lineTo(W2*0.7,H2*0.55); c.stroke();
  // batiments (petites cases)
  const bld=(x,y,w,h,col)=>{ c.fillStyle=col; c.fillRect(x,y,w,h); };
  for(let i=0;i<26;i++) bld(W2*0.08+((i*53)%180), H2*0.36+((i*29)%120), 9,7, '#4a4f55');
  for(let i=0;i<22;i++) bld(W2*0.4+((i*47)%140), H2*0.36+((i*31)%90), 10,8, '#55595f');
  for(let i=0;i<14;i++) bld(W2*0.62+((i*37)%110), H2*0.42+((i*23)%80), 8,9, '#6e6455');
  for(let i=0;i<12;i++) bld(W2*0.16+((i*61)%150), H2*0.1+((i*41)%70), 12,10, '#6d7681'); // base nord
  for(let i=0;i<10;i++) bld(W2*0.35+((i*67)%180), H2*0.8+((i*19)%60), 9,7, '#967d54');
  c.restore();
  // montagnes nord
  c.strokeStyle='#7d8994'; c.lineWidth=3;
  c.beginPath(); c.moveTo(W2*0.16,H2*0.2); c.lineTo(W2*0.27,H2*0.08); c.lineTo(W2*0.38,H2*0.2);
  c.moveTo(W2*0.33,H2*0.24); c.lineTo(W2*0.45,H2*0.1); c.lineTo(W2*0.56,H2*0.24); c.stroke();
  // labels zones
  c.font='bold 12px sans-serif'; c.textAlign='center';
  const label=(t,x,y,col)=>{ c.fillStyle='rgba(0,0,0,0.5)'; c.fillRect(x-86,y-14,172,20); c.fillStyle=col; c.fillText(t,x,y); };
  label('ZONE NORD (BASE)', W2*0.3, H2*0.16, '#22303c');
  label('ZONE OUEST (ZO)', W2*0.22, H2*0.55, '#e8eef2');
  label('VILLE EN RUINES', W2*0.52, H2*0.5, '#f0e8d8');
  label('VILLAGE (EST)', W2*0.78, H2*0.44, '#152410');
  label('ZONE SUD', W2*0.5, H2*0.88, '#3a2c14');
  // LZ extraction
  [[0.5,0.12,'LZ BASE NORD'],[0.24,0.66,'LZ VILLE'],[0.72,0.6,'LZ VILLAGE']].forEach(lz=>{
    c.strokeStyle='#39d465'; c.lineWidth=2; c.setLineDash([5,4]);
    c.beginPath(); c.arc(W2*lz[0],H2*lz[1],17,0,Math.PI*2); c.stroke(); c.setLineDash([]);
    c.fillStyle='#39d465'; c.font='bold 9px sans-serif'; c.fillText(lz[2], W2*lz[0], H2*lz[1]+30);
  });
  c.restore();
  // Sélection
  cv.onclick=(e)=>{
    const r=cv.getBoundingClientRect();
    const x=(e.clientX-r.left)/r.width*W2, y=(e.clientY-r.top)/r.height*H2;
    let z='centre';
    if(y<H2*0.34) z='nord';
    else if(y>H2*0.74 && x<W2*0.72) z='sud';
    else if(x>W2*0.68) z='village';
    else if(x<W2*0.38) z='ouest';
    pickZone=z; Sound.click(); drawIsland();
  };
  // surligner zone sélectionnée
  const pos={nord:[0.3,0.18], ouest:[0.22,0.55], centre:[0.52,0.5], village:[0.78,0.44], sud:[0.5,0.88]}[pickZone];
  c.strokeStyle='#f0862c'; c.lineWidth=3;
  c.beginPath(); c.arc(W2*pos[0],H2*pos[1],24,0,Math.PI*2); c.stroke();
  c.fillStyle='#f0862c'; c.beginPath(); c.arc(W2*pos[0],H2*pos[1],4,0,Math.PI*2); c.fill();
  const zi=$('#zone-name'), zd=$('#zone-desc');
  zi.textContent=ZONES[pickZone].name; zd.textContent=ZONES[pickZone].desc;
  $('#btn-deploy').disabled=false;
}
$('#btn-deploy').onclick=()=>{ Sound.click(); Game.start(pickZone); };
