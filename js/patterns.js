/* =====================================================================
   patterns.js · Patrones y diseños predefinidos (index y diseñador)
   - NX.P    : lista de patrones (id + nombre ES/EN).
   - NX.PRE  : diseños predefinidos (patrón + 7 colores + si las mangas llevan patrón).
   - NX.draw : dibuja un patrón en un rectángulo (lo usa la textura 3D).
   - NX.mini : dibuja la miniatura de una prenda (vista previa).
   Colores: base, p1/p2 (patrón), side (mangas o laterales), trim (cuello/ribetes),
            text (texto y número), out (contorno del texto).
   ===================================================================== */
window.NX={};
// ---- Utilidades de color: mezcla dos colores hex (t=0 → a, t=1 → b) ----
const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const mix=(a,b,t)=>{const A=hex(a),B=hex(b);return`rgb(${A.map((v,i)=>Math.round(v+(B[i]-v)*t)).join(',')})`};

NX.P=[
 {id:'solid',n:['Liso','Solid']},{id:'stripes',n:['Rayas con filete','Pinned stripes']},{id:'pin',n:['Rayas finas','Pinstripes']},
 {id:'hoops',n:['Aros','Hoops']},{id:'band',n:['Banda inclinada','Slanted band']},{id:'sash',n:['Diagonal con brillo','Glossy sash']},
 {id:'fade',n:['Degradé diagonal','Diagonal fade']},{id:'halves',n:['Mitades cortadas','Split halves']},{id:'chevron',n:['Chevrones','Chevrons']},
 {id:'shards',n:['Cristales','Shards']},{id:'waves',n:['Ondas','Waves']},{id:'dots',n:['Puntos (halftone)','Halftone dots']},{id:'slash',n:['Cortes diagonales','Diagonal slashes']}
];
const K=(base,p1,p2,side,trim,text,out,sl=false)=>({base,p1,p2,side,trim,text,out,sl});
NX.PRE=[
 {n:['Cielo','Sky'],p:'stripes',c:K('#8FD0F5','#FFFFFF','#1B4F8C','#FFFFFF','#1B4F8C','#12315A','#FFFFFF')},
 {n:['Rojo y negro','Red & black'],p:'halves',c:K('#141414','#D7263D','#FFFFFF','#141414','#D7263D','#FFFFFF','#141414',true)},
 {n:['Esmeralda','Emerald'],p:'hoops',c:K('#0B6B47','#F2EFE6','#C9A84C','#0B6B47','#C9A84C','#F2EFE6','#0B3D2B')},
 {n:['Medianoche','Midnight'],p:'chevron',c:K('#101C33','#2F5BD0','#9FB8F0','#101C33','#E8D6B3','#FFFFFF','#101C33')},
 {n:['Cometa','Comet'],p:'sash',c:K('#F8F5EF','#D7263D','#111111','#F8F5EF','#111111','#111111','#F8F5EF')},
 {n:['Atardecer','Sunset'],p:'fade',c:K('#FF9A3D','#D43D6B','#4B2A86','#4B2A86','#FFD166','#FFFFFF','#2B1245',true)},
 {n:['Noir y oro','Noir & gold'],p:'pin',c:K('#111111','#C9A84C','#E8D6B3','#111111','#C9A84C','#E8D6B3','#111111')},
 {n:['Marfil','Ivory'],p:'band',c:K('#F8F5EF','#C9A84C','#111111','#F8F5EF','#111111','#111111','#E8D6B3')},
 {n:['Cristal','Crystal'],p:'shards',c:K('#12233F','#4EA8FF','#FFFFFF','#12233F','#4EA8FF','#FFFFFF','#12233F',true)},
 {n:['Oleaje','Tide'],p:'waves',c:K('#0A5C7A','#2FB5C9','#E8F7FA','#0A5C7A','#E8F7FA','#FFFFFF','#06384A',true)},
 {n:['Tinta','Ink'],p:'dots',c:K('#F2F2F2','#1A1A1A','#D7263D','#F2F2F2','#D7263D','#1A1A1A','#F2F2F2')},
 {n:['Velocidad','Speed'],p:'slash',c:K('#1B1B1B','#C6F432','#FFFFFF','#1B1B1B','#C6F432','#C6F432','#1B1B1B',true)}
];

