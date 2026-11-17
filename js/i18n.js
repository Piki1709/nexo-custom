/* =====================================================================
   i18n.js · Traducciones español / inglés
   - Cada elemento HTML con data-i18n="clave" recibe el texto de su idioma.
   - Los placeholders usan data-i18n-ph="clave".
   - Para agregar o cambiar un texto, editá el diccionario D.
   ===================================================================== */
(()=>{
const D={
es:{
 nav_home:'Inicio',nav_design:'Diseñar',nav_contact:'Contacto',
 h_title:'Tu camiseta, diseñada a tu medida',h_p:'Elegí un diseño, personalizá cada detalle y miralo en 3D antes de decidir.',h_cta:'Empezar a diseñar',h_cta2:'Dejar un comentario',
 st_h:'Cómo funciona',s1_h:'Elegí la prenda',s1_p:'Camiseta de fútbol o musculosa de básquet.',s2_h:'Personalizá',s2_p:'Diseños listos, colores por zona, nombre, número y escudo.',s3_h:'Guardá tu diseño',s3_p:'Descargalo como imagen 3D o como plantilla 2D.',
 ft_h:'Todo lo que podés ajustar',f1:'Vista 3D que girás con el dedo o el mouse',f2:'Diseños predefinidos y 13 patrones',f3:'Talles unisex con medidas en centímetros',f4:'Hasta 20 unidades por camiseta',
 cta_h:'¿Listo para crear la tuya?',foot:'NEXO custom · Prototipo en desarrollo: todavía no hay ventas.',
 d_sport:'Prenda',tee:'Fútbol',bask:'Básquet',fan:'Hincha',player:'Jugador',d_pre:'Diseños predefinidos',d_pat:'Patrón',d_col:'Colores',
 c_base:'Base',c_p1:'Patrón 1',c_p2:'Patrón 2',c_side_tee:'Mangas',c_side_bask:'Laterales',c_trim_tee:'Cuello y puños',c_trim_bask:'Ribetes',c_text:'Texto',c_out:'Contorno',
 d_txt:'Nombre, número y escudo',f_name:'Nombre (espalda)',f_num:'Número',f_txt:'Texto en el pecho',f_crest:'Subir escudo',f_crest_rm:'Quitar escudo',
 d_size:'Talle y cantidad',sz:'Talle',b_w:'Ancho (sisa a sisa)',b_l:'Largo total',d_qty:'Cantidad (máx. 20)',d_save:'Guardar diseño',dl3:'Descargar imagen 3D',dl2:'Descargar plantilla 2D',
 front:'Frente',e_name:'Nombre',e_num:'Número',e_txt:'Texto',e_crest:'Escudo',e_numf:'Repetir el número al frente',pos_help:'Arrastrá el elemento directamente sobre la prenda, o elegilo acá para ajustarlo:',f_size:'Tamaño',f_rot:'Giro',f_reset:'Restablecer posiciones',f_slp:'Patrón también en las mangas',back:'Espalda',spin:'Girar solo',loading:'Cargando modelo 3D…',hint:'Arrastrá la prenda para girarla · arrastrá un texto o el escudo para moverlo',
 no3d:'No se pudo mostrar el modelo 3D. Revisá tu conexión a internet y recargá la página.',proto:'Prototipo: por ahora no se realizan compras.',
 ct_h:'Tu opinión nos ayuda a mejorar',ct_p:'Contanos qué error encontraste o qué mejorarías. Leemos todo.',ct_type:'Tipo de comentario',ct_err:'Error',ct_imp:'Mejora',ct_sug:'Sugerencia',ct_name:'Nombre (opcional)',ct_mail:'Email (opcional)',ct_msg:'Mensaje',ct_send:'Enviar comentario',ct_ok:'¡Gracias! Recibimos tu comentario.',ct_fail:'No se pudo enviar. Revisá tu conexión e intentá de nuevo.',ct_cfg:'Falta configurar el ID de Formspree en contacto.html.'},
en:{
 nav_home:'Home',nav_design:'Design',nav_contact:'Contact',
 h_title:'Your jersey, made your way',h_p:'Pick a template, customize every detail and see it in 3D before you decide.',h_cta:'Start designing',h_cta2:'Leave feedback',
 st_h:'How it works',s1_h:'Pick the garment',s1_p:'Football shirt or basketball jersey.',s2_h:'Make it yours',s2_p:'Ready-made designs, colors by zone, name, number and crest.',s3_h:'Save your design',s3_p:'Download it as a 3D image or a 2D template.',
 ft_h:'Everything you can adjust',f1:'3D view you spin with your finger or mouse',f2:'Ready-made designs and 13 patterns',f3:'Unisex sizes with measurements in centimeters',f4:'Up to 20 units per shirt',
 cta_h:'Ready to create yours?',foot:'NEXO custom · Prototype in development: nothing is for sale yet.',
 d_sport:'Garment',tee:'Football',bask:'Basketball',fan:'Fan',player:'Player',d_pre:'Ready-made designs',d_pat:'Pattern',d_col:'Colors',
 c_base:'Base',c_p1:'Pattern 1',c_p2:'Pattern 2',c_side_tee:'Sleeves',c_side_bask:'Side panels',c_trim_tee:'Collar and cuffs',c_trim_bask:'Trim',c_text:'Text',c_out:'Outline',
 d_txt:'Name, number and crest',f_name:'Name (back)',f_num:'Number',f_txt:'Chest text',f_crest:'Upload crest',f_crest_rm:'Remove crest',
 d_size:'Size and quantity',sz:'Size',b_w:'Width (armpit to armpit)',b_l:'Total length',d_qty:'Quantity (max. 20)',d_save:'Save design',dl3:'Download 3D image',dl2:'Download 2D template',
 front:'Front',e_name:'Name',e_num:'Number',e_txt:'Text',e_crest:'Crest',e_numf:'Repeat the number on the front',pos_help:'Drag the element right on the garment, or pick it here to adjust it:',f_size:'Size',f_rot:'Rotation',f_reset:'Reset positions',f_slp:'Pattern on sleeves too',back:'Back',spin:'Auto-rotate',loading:'Loading 3D model…',hint:'Drag the garment to rotate it · drag a text or the crest to move it',
 no3d:'The 3D model could not be displayed. Check your internet connection and reload the page.',proto:'Prototype: purchases are not available yet.',
 ct_h:'Your feedback helps us improve',ct_p:'Tell us what error you found or what you would improve. We read everything.',ct_type:'Feedback type',ct_err:'Bug',ct_imp:'Improvement',ct_sug:'Suggestion',ct_name:'Name (optional)',ct_mail:'Email (optional)',ct_msg:'Message',ct_send:'Send feedback',ct_ok:'Thank you! We received your feedback.',ct_fail:'Could not send. Check your connection and try again.',ct_cfg:'Formspree ID is not set in contacto.html yet.'}
};
// Idioma inicial: el guardado por la persona, o el del navegador (inglés si empieza con "en", si no español)
let L='es';
try{L=localStorage.getItem('nx_lang')||((navigator.language||'es').startsWith('en')?'en':'es')}catch(e){}
window.t=k=>(D[L]&&D[L][k])||k;   // t('clave') devuelve el texto en el idioma actual
window.LANG=()=>L;                  // LANG() devuelve 'es' o 'en'
// Aplica el idioma a toda la página
function apply(){
  document.documentElement.lang=L;
  document.querySelectorAll('[data-i18n]').forEach(e=>e.textContent=t(e.dataset.i18n));
  document.querySelectorAll('[data-i18n-ph]').forEach(e=>e.placeholder=t(e.dataset.i18nPh));
  document.querySelectorAll('.lang').forEach(b=>b.textContent=L=='es'?'EN':'ES');
  document.dispatchEvent(new Event('langchange'));   // avisa a designer.js para refrescar textos dinámicos
}
window.setLang=l=>{L=l;try{localStorage.setItem('nx_lang',l)}catch(e){}apply()};
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.lang').forEach(b=>b.onclick=()=>setLang(L=='es'?'en':'es'));
  apply();
});
})();
