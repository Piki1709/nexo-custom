/* =====================================================================
   designer.js · Diseñador 3D de camisetas
   Flujo general:
   1) loadModel()  decodifica la geometría 3D incrustada en js/model-*.js
   2) paint()      dibuja el diseño (colores, patrón, textos, escudo) en un
                   canvas 2D que funciona como TEXTURA del modelo
   3) Three.js     muestra el modelo con esa textura y deja girarlo
   4) Arrastre     un "rayo" desde el puntero detecta en qué punto de la
                   prenda se toca; con eso se mueven textos y escudo libremente
   ===================================================================== */
(()=>{'use strict';
const $=s=>document.querySelector(s);   // atajo para document.querySelector

/* ---------- Estado y configuración ---------- */
const T=matchMedia('(max-width:700px)').matches?1024:2048;   // tamaño de la textura (menor en celulares)
const cv=document.createElement('canvas');cv.width=cv.height=T;const cx=cv.getContext('2d'); // textura final (no se muestra en pantalla)
const tp=document.createElement('canvas');tp.width=tp.height=T;const tx=tp.getContext('2d'); // lienzo temporal para armar cada zona
// S = todo lo que eligió la persona. slp = patrón también en mangas. sel = elemento seleccionado.
const S={sport:'tee',pat:'stripes',slp:false,c:{},name:'',num:'10',txt:'',crest:null,size:'M',fit:'fan',qty:1,sel:'num'};
const M={};   // caché de modelos ya cargados
let noSel=false;   // true mientras se exporta (para no dibujar el recuadro de selección)
// Tablas de talles (cm). tee: [talle, hincha ancho×largo, jugador ancho×largo]. bask: [talle, ancho, largo]
const SZ={tee:[['S','48–50 × 69–71','46–48 × 68–70'],['M','50–52 × 71–73','48–50 × 70–72'],['L','52–54 × 73–75','50–52 × 72–74'],['XL','54–56 × 75–77','52–54 × 74–76'],['XXL','56–58 × 77–79','54–56 × 76–78']],
 bask:[['S','50–52','72–74'],['M','52–54','74–76'],['L','54–56','76–78'],['XL','56–58','78–80'],['XXL','58–60','80–82']]};
// Colores editables: [clave en S.c, clave de traducción]. Si termina en "_" se le suma el deporte (tee/bask)
const CK=[['base','c_base'],['p1','c_p1'],['p2','c_p2'],['side','c_side_'],['trim','c_trim_'],['text','c_text'],['out','c_out']];

/* ---------- Elementos movibles: nombre, número, número al frente, texto y escudo ----------
   Cada uno guarda: side (1=frente, 2=espalda), x e y (0 a 1 dentro de la pieza), s (tamaño), r (giro en grados), on (visible) */
const E={};
const ORDER=['crest','txt','name','numf','num'];   // orden de dibujo (el último queda arriba)
// Posiciones iniciales por prenda: [lado, x, y, visible]
const DEF={tee:{name:[2,.5,.23],num:[2,.5,.52],txt:[1,.5,.40],crest:[1,.5,.27],numf:[1,.5,.5,false]},
           bask:{name:[2,.5,.30],num:[2,.5,.66],txt:[1,.5,.40],crest:[1,.5,.30],numf:[1,.5,.66,true]}};
function resetEl(){
  Object.entries(DEF[S.sport]).forEach(([k,v])=>E[k]={side:v[0],x:v[1],y:v[2],s:1,r:0,on:v[3]!==false,box:null});
  const nf=$('#numf');if(nf)nf.checked=E.numf.on;
}
let raf,mesh,tex,mat,scene,cam,renderer,ctl;   // objetos de Three.js

/* ---------- 1. Carga de modelos ---------- */
// Convierte la imagen de máscara de zonas en un canvas por zona (1=frente, 2=espalda, 3=mangas/laterales, 4=cuello/ribetes)
const mk=src=>new Promise(r=>{const im=new Image();im.onload=()=>{
  const c=document.createElement('canvas');c.width=c.height=T;const x=c.getContext('2d',{willReadFrequently:true});
  x.imageSmoothingEnabled=false;x.drawImage(im,0,0,T,T);const d=x.getImageData(0,0,T,T).data,out=[];
  for(let z=1;z<=4;z++){const o=document.createElement('canvas');o.width=o.height=T;const ox=o.getContext('2d'),id=ox.createImageData(T,T),a=id.data;
    for(let i=0;i<T*T;i++)if(d[i*4]===z)a[i*4+3]=255;   // pixel opaco donde la máscara vale z
    ox.putImageData(id,0,0);out[z]=o}
  r(out)};im.src=src});
// Decodifica la geometría (base64 + zlib) guardada en NEXO_MODELS[k]
async function loadModel(k){
  if(M[k])return M[k];
  const d=NEXO_MODELS[k],bin=Uint8Array.from(atob(d.data),c=>c.charCodeAt(0));
  const ab=await new Response(new Blob([bin]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer();
  const n=d.nv;let o=0;const sl=l=>{const r=ab.slice(o,o+l);o+=l;return r};
  // Orden de los datos: posiciones (int16), normales (int8), UV (uint16), índices (uint32)
  const p=new Int16Array(sl(n*6)),nr=new Int8Array(sl(n*3)),uv=new Uint16Array(sl(n*4)),idx=new Uint32Array(sl(d.ni*4));
  const pos=new Float32Array(n*3),nor=new Float32Array(n*3),u=new Float32Array(n*2);
  for(let i=0;i<n*3;i++){pos[i]=p[i]/12000;nor[i]=nr[i]/127}
  for(let i=0;i<n*2;i++)u[i]=uv[i]/65535;
  return M[k]={pos,nor,uv:u,idx,masks:await mk(d.mask),isl:d.islands};
}

/* ---------- 2. Textura: dibujo del diseño ---------- */
// Ejecuta fn(ancho,alto) dentro del sistema de coordenadas de una pieza (isla UV). Si está invertida, la voltea.
function isl(c,i,fn,p=0){const[u0,v0,u1,v1]=i[1],W=(u1-u0)*T+2*p,H=(v1-v0)*T+2*p;
  c.save();c.translate(u0*T-p,v0*T-p);if(i[2]){c.translate(0,H);c.scale(1,-1)}fn(W,H);c.restore()}
// Escribe texto con contorno en (x,y), reduciendo la letra si no entra en el ancho W. Devuelve el ancho usado.
function txt(c,s,x,y,fs,W){
  const f=n=>`800 ${n}px "Barlow Condensed",Impact,sans-serif`;
  c.font=f(fs);c.textAlign='center';c.textBaseline='middle';
  let w=c.measureText(s).width;if(w>W){fs*=W/w;w=W;c.font=f(fs)}
  c.lineJoin='round';c.lineWidth=fs*.12;c.strokeStyle=S.c.out;c.strokeText(s,x,y);c.fillStyle=S.c.text;c.fillText(s,x,y);
  return w}
// Dibuja un elemento (texto o escudo) en su posición, tamaño y giro. Guarda su caja (e.box) para poder tocarlo después.
function drawEl(c,id,W,H){
  const e=E[id];e.box=null;if(!e.on)return;
  let w=0,h=0;
  c.save();c.translate(e.x*W,e.y*H);c.rotate(e.r*Math.PI/180);
  if(id=='crest'){
    if(S.crest){const im=S.crest,r=im.width/im.height,s=(S.sport=='tee'?.17:.15)*W*e.s;w=r>1?s:s*r;h=r>1?s/r:s;c.drawImage(im,-w/2,-h/2,w,h)}
  }else{
    const str=id=='name'?S.name.toUpperCase():id=='txt'?S.txt:S.num;   // numf y num muestran el mismo número
    if(str){const fs=H*(id=='name'?.07:id=='txt'?.06:(S.sport=='tee'?.34:.3))*e.s;w=txt(c,str,0,0,fs,W*.9);h=fs}
  }
  if(w){e.box=[w/W,h/H];   // tamaño relativo, para detectar toques
    if(!noSel&&S.sel==id){c.setLineDash([14,10]);c.lineWidth=5;c.strokeStyle='#C9A84C';c.strokeRect(-w/2-12,-h/2-12,w+24,h+24)}}   // recuadro dorado de selección
  c.restore();
}
// Pinta toda la textura según el estado S
function paint(){
  const m=M[S.sport];if(!m)return;const c=S.c,k={base:c.base,p1:c.p1,p2:c.p2},tee=S.sport=='tee';
  cx.clearRect(0,0,T,T);
  for(let z=1;z<=4;z++){   // una pasada por zona
    tx.globalCompositeOperation='source-over';tx.clearRect(0,0,T,T);
    if(z<3)m.isl.filter(i=>i[0]===z).forEach(i=>isl(tx,i,(W,H)=>NX.draw(tx,S.pat,W,H,k),12));   // frente/espalda: patrón
    else{
      if(z==3&&tee&&S.slp)m.isl.filter(i=>i[0]===3).forEach(i=>isl(tx,i,(W,H)=>NX.draw(tx,S.pat,W,H,k),12));  // mangas con patrón
      else{tx.fillStyle=z==3?c.side:c.trim;tx.fillRect(0,0,T,T)}                                              // mangas-laterales / cuello-ribetes lisos
      if(z==3&&tee)m.isl.filter(i=>i[0]===3).forEach(i=>isl(tx,i,(W,H)=>{tx.fillStyle=c.trim;tx.fillRect(0,H*.88,W,H*.2)},12)) // puños
    }
    tx.globalCompositeOperation='destination-in';tx.drawImage(m.masks[z],0,0);   // recorta con la máscara de la zona
    cx.drawImage(tp,0,0)}                                                         // suma la zona a la textura final
  // Textos y escudo encima del diseño, según el lado (1=frente, 2=espalda) en que estén
  [1,2].forEach(side=>{const i=m.isl.find(q=>q[0]===side);isl(cx,i,(W,H)=>ORDER.forEach(id=>{if(E[id].side===side)drawEl(cx,id,W,H)}))});
  if(tex)tex.needsUpdate=true;   // avisa a Three.js que la textura cambió
}
// Agrupa varios cambios seguidos en un solo repintado
const redraw=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(paint)};

/* ---------- 3. Detección de toques sobre la prenda ---------- */
// Convierte un punto UV de la textura en coordenadas de la pieza frente/espalda (fx, fy de 0 a 1)
function loc(uv){
  for(const i of M[S.sport].isl){if(i[0]>2)continue;const[u0,v0,u1,v1]=i[1];
    if(uv.x>=u0&&uv.x<=u1&&uv.y>=v0&&uv.y<=v1){let fy=(uv.y-v0)/(v1-v0);if(i[2])fy=1-fy;   // si la pieza está volteada, se invierte
      return{side:i[0],fx:(uv.x-u0)/(u1-u0),fy,W:(u1-u0)*T,H:(v1-v0)*T}}}
  return null}
// Devuelve el id del elemento que está bajo el punto p (o null). Tiene en cuenta el giro del elemento.
function hit(p){
  for(const id of [...ORDER].reverse()){const e=E[id];if(!e.on||!e.box||e.side!==p.side)continue;
    const dx=(p.fx-e.x)*p.W,dy=(p.fy-e.y)*p.H,a=-e.r*Math.PI/180,rx=dx*Math.cos(a)-dy*Math.sin(a),ry=dx*Math.sin(a)+dy*Math.cos(a);
    if(Math.abs(rx)<=e.box[0]*p.W/2+20&&Math.abs(ry)<=e.box[1]*p.H/2+20)return id}
  return null}
// Selecciona un elemento: actualiza botones y deslizadores
function selEl(id){
  S.sel=id;document.querySelectorAll('[data-el]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.el==id));
  $('#esz').value=E[id].s;$('#erot').value=E[id].r;redraw()}

/* ---------- 4. Escena 3D (Three.js) ---------- */
function init3d(){
  renderer=new THREE.WebGLRenderer({canvas:$('#gl'),antialias:true,alpha:true,preserveDrawingBuffer:true}); // preserveDrawingBuffer permite descargar la imagen
  renderer.outputEncoding=THREE.sRGBEncoding;
  scene=new THREE.Scene();
  cam=new THREE.PerspectiveCamera(32,1,.1,50);cam.position.set(0,0,5.2);   // la cámara mira la prenda de frente
  // Luces: ambiente suave + dos direccionales (principal y contraluz)
  scene.add(new THREE.HemisphereLight(0xffffff,0x8899aa,.85));
  const a=new THREE.DirectionalLight(0xffffff,.8);a.position.set(2,3,4);scene.add(a);
  const b=new THREE.DirectionalLight(0xffffff,.4);b.position.set(-3,1,-4);scene.add(b);

  // --- Arrastre de textos y escudo (se registra ANTES de OrbitControls para poder bloquear el giro) ---
  const dom=renderer.domElement,ray=new THREE.Raycaster(),ndc=new THREE.Vector2();let drag=null,mv=null,busy=false;
  // Lanza un rayo desde el puntero y devuelve dónde toca la prenda (o null)
  const pick=ev=>{const r=dom.getBoundingClientRect();ndc.set((ev.clientX-r.left)/r.width*2-1,-(ev.clientY-r.top)/r.height*2+1);
    ray.setFromCamera(ndc,cam);const h=mesh?ray.intersectObject(mesh)[0]:null;return h&&h.uv?loc(h.uv):null};
  dom.addEventListener('pointerdown',ev=>{
    const p=pick(ev),id=p&&hit(p);if(!id)return;            // si no se tocó un elemento, la prenda simplemente gira
    drag={id,ox:E[id].x-p.fx,oy:E[id].y-p.fy};              // guarda la diferencia entre el toque y el centro del elemento
    if(ctl)ctl.enabled=false;dom.setPointerCapture(ev.pointerId);selEl(id)});
  dom.addEventListener('pointermove',ev=>{                  // mientras se arrastra, mueve el elemento (máx. 1 vez por cuadro)
    if(!drag)return;mv=ev;if(busy)return;busy=true;
    requestAnimationFrame(()=>{busy=false;if(!drag||!mv)return;const p=pick(mv);mv=null;if(!p)return;
      const e=E[drag.id];if(p.side!==e.side){e.side=p.side;drag.ox=drag.oy=0}   // si cruza al otro lado de la prenda, cambia de lado
      e.x=Math.min(.95,Math.max(.05,p.fx+drag.ox));e.y=Math.min(.95,Math.max(.05,p.fy+drag.oy));redraw()})});
  const end=()=>{if(drag){drag=null;if(ctl)ctl.enabled=true}};
  dom.addEventListener('pointerup',end);dom.addEventListener('pointercancel',end);

  // Controles: arrastrar gira, rueda o pellizco acerca (sin desplazar)
  ctl=new THREE.OrbitControls(cam,dom);
  ctl.enablePan=false;ctl.enableDamping=true;ctl.minDistance=3;ctl.maxDistance=8;ctl.autoRotateSpeed=2;
  // La textura es el canvas `cv`; flipY=false porque los modelos usan UV de glTF
  tex=new THREE.CanvasTexture(cv);tex.flipY=false;tex.encoding=THREE.sRGBEncoding;
  tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  mat=new THREE.MeshStandardMaterial({map:tex,roughness:.8,metalness:0,side:THREE.DoubleSide});
  // Ajusta el tamaño del render al del contenedor (también al girar el celular)
  const st=$('#stage'),rs=()=>{const w=st.clientWidth,h=st.clientHeight;if(!w||!h)return;
    renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix()};
  new ResizeObserver(rs).observe(st);rs();
  (function loop(){requestAnimationFrame(loop);ctl.update();renderer.render(scene,cam)})();   // bucle de animación
}
// Reemplaza el modelo mostrado por el de la prenda elegida
function setMesh(m){
  if(!renderer)return;
  if(mesh){scene.remove(mesh);mesh.geometry.dispose()}
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(m.pos,3));
  g.setAttribute('normal',new THREE.BufferAttribute(m.nor,3));
  g.setAttribute('uv',new THREE.BufferAttribute(m.uv,2));
  g.setIndex(new THREE.BufferAttribute(m.idx,1));
  mesh=new THREE.Mesh(g,mat);scene.add(mesh);
}
// Mueve la cámara al frente (1) o a la espalda (-1)
function view(z){if(!ctl)return;cam.position.set(0,0,z*5.2);ctl.update()}

/* ---------- 5. Interfaz ---------- */
// Refresca textos dinámicos (etiquetas, nombres de patrones, tabla de talles, resumen)
function ui(){
  const l=LANG()=='en'?1:0,tee=S.sport=='tee';
  document.querySelectorAll('[data-ck]').forEach(e=>{const k=CK.find(x=>x[0]==e.dataset.ck)[1];e.textContent=t(k.endsWith('_')?k+S.sport:k)});
  $('#pat').querySelectorAll('option').forEach((o,i)=>o.textContent=NX.P[i].n[l]);
  document.querySelectorAll('#presets .pre span').forEach((s,i)=>s.textContent=NX.PRE[i].n[l]);
  $('#fitbox').hidden=!tee;$('#slpbox').hidden=!tee;   // Hincha/Jugador y "patrón en mangas" solo existen en fútbol
  const rows=SZ[S.sport],h=tee?[t('sz'),t('fan')+' (cm)',t('player')+' (cm)']:[t('sz'),t('b_w')+' (cm)',t('b_l')+' (cm)'];
  $('#sztable').innerHTML='<tr>'+h.map(x=>`<th>${x}</th>`).join('')+'</tr>'+rows.map(r=>`<tr class="${r[0]==S.size?'on':''}">${r.map(x=>`<td>${x}</td>`).join('')}</tr>`).join('');
  $('#sum').textContent=`${t(S.sport)} · ${S.size}${tee?' · '+t(S.fit):''} · ×${S.qty}`}
// Crea las miniaturas de diseños predefinidos
function presets(){
  const g=$('#presets');g.innerHTML='';
  NX.PRE.forEach((p,i)=>{const b=document.createElement('button');b.type='button';b.className='pre';
    b.innerHTML='<canvas width="144" height="144"></canvas><span></span>';NX.mini(b.firstChild,S.sport,p.p,p.c,p.c.sl);
    b.onclick=()=>applyPre(i);g.append(b)});
}
// Aplica un diseño predefinido: copia sus colores y patrón al estado y a los controles
function applyPre(i){
  const p=NX.PRE[i];S.pat=p.p;S.c={...p.c};S.slp=!!p.c.sl;$('#pat').value=p.p;$('#slp').checked=S.slp;
  document.querySelectorAll('[data-ck]').forEach(e=>e.parentNode.querySelector('input').value=S.c[e.dataset.ck]);
  redraw();ui();
}
// Cambia de prenda (fútbol/básquet): carga el modelo, restablece posiciones, repinta y lo muestra
async function setSport(k){
  S.sport=k;document.querySelectorAll('[data-sport]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.sport==k));
  $('#msg').textContent=t('loading');
  try{const m=await loadModel(k);resetEl();selEl('num');presets();ui();paint();setMesh(m);$('#msg').textContent=''}
  catch(e){console.error(e);$('#msg').textContent=t('no3d')}
}
// Arranque: conecta cada control de la página con el estado S
async function boot(){
  const q=new URLSearchParams(location.search);   // index.html puede abrir el diseñador con ?s=bask&p=3
  $('#pat').innerHTML=NX.P.map(p=>`<option value="${p.id}"></option>`).join('');
  $('#cols').innerHTML=CK.map(x=>`<label><input type="color" aria-label="${x[0]}"><span data-ck="${x[0]}"></span></label>`).join('');
  document.querySelectorAll('#cols input').forEach((e,i)=>e.oninput=()=>{S.c[CK[i][0]]=e.value;redraw()});
  S.c={...NX.PRE[6].c};S.pat=NX.PRE[6].p;S.slp=!!S.c.sl;
  $('#pat').onchange=e=>{S.pat=e.target.value;redraw()};
  $('#slp').onchange=e=>{S.slp=e.target.checked;redraw()};
  $('#name').oninput=e=>{S.name=e.target.value;redraw()};
  $('#num').oninput=e=>{S.num=e.target.value.replace(/\D/g,'').slice(0,2);e.target.value=S.num;redraw()};   // solo 2 dígitos
  $('#txt').oninput=e=>{S.txt=e.target.value;redraw()};
  // Escudo: lee la imagen subida y la guarda en S.crest
  $('#crest').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();
    r.onload=()=>{const im=new Image();im.onload=()=>{S.crest=im;selEl('crest')};im.src=r.result};r.readAsDataURL(f)};
  $('#crestrm').onclick=()=>{S.crest=null;$('#crest').value='';redraw()};
  // Posición y tamaño: botones para elegir elemento, deslizadores, "número al frente" y restablecer
  document.querySelectorAll('[data-el]').forEach(b=>b.onclick=()=>selEl(b.dataset.el));
  $('#esz').oninput=e=>{E[S.sel].s=+e.target.value;redraw()};
  $('#erot').oninput=e=>{E[S.sel].r=+e.target.value;redraw()};
  $('#numf').onchange=e=>{E.numf.on=e.target.checked;if(e.target.checked)selEl('numf');redraw()};
  $('#ereset').onclick=()=>{resetEl();selEl('num')};
  document.querySelectorAll('[data-sport]').forEach(b=>b.onclick=()=>setSport(b.dataset.sport));
  document.querySelectorAll('[data-fit]').forEach(b=>b.onclick=()=>{S.fit=b.dataset.fit;document.querySelectorAll('[data-fit]').forEach(x=>x.setAttribute('aria-pressed',x==b));ui()});
  // Botones de talle
  $('#sizes').innerHTML=['S','M','L','XL','XXL'].map(s=>`<button type="button" aria-pressed="${s==S.size}">${s}</button>`).join('');
  $('#sizes').querySelectorAll('button').forEach(b=>b.onclick=()=>{S.size=b.textContent;$('#sizes').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x==b));ui()});
  // Cantidad: siempre entre 1 y 20
  const qn=v=>{S.qty=Math.max(1,Math.min(20,Math.round(+v)||1));$('#qty').value=S.qty;ui()};
  $('#qm').onclick=()=>qn(S.qty-1);$('#qp').onclick=()=>qn(S.qty+1);$('#qty').onchange=e=>qn(e.target.value);
  // Descargas: se repinta sin el recuadro de selección y luego se vuelve a la vista normal
  const dl=(b,n)=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=n;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),3000)};
  const clean=fn=>{noSel=true;paint();fn();noSel=false;redraw()};
  $('#dl2').onclick=()=>clean(()=>cv.toBlob(b=>dl(b,'nexo-plantilla-2d.png')));   // plantilla 2D = la textura completa
  $('#dl3').onclick=()=>{if(!renderer)return;clean(()=>{renderer.render(scene,cam);$('#gl').toBlob(b=>dl(b,'nexo-diseno-3d.png'))})}; // captura del visor 3D
  $('#vf').onclick=()=>view(1);$('#vb').onclick=()=>view(-1);
  $('#spin').onclick=e=>{if(!ctl)return;ctl.autoRotate=!ctl.autoRotate;e.target.setAttribute('aria-pressed',ctl.autoRotate)};
  document.addEventListener('langchange',()=>{presets();ui()});
  window.NEXO={S,E};   // útil para depurar desde la consola del navegador
  // Inicia Three.js; si no cargó (sin internet), muestra un aviso
  try{init3d()}catch(e){console.error(e);$('#msg').textContent=t('no3d');return}
  try{await document.fonts.load('800 100px "Barlow Condensed"')}catch(e){}   // espera la tipografía de los números
  await setSport(q.get('s')=='bask'?'bask':'tee');
  if(q.has('p'))applyPre(Math.min(+q.get('p')||0,NX.PRE.length-1));
  document.fonts.ready.then(redraw);
}
document.addEventListener('DOMContentLoaded',boot);
})();