// ---- Dibuja el patrón `id` en un rectángulo w×h (el "arriba" de la prenda es y=0) ----
NX.draw=(c,id,w,h,k)=>{
  const f=(col,x,y,a,b)=>{c.fillStyle=col;c.fillRect(x,y,a,b)};                       // rectángulo relleno
  const poly=(col,pts)=>{c.fillStyle=col;c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();c.fill()}; // polígono relleno
  f(k.base,0,0,w,h);                                                                     // fondo: color base
  switch(id){
  case'stripes':{const s=w/9,e=s*.1;for(let i=1;i<9;i+=2){f(k.p1,i*s,0,s,h);f(k.p2,i*s-e*1.8,0,e,h);f(k.p2,(i+1)*s+e*.8,0,e,h)}break}   // rayas anchas con filete fino a los lados
  case'pin':{const s=w/30;for(let i=0;i<30;i++)f(i%5==2?k.p2:k.p1,i*s+s*.35,0,s*(i%5==2?.5:.3),h);break}                                // rayas finas (cada 5ª con otro color)
  case'hoops':{const s=h/10;for(let i=1;i<10;i+=2){f(k.p1,0,i*s,w,s);f(k.p2,0,i*s+s,w,s*.12)}break}                                      // aros horizontales con filete
  case'band':{poly(k.p2,[[0,h*.25],[w,h*.17],[w,h*.52],[0,h*.60]]);poly(k.p1,[[0,h*.29],[w,h*.21],[w,h*.46],[0,h*.54]]);break}         // banda inclinada con borde
  case'sash':{c.save();c.translate(w/2,h*.45);c.rotate(-.55);f(k.p2,-w,-h*.17,w*2,h*.34);                                              // diagonal: borde + cuerpo con brillo
    const g=c.createLinearGradient(0,-h*.13,0,h*.13);g.addColorStop(0,mix(k.p1,'#FFFFFF',.22));g.addColorStop(.5,k.p1);g.addColorStop(1,mix(k.p1,'#000000',.2));
    c.fillStyle=g;c.fillRect(-w,-h*.13,w*2,h*.26);c.restore();break}
  case'fade':{const g=c.createLinearGradient(w*.2,0,w*.8,h);g.addColorStop(0,k.base);g.addColorStop(.55,k.p1);g.addColorStop(1,k.p2);c.fillStyle=g;c.fillRect(0,0,w,h);break} // degradé de 3 colores
  case'halves':{poly(k.p2,[[w*.50,0],[w,0],[w,h],[w*.22,h]]);poly(k.p1,[[w*.56,0],[w,0],[w,h],[w*.30,h]]);break}                        // mitad con corte diagonal y filete
  case'chevron':{for(let i=0;i<6;i++){const y=h*(.08+i*.15);poly(i%2?k.p2:k.p1,[[0,y],[w/2,y+h*.12],[w,y],[w,y+h*.06],[w/2,y+h*.18],[0,y+h*.06]])}break} // V apiladas
  case'shards':{let s=7;const r=()=>(s=s*16807%2147483647)/2147483647,n=6,cw=w/n,rows=Math.ceil(h/cw);                                  // triángulos con tonos (aleatorio fijo)
    for(let j=0;j<rows;j++)for(let i=0;i<n;i++){const x=i*cw-1,y=j*cw-1,q=cw+2;
      poly(r()<.08?k.p2:mix(k.base,k.p1,Math.min(1,r()*.55+j/rows*.5)),[[x,y],[x+q,y],[x,y+q]]);
      poly(mix(k.base,k.p1,Math.min(1,r()*.55+j/rows*.5)),[[x+q,y],[x+q,y+q],[x,y+q]])}break}
  case'waves':{const n=9,amp=h*.025,wave=(i,y0)=>{c.beginPath();for(let x=0;x<=w;x+=w/40){const y=y0+amp*Math.sin(x/w*Math.PI*3+i*.7);x?c.lineTo(x,y):c.moveTo(x,y)}};
    for(let i=0;i<n;i++){const y0=h*(.04+i*.11);wave(i,y0);c.lineTo(w,h);c.lineTo(0,h);c.closePath();c.fillStyle=i%2?k.base:k.p1;c.fill();
      wave(i,y0);c.lineWidth=h*.008;c.strokeStyle=k.p2;c.stroke()}break}                                                                 // ondas con filete
  case'dots':{const n=14,cw=w/n,rows=Math.ceil(h/cw);c.fillStyle=k.p1;                                                                  // puntos que crecen hacia abajo
    for(let j=0;j<rows;j++)for(let i=0;i<n;i++){const t=(j+.5)/rows;c.beginPath();c.arc(i*cw+cw/2+(j%2?cw/2:0),j*cw+cw/2,cw*.5*Math.pow(t,1.15),0,7);c.fill()}break}
  case'slash':{c.save();c.translate(w/2,h/2);c.rotate(-.6);const L=Math.hypot(w,h),st=L/14;                                              // barras diagonales de ancho variable
    for(let i=-8;i<8;i++)f(i%3==0?k.p2:k.p1,i*st,-L,st*(.2+.55*(((i+8)*7)%5)/4),L*2);c.restore();break}
  }
};

// ---- Miniatura de prenda sobre un <canvas> cuadrado (se adapta a su tamaño) ----
NX.mini=(cv,sport,pat,c,sl)=>{
  const x=cv.getContext('2d'),tee=sport!='bask',s=cv.width/100;x.clearRect(0,0,cv.width,cv.height);x.save();x.scale(s,s);
  const p=new Path2D(tee?'M30 8L42 12Q50 18 58 12L70 8L96 28L84 44L72 36L72 94L28 94L28 36L16 44L4 28Z':'M30 6L40 6Q50 28 60 6L70 6L74 30Q82 42 74 52L74 94L26 94L26 52Q18 42 26 30Z');
  x.save();x.clip(p);NX.draw(x,pat,100,100,c);                                       // recorta con la silueta y pinta el patrón
  if(tee){x.save();x.beginPath();x.rect(0,0,28,60);x.rect(72,0,28,60);x.clip();       // mangas: color liso o con patrón
    if(sl)NX.draw(x,pat,100,100,c);else{x.fillStyle=c.side;x.fillRect(0,0,100,100)}x.restore()}
  else{x.fillStyle=c.side;x.fillRect(26,50,4,44);x.fillRect(70,50,4,44)}            // laterales del básquet
  const g=x.createLinearGradient(0,0,100,0);g.addColorStop(0,'rgba(0,0,0,.22)');g.addColorStop(.3,'rgba(255,255,255,.08)');g.addColorStop(.7,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.22)');
  x.fillStyle=g;x.fillRect(0,0,100,100);                                              // sombreado lateral para dar volumen
  x.restore();x.lineWidth=2.5;x.lineJoin='round';x.strokeStyle=c.trim;x.stroke(p);x.restore();
};
