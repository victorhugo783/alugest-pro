/**
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  guestController.js  —  AluGest Pro  v3.0                              │
 * │  Modo Invitado + Tour guiado + Tooltips contextuales                   │
 * │                                                                         │
 * │  CORRECCIONES v3:                                                        │
 * │   · Carga catálogo real de Firestore (fbLoadCatalogo) antes de init()  │
 * │   · Oculta tab Admin y pantalla Admin correctamente                    │
 * │   · Banner centrado, con max-width y posición sobre la nav bar         │
 * │                                                                         │
 * │  PARA REMOVER — borra este archivo y en ListaMaterial.html elimina:    │
 * │    · <script src="guestController.js"> antes de </body>                │
 * │    · GuestController.onLogin();   en if(user) de onAuthStateChanged    │
 * │    · GuestController.activar(); return; en else de onAuthStateChanged  │
 * │    · if (GuestController.interceptarCotizacion()) return;  en ×2       │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

const GuestController = (() => {

  /* ══════════════════════════════════════════════════════════════════════════
     CONSTANTES
  ══════════════════════════════════════════════════════════════════════════ */
  const GUEST_KEY     = 'alugest_guest_ops';
  const GUEST_ACTIVE  = 'alugest_guest_mode';
  const TOUR_DONE_KEY = 'alugest_tour_done';
  const GUEST_MAX_OPS = 3;

  /* ══════════════════════════════════════════════════════════════════════════
     PLANTILLAS DEMO — PEDIDOS (historial principal)
  ══════════════════════════════════════════════════════════════════════════ */
  const MOCK_PEDIDOS = [
    {
      id:'demo_001', folio:'DEMO-001', _isDemo:true,
      client:'EJEMPLO: RESIDENCIA RAMÍREZ',
      date: new Date().toLocaleDateString('es-MX',{day:'2-digit',month:'2-digit',year:'numeric'}),
      cart:{},
      itemsSnapshot:[
        {id:9001,name:'PERFIL RIEL SUPERIOR 3"', color:'BLANCO', category:'perfil',   measureGroup:'ML',price:185,qty:4.8},
        {id:9002,name:'PERFIL RIEL INFERIOR 3"', color:'BLANCO', category:'perfil',   measureGroup:'ML',price:165,qty:4.8},
        {id:9003,name:'PERFIL JAMBA LATERAL 3"', color:'BLANCO', category:'perfil',   measureGroup:'ML',price:175,qty:5.0},
        {id:9004,name:'HOJA CORREDIZA 3"',        color:'BLANCO', category:'perfil',   measureGroup:'ML',price:198,qty:9.6},
        {id:9005,name:'VIDRIO CLARO 6mm',         color:'CLARO',  category:'vidrio',   measureGroup:'M2',price:320,qty:3.2},
        {id:9006,name:'RODAMIENTOS NYLON (par)',  color:'N/A',    category:'herraje',  measureGroup:'',  price:45, qty:4  },
        {id:9007,name:'CERRADURA CORREDIZA',      color:'N/A',    category:'herraje',  measureGroup:'',  price:120,qty:2  },
        {id:9008,name:'SELLADOR SILICÓN TRANSP.', color:'N/A',    category:'consumible',measureGroup:'', price:68, qty:2  },
      ],
      _summary:{label:'Ventana Corrediza Línea 3"',desc:'2 hojas · 2.4×1.6 m · Vidrio 6mm',icon:'🪟'}
    },
    {
      id:'demo_002', folio:'DEMO-002', _isDemo:true,
      client:'EJEMPLO: BAÑO DEPTO. "B"',
      date: new Date().toLocaleDateString('es-MX',{day:'2-digit',month:'2-digit',year:'numeric'}),
      cart:{},
      itemsSnapshot:[
        {id:9010,name:'PERFIL CANAL U PIVOTE',      color:'NATURAL',category:'perfil',  measureGroup:'ML',price:210,qty:2.2},
        {id:9011,name:'PERFIL BORDE TEMPLADO 10mm', color:'NATURAL',category:'perfil',  measureGroup:'ML',price:195,qty:2.0},
        {id:9012,name:'VIDRIO TEMPLADO 10mm',       color:'CLARO',  category:'vidrio',  measureGroup:'M2',price:980,qty:1.1},
        {id:9013,name:'BISAGRA PIVOTE PISO-TECHO',  color:'CROMO',  category:'herraje', measureGroup:'',  price:850,qty:1  },
        {id:9014,name:'JALADOR BARRA INOX 30cm',    color:'INOX',   category:'herraje', measureGroup:'',  price:340,qty:1  },
        {id:9015,name:'SELLADOR NEUTRO BAÑO',       color:'N/A',    category:'consumible',measureGroup:'',price:82, qty:1  },
      ],
      _summary:{label:'Puerta de Baño Vidrio Templado',desc:'Pivote · 0.85×2.05 m · 10mm',icon:'🚿'}
    },
    {
      id:'demo_003', folio:'DEMO-003', _isDemo:true,
      client:'EJEMPLO: CANCEL SALA COMEDOR',
      date: new Date().toLocaleDateString('es-MX',{day:'2-digit',month:'2-digit',year:'numeric'}),
      cart:{},
      itemsSnapshot:[
        {id:9020,name:'PERFIL CANCEL MARCO',       color:'BRONCE', category:'perfil',   measureGroup:'ML',price:220,qty:12.0},
        {id:9021,name:'PERFIL DIVISION VERTICAL',  color:'BRONCE', category:'perfil',   measureGroup:'ML',price:198,qty:4.0 },
        {id:9022,name:'VIDRIO CLARO 4mm',          color:'CLARO',  category:'vidrio',   measureGroup:'M2',price:185,qty:5.6 },
        {id:9023,name:'BISAGRAS VAIVÉN 3" (par)',  color:'BRONCE', category:'herraje',  measureGroup:'',  price:185,qty:2   },
        {id:9024,name:'CERROJO CANCEL BRONCE',     color:'BRONCE', category:'herraje',  measureGroup:'',  price:95, qty:2   },
        {id:9025,name:'TORNILLO AUTOPERF. 3/4"',  color:'N/A',    category:'consumible',measureGroup:'', price:2,  qty:60  },
        {id:9026,name:'SELLADOR SILICÓN MADERA',  color:'N/A',    category:'consumible',measureGroup:'', price:68, qty:2   },
      ],
      _summary:{label:'Cancel Tradicional Bronce',desc:'3×2 m · 4 paños · Vidrio 4mm',icon:'🏠'}
    },
    {
      id:'demo_004', folio:'DEMO-004', _isDemo:true,
      client:'EJEMPLO: FACHADA OFICINAS',
      date: new Date().toLocaleDateString('es-MX',{day:'2-digit',month:'2-digit',year:'numeric'}),
      cart:{},
      itemsSnapshot:[
        {id:9030,name:'PERFIL TUBULAR RECTO 1"×1"',color:'NEGRO', category:'perfil',   measureGroup:'ML',price:145,qty:18.0},
        {id:9031,name:'PERFIL L ESQUINERO 1"',      color:'NEGRO', category:'perfil',   measureGroup:'ML',price:130,qty:6.0 },
        {id:9032,name:'VIDRIO ESPEJO 4mm',          color:'PLATA', category:'vidrio',   measureGroup:'M2',price:420,qty:3.8 },
        {id:9033,name:'SILICÓN ESTRUCTURAL NEGRO', color:'N/A',   category:'consumible',measureGroup:'', price:145,qty:3   },
        {id:9034,name:'TAQUETES FISHER 5/16"',     color:'N/A',   category:'consumible',measureGroup:'', price:4,  qty:30  },
      ],
      _summary:{label:'Mampara de Espejo Modular',desc:'Tubo negro 1" · 2.4×1.6 m',icon:'🪞'}
    }
  ];

  /* ══════════════════════════════════════════════════════════════════════════
     PLANTILLAS DEMO — VENTAS (ventaHistory)
  ══════════════════════════════════════════════════════════════════════════ */
  const MOCK_VENTAS = [
    {
      id:'vdemo_001', folio:'V-DEMO-01', _isDemo:true,
      cliente:'EJEMPLO: VENTANA COCINA',
      date: new Date().toLocaleDateString('es-MX',{day:'2-digit',month:'2-digit',year:'numeric'}),
      margenPed:70, costoCorte:10, cargoCortes:30, margenVid:0, instCosto:0,
      pedSnap:[
        {nombre:'PERFIL RIEL SUPERIOR 3"',color:'BLANCO',metros:3.0,precioVenta:314.50,subtotal:943.50},
        {nombre:'PERFIL RIEL INFERIOR 3"',color:'BLANCO',metros:3.0,precioVenta:280.50,subtotal:841.50},
        {nombre:'HOJA CORREDIZA 3"',       color:'BLANCO',metros:6.0,precioVenta:336.60,subtotal:2019.60},
        {nombre:'PERFIL JAMBA LATERAL 3"',color:'BLANCO',metros:2.4,precioVenta:297.50,subtotal:714.00},
      ],
      vidSnap:[], totalPerfiles:4548.60, totalVidrios:0, totalGeneral:4548.60,
    },
    {
      id:'vdemo_002', folio:'V-DEMO-02', _isDemo:true,
      cliente:'EJEMPLO: ESPEJOS VESTIDOR',
      date: new Date().toLocaleDateString('es-MX',{day:'2-digit',month:'2-digit',year:'numeric'}),
      margenPed:0, costoCorte:0, cargoCortes:0, margenVid:250, instCosto:200,
      pedSnap:[],
      vidSnap:[
        {nombre:'VIDRIO ESPEJO 4mm',color:'PLATA',ancho:0.60,alto:1.80,m2:1.08,precioFinal:1303.00},
        {nombre:'VIDRIO ESPEJO 4mm',color:'PLATA',ancho:0.60,alto:1.80,m2:1.08,precioFinal:1303.00},
        {nombre:'VIDRIO CLARO 6mm', color:'CLARO',ancho:0.90,alto:0.60,m2:0.54,precioFinal:822.00 },
      ],
      totalPerfiles:0, totalVidrios:3428.00, totalGeneral:3428.00,
    }
  ];

  /* ══════════════════════════════════════════════════════════════════════════
     TOUR — pasos
  ══════════════════════════════════════════════════════════════════════════ */
  const TOUR_STEPS = [
    {
      title:'👋 Bienvenido a AluGest Pro',
      body:'Esta app te ayuda a cotizar trabajos de cancelería de aluminio y vidrio en segundos. Te damos un recorrido rápido de 5 pasos.',
      target:null, btnText:'Comenzar →',
    },
    {
      title:'📋 Artículos — Tu catálogo',
      body:'Aquí están todos los materiales con precio por distribuidor. Toca cualquier artículo para agregarlo al pedido activo.',
      target:'[data-tab="budget"]', position:'top', btnText:'Siguiente →',
    },
    {
      title:'📦 Pedidos — Genera tickets',
      body:'Seleccionas materiales y cantidades; el sistema calcula el total con tu margen. Presiona "GENERAR TICKET" para guardar la cotización.',
      target:'[data-tab="history"]', position:'top', btnText:'Siguiente →',
    },
    {
      title:'💲 Ventas — Cotiza por medida',
      body:'En "Metro Lineal" capturas metros de cada perfil con tu margen. En "Vidrio/Espejo" capturas ancho y alto y obtienes precio por m² con instalación.',
      target:'[data-tab="ventas"]', position:'top', btnText:'Siguiente →',
    },
    {
      title:'⚖️ Comparar — Elige el mejor kit',
      body:'Compara dos opciones de kit lado a lado con precios y materiales para decidir al instante frente al cliente.',
      target:'[data-tab="comparar"]', position:'top', btnText:'Siguiente →',
    },
    {
      title:'⚙️ Config — Tus precios y ajustes',
      body:'Personaliza márgenes de ganancia, ajustes de instalación y exporta respaldos de tu información.',
      target:'[data-tab="config"]', position:'top', btnText:'¡Entendido! ✓',
    },
  ];

  /* ══════════════════════════════════════════════════════════════════════════
     TOOLTIPS "?" contextuales
  ══════════════════════════════════════════════════════════════════════════ */
  const TOOLTIPS = [
    {
      anchorSelector:'[onclick="saveAndShow()"], #btn-generar',
      tipId:'gt-generar',
      text:'📄 Genera y guarda el ticket del pedido actual. Incluye todos los materiales seleccionados y el total con tu margen de ganancia.',
    },
    {
      anchorSelector:'[onclick="saveVentaCotizacion()"]',
      tipId:'gt-vcotiz',
      text:'💾 Guarda esta cotización en el historial de Ventas. Puedes recuperarla, editarla o ver el ticket en cualquier momento.',
    },
    {
      anchorSelector:'[data-tab="ventas"]',
      tipId:'gt-ventas-nav',
      text:'💲 Cotiza perfiles por metro lineal o vidrios/espejos por medida exacta, con tu margen e instalación automáticos.',
    },
  ];

  /* ══════════════════════════════════════════════════════════════════════════
     ESTADO INTERNO
  ══════════════════════════════════════════════════════════════════════════ */
  let _active   = false;
  let _tourStep = 0;
  let _tourOpen = false;

  /* ══════════════════════════════════════════════════════════════════════════
     HELPERS
  ══════════════════════════════════════════════════════════════════════════ */
  function _getOps()  { const v=parseInt(localStorage.getItem(GUEST_KEY),10); return isNaN(v)?GUEST_MAX_OPS:v; }
  function _setOps(n) { localStorage.setItem(GUEST_KEY,Math.max(0,n)); }
  function _resetOps(){ localStorage.setItem(GUEST_KEY,GUEST_MAX_OPS); }
  function _markTourDone(){ localStorage.setItem(TOUR_DONE_KEY,'1'); }

  /* ══════════════════════════════════════════════════════════════════════════
     ESTILOS
  ══════════════════════════════════════════════════════════════════════════ */
  function _injectStyles() {
    if (document.getElementById('gc-styles')) return;
    const s = document.createElement('style');
    s.id = 'gc-styles';
    s.textContent = `
      /* ── Banner ── */
      #gc-banner {
        position: fixed;
        bottom: 80px;               /* Por encima de la nav bar (~64px) */
        left: 50%;
        transform: translateX(-50%);
        z-index: 8800;
        display: flex;
        align-items: center;
        gap: 10px;
        background: rgba(20,28,48,0.55);
        backdrop-filter: blur(24px) saturate(200%);
        border: 1px solid rgba(124,157,255,0.35);
        border-radius: 50px;
        padding: 9px 16px 9px 14px;
        box-shadow: 0 4px 24px rgba(0,0,0,0.40);
        font-family: 'DM Sans', system-ui, sans-serif;
        white-space: nowrap;
        max-width: calc(100vw - 32px);   /* No se sale de la pantalla */
        box-sizing: border-box;
        animation: gcSlideUp .35s cubic-bezier(.22,.68,0,1.12) both;
        cursor: pointer;
        transition: transform .15s;
      }
      #gc-banner:hover { transform: translateX(-50%) scale(1.03); }
      #gc-banner .gc-chips { display: flex; gap: 6px; flex-shrink: 0; }
      #gc-banner .gc-chip {
        width: 10px; height: 10px; border-radius: 50%;
        background: rgba(255,255,255,0.18); transition: background .3s;
        flex-shrink: 0;
      }
      #gc-banner .gc-chip.used { background: #7c9dff; }
      #gc-banner .gc-label {
        font-size: 12px; font-weight: 600; color: #a8b8d8;
        letter-spacing: .3px; overflow: hidden; text-overflow: ellipsis;
      }
      #gc-banner .gc-label span { color: #7c9dff; }

      /* ── Paywall ── */
      #gc-paywall {
        position: fixed; inset: 0; z-index: 9998;
        background: rgba(8,12,24,0.55);
        backdrop-filter: blur(28px) saturate(200%);
        display: flex; align-items: center; justify-content: center;
        padding: 20px; animation: gcFadeIn .28s ease both;
        box-sizing: border-box;
      }
      #gc-paywall-card {
        background: rgba(20,28,48,0.60);
        border: 1px solid rgba(124,157,255,0.22);
        border-radius: 24px; max-width: 380px; width: 100%;
        box-shadow: 0 24px 64px rgba(0,0,0,0.55);
        overflow: hidden; animation: gcPopIn .32s cubic-bezier(.22,.68,0,1.12) both;
        max-height: 90vh; overflow-y: auto;
      }
      .gc-pw-header {
        background: linear-gradient(135deg,#3b5bdb 0%,#7c3aed 100%);
        padding: 28px 24px 22px; text-align: center;
      }
      .gc-pw-icon  { font-size: 38px; margin-bottom: 8px; }
      .gc-pw-title { font-family:'DM Sans',system-ui,sans-serif; font-size:17px; font-weight:800; color:#fff; line-height:1.3; margin:0; }
      .gc-pw-sub   { font-family:'DM Sans',system-ui,sans-serif; font-size:12px; color:rgba(255,255,255,.7); margin:5px 0 0; }
      .gc-pw-body  { padding: 20px 20px 18px; }
      .gc-pw-benefits { list-style:none; margin:0 0 18px; padding:0; display:flex; flex-direction:column; gap:10px; }
      .gc-pw-benefits li {
        display:flex; align-items:flex-start; gap:10px;
        font-family:'DM Sans',system-ui,sans-serif;
        font-size:13px; color:#a8b8d8; line-height:1.45;
      }
      .gc-pw-benefits li .gc-bicon {
        width:26px; height:26px; border-radius:8px; flex-shrink:0;
        background:rgba(124,157,255,0.14);
        display:flex; align-items:center; justify-content:center;
        font-size:14px; margin-top:1px;
      }
      .gc-pw-benefits li strong { color:#f0f4ff; display:block; font-size:13px; font-weight:700; }
      .gc-btn-register {
        width:100%; padding:14px; border:none; border-radius:14px;
        background:linear-gradient(135deg,#3b5bdb 0%,#7c3aed 100%);
        color:#fff; font-family:'DM Sans',system-ui,sans-serif;
        font-size:15px; font-weight:800; cursor:pointer; letter-spacing:.3px;
        box-shadow:0 4px 18px rgba(59,91,219,0.45);
        transition:transform .15s,box-shadow .15s;
      }
      .gc-btn-register:hover { transform:translateY(-1px); box-shadow:0 6px 24px rgba(59,91,219,0.55); }
      .gc-pw-note {
        font-family:'DM Sans',system-ui,sans-serif; font-size:11px;
        color:#6a80a8; text-align:center; margin:10px 0 0; line-height:1.5;
      }
      .gc-btn-dismiss {
        display:block; margin:10px auto 0; background:none; border:none;
        color:#6a80a8; font-size:12px; font-family:'DM Sans',system-ui,sans-serif;
        cursor:pointer; padding:4px 8px;
      }
      .gc-btn-dismiss:hover { color:#a8b8d8; }

      /* ── Welcome Sheet ── */
      #gc-welcome {
        position: fixed; inset: 0; z-index: 9997;
        background: rgba(8,12,24,0.55); backdrop-filter: blur(28px) saturate(200%);
        display: flex; align-items: flex-end; justify-content: center;
        padding: 0 16px 24px; animation: gcFadeIn .3s ease both;
        box-sizing: border-box;
      }
      #gc-welcome-card {
        background: rgba(15,22,42,0.55);
        border: 1px solid rgba(124,157,255,0.22);
        border-radius: 24px 24px 20px 20px; max-width: 440px; width: 100%;
        padding: 26px 22px 22px;
        box-shadow: 0 -8px 48px rgba(0,0,0,0.55);
        animation: gcSlideUpCard .4s cubic-bezier(.22,.68,0,1.12) both;
        max-height: 85vh; overflow-y: auto; box-sizing: border-box;
      }
      .gc-wc-emoji { font-size: 34px; margin-bottom: 6px; }
      .gc-wc-title { font-family:'DM Sans',system-ui,sans-serif; font-size:19px; font-weight:800; color:#f0f4ff; margin:0 0 6px; }
      .gc-wc-desc  { font-family:'DM Sans',system-ui,sans-serif; font-size:13px; color:#6a80a8; margin:0 0 16px; line-height:1.5; }
      .gc-wc-counter {
        display:flex; align-items:center; gap:8px;
        background:rgba(59,91,219,0.12); border:1px solid rgba(59,91,219,0.22);
        border-radius:12px; padding:10px 14px; margin-bottom:16px;
      }
      .gc-wc-counter-label { font-family:'DM Sans',system-ui,sans-serif; font-size:12px; color:#a8b8d8; flex:1; }
      .gc-wc-counter-val   { font-size:18px; font-weight:800; color:#7c9dff; font-family:'DM Mono',monospace; }
      .gc-btn-continue {
        width:100%; padding:13px; border:none; border-radius:14px;
        background:#3b5bdb; color:#fff;
        font-family:'DM Sans',system-ui,sans-serif; font-size:15px; font-weight:800;
        cursor:pointer; margin-bottom:10px; transition:background .15s;
      }
      .gc-btn-continue:hover { background:#2f4ac2; }
      .gc-btn-tour {
        width:100%; padding:11px; border:1.5px solid rgba(124,157,255,0.35);
        border-radius:14px; background:transparent; color:#7c9dff;
        font-family:'DM Sans',system-ui,sans-serif; font-size:14px; font-weight:700;
        cursor:pointer; margin-bottom:10px; transition:background .15s;
      }
      .gc-btn-tour:hover { background:rgba(124,157,255,0.08); }
      .gc-btn-login-link {
        display:block; text-align:center; background:none; border:none;
        color:#6a80a8; font-size:12px; font-family:'DM Sans',system-ui,sans-serif;
        cursor:pointer; padding:6px;
      }
      .gc-btn-login-link:hover { color:#a8b8d8; }

      /* ── Tour ── */
      #gc-tour-spotlight {
        position:fixed; inset:0; z-index:9989;
        background:rgba(8,12,24,0.62);
        animation:gcFadeIn .25s ease both;
        transition: clip-path .3s ease;
      }
      /* Anillo de foco visible alrededor del elemento destacado */
      #gc-tour-focus-ring {
        position:fixed; z-index:9993; pointer-events:none;
        border-radius:12px;
        box-shadow:
          0 0 0 3px rgba(124,157,255,0.9),
          0 0 0 6px rgba(124,157,255,0.25),
          0 0 24px 8px rgba(124,157,255,0.30);
        transition: all .3s cubic-bezier(.22,.68,0,1.12);
        animation: gcRingPulse 1.8s ease-in-out infinite;
      }
      @keyframes gcRingPulse {
        0%,100%{ box-shadow:0 0 0 3px rgba(124,157,255,0.9),0 0 0 6px rgba(124,157,255,0.25),0 0 24px 8px rgba(124,157,255,0.30); }
        50%    { box-shadow:0 0 0 3px rgba(124,157,255,1.0),0 0 0 8px rgba(124,157,255,0.35),0 0 32px 12px rgba(124,157,255,0.45); }
      }
      #gc-tour-card {
        position:fixed; z-index:9991;
        background:rgba(15,22,42,0.58);
        border:1px solid rgba(124,157,255,0.28);
        border-radius:18px;
        max-width: min(320px, calc(100vw - 32px));
        width: calc(100vw - 32px);
        padding:20px 20px 16px;
        box-shadow:0 8px 40px rgba(0,0,0,0.55);
        animation:gcPopInSimple .25s ease both;
        box-sizing:border-box;
      }
      .gc-tour-arrow { position:absolute; width:0; height:0; }
      .gc-tour-arrow.down {
        border-left:10px solid transparent; border-right:10px solid transparent;
        border-top:11px solid rgba(124,157,255,0.45);
        bottom:-11px;
      }
      .gc-tour-arrow.down::after {
        content:''; position:absolute; top:-13px; left:-9px;
        border-left:9px solid transparent; border-right:9px solid transparent;
        border-top:10px solid rgba(15,22,42,0.75);
      }
      .gc-tour-arrow.up {
        border-left:10px solid transparent; border-right:10px solid transparent;
        border-bottom:11px solid rgba(124,157,255,0.45);
        top:-11px;
      }
      .gc-tour-arrow.up::after {
        content:''; position:absolute; bottom:-13px; left:-9px;
        border-left:9px solid transparent; border-right:9px solid transparent;
        border-bottom:10px solid rgba(15,22,42,0.75);
      }
      .gc-tour-step-num { font-family:'DM Mono',monospace; font-size:10px; color:#6a80a8; letter-spacing:.5px; margin-bottom:6px; }
      .gc-tour-title    { font-family:'DM Sans',system-ui,sans-serif; font-size:15px; font-weight:800; color:#f0f4ff; margin:0 0 7px; line-height:1.3; }
      .gc-tour-body     { font-family:'DM Sans',system-ui,sans-serif; font-size:13px; color:#a8b8d8; line-height:1.55; margin:0 0 14px; }
      .gc-tour-footer   { display:flex; align-items:center; gap:8px; }
      .gc-tour-dots     { display:flex; gap:4px; flex:1; }
      .gc-tour-dot      { width:6px; height:6px; border-radius:50%; background:rgba(255,255,255,0.15); transition:background .25s; }
      .gc-tour-dot.active { background:#7c9dff; }
      .gc-tour-btn  { padding:9px 16px; border:none; border-radius:10px; background:#3b5bdb; color:#fff; font-family:'DM Sans',system-ui,sans-serif; font-size:13px; font-weight:700; cursor:pointer; flex-shrink:0; transition:background .15s; }
      .gc-tour-btn:hover { background:#2f4ac2; }
      .gc-tour-skip { background:none; border:none; color:#6a80a8; font-size:11px; font-family:'DM Sans',system-ui,sans-serif; cursor:pointer; padding:4px; text-decoration:underline; }

      /* ── Tooltips "?" ── */
      .gc-tip-btn {
        display:inline-flex; align-items:center; justify-content:center;
        width:18px; height:18px; border-radius:50%;
        border:1.5px solid rgba(124,157,255,0.4);
        background:rgba(124,157,255,0.10); color:#7c9dff;
        font-size:10px; font-weight:800; font-family:'DM Mono',monospace;
        cursor:pointer; margin-left:6px; flex-shrink:0; vertical-align:middle;
        transition:background .15s; user-select:none;
      }
      .gc-tip-btn:hover { background:rgba(124,157,255,0.22); }
      .gc-tooltip-popup {
        position:fixed; z-index:9500;
        background:rgba(15,22,42,0.55); border:1px solid rgba(124,157,255,0.25);
        border-radius:12px; padding:12px 14px; max-width:260px;
        box-shadow:0 6px 28px rgba(0,0,0,0.45);
        font-family:'DM Sans',system-ui,sans-serif; font-size:12px; color:#a8b8d8; line-height:1.5;
        animation:gcFadeIn .18s ease both; pointer-events:none;
        box-sizing:border-box;
      }

      /* ── Keyframes ── */
      @keyframes gcFadeIn  { from{opacity:0} to{opacity:1} }
      @keyframes gcSlideUp { from{opacity:0;transform:translateX(-50%) translateY(24px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
      @keyframes gcSlideUpCard { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
      @keyframes gcPopIn      { from{opacity:0;transform:scale(.88) translateY(16px)} to{opacity:1;transform:scale(1) translateY(0)} }
      @keyframes gcPopInSimple { from{opacity:0} to{opacity:1} }
    `;
    document.head.appendChild(s);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     BANNER
  ══════════════════════════════════════════════════════════════════════════ */
  function _renderBanner() {
    let b = document.getElementById('gc-banner');
    if (!b) {
      b = document.createElement('div');
      b.id = 'gc-banner';
      b.onclick = () => _showPaywall(true);
      document.body.appendChild(b);
    }
    const ops   = _getOps();
    const chips = Array.from({length:GUEST_MAX_OPS},(_,i)=>
      `<div class="gc-chip${i<ops?' used':''}"></div>`).join('');
    b.innerHTML = `<div class="gc-chips">${chips}</div>
      <div class="gc-label">Modo Invitado · <span>${ops}/${GUEST_MAX_OPS} cot.</span></div>`;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     PAYWALL
  ══════════════════════════════════════════════════════════════════════════ */
  function _showPaywall(dismissible=false) {
    if (document.getElementById('gc-paywall')) return;
    const el = document.createElement('div');
    el.id = 'gc-paywall';
    el.innerHTML = `
      <div id="gc-paywall-card">
        <div class="gc-pw-header">
          <div class="gc-pw-icon">🔓</div>
          <p class="gc-pw-title">¡Pruebas gratuitas agotadas!</p>
          <p class="gc-pw-sub">Regístrate gratis para seguir cotizando</p>
        </div>
        <div class="gc-pw-body">
          <ul class="gc-pw-benefits">
            <li><div class="gc-bicon">☁️</div><div><strong>Historial ilimitado en la nube</strong>Clientes, proyectos y cotizaciones guardadas siempre.</div></li>
            <li><div class="gc-bicon">💲</div><div><strong>Tu lista de precios personalizada</strong>Los precios de tus proveedores, solo tuyos.</div></li>
            <li><div class="gc-bicon">🔒</div><div><strong>Espacio privado y seguro</strong>Tu base de datos es única e intransferible.</div></li>
            <li><div class="gc-bicon">📱</div><div><strong>Cualquier teléfono o computadora</strong>Tu cuenta viaja contigo.</div></li>
          </ul>
          <button class="gc-btn-register" onclick="GuestController._irALogin()">✉️ &nbsp;Crear cuenta o Iniciar sesión</button>
          <p class="gc-pw-note">El registro asigna un espacio de base de datos único, privado y cifrado para tu taller.</p>
          ${dismissible?`<button class="gc-btn-dismiss" onclick="GuestController._cerrarPaywall()">Seguir explorando como invitado</button>`:''}
        </div>
      </div>`;
    document.body.appendChild(el);
    if (dismissible) el.addEventListener('click', e => { if(e.target===el) _cerrarPaywall(); });
  }
  function _cerrarPaywall() { const el=document.getElementById('gc-paywall'); if(el) el.remove(); }
  function _irALogin() {
    _cerrarPaywall();
    _desactivar();
    // Cierra la sesión anónima de Firebase (si existe) antes de mostrar login
    try {
      const auth = (typeof firebase !== 'undefined') ? firebase.auth() : null;
      if (auth && auth.currentUser) auth.signOut().catch(()=>{});
    } catch(e) {}
    const appMain=document.getElementById('app-main');
    const ls=document.getElementById('login-screen');
    if (appMain) appMain.style.display='none';
    if (ls) { ls.style.display='flex'; ls.style.flexDirection='column'; }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     WELCOME SHEET
  ══════════════════════════════════════════════════════════════════════════ */
  function _showWelcome() {
    const el = document.createElement('div');
    el.id = 'gc-welcome';
    el.innerHTML = `
      <div id="gc-welcome-card">
        <div class="gc-wc-emoji">👋</div>
        <h2 class="gc-wc-title">Bienvenido a AluGest Pro</h2>
        <p class="gc-wc-desc">Estás en <strong style="color:#7c9dff">Modo Invitado</strong>.
          El catálogo real ya está cargado — puedes buscar materiales, explorar kits y generar
          cotizaciones de prueba exactamente como lo harías con tu cuenta.</p>
        <div class="gc-wc-counter">
          <span class="gc-wc-counter-label">Cotizaciones de prueba disponibles</span>
          <span class="gc-wc-counter-val">${_getOps()}/${GUEST_MAX_OPS}</span>
        </div>
        <button class="gc-btn-continue" onclick="GuestController._cerrarWelcome()">Explorar →</button>
        <button class="gc-btn-tour"     onclick="GuestController._cerrarWelcome();GuestController._startTour();">🗺️ Recorrido guiado (recomendado)</button>
        <button class="gc-btn-login-link" onclick="GuestController._irALogin()">Ya tengo cuenta — Iniciar sesión</button>
      </div>`;
    document.body.appendChild(el);
  }
  function _cerrarWelcome() { const el=document.getElementById('gc-welcome'); if(el) el.remove(); }

  /* ══════════════════════════════════════════════════════════════════════════
     TOUR PASO A PASO
  ══════════════════════════════════════════════════════════════════════════ */
  function _startTour() {
    if (_tourOpen) return;
    _tourOpen=true; _tourStep=0; _renderTourStep();
  }

  function _renderTourStep() {
    ['gc-tour-spotlight','gc-tour-card','gc-tour-focus-ring'].forEach(id=>{const e=document.getElementById(id);if(e)e.remove();});
    const step=TOUR_STEPS[_tourStep], total=TOUR_STEPS.length, isLast=_tourStep===total-1;

    const spotlight=document.createElement('div');
    spotlight.id='gc-tour-spotlight';
    document.body.appendChild(spotlight);

    const card=document.createElement('div');
    card.id='gc-tour-card';
    const dots=Array.from({length:total},(_,i)=>`<div class="gc-tour-dot${i===_tourStep?' active':''}"></div>`).join('');
    card.innerHTML=`
      <div class="gc-tour-step-num">PASO ${_tourStep+1} DE ${total}</div>
      <div class="gc-tour-title">${step.title}</div>
      <p class="gc-tour-body">${step.body}</p>
      <div class="gc-tour-footer">
        <div class="gc-tour-dots">${dots}</div>
        ${!isLast?`<button class="gc-tour-skip" onclick="GuestController._closeTour()">Saltar</button>`:''}
        <button class="gc-tour-btn" onclick="GuestController._tourNext()">${step.btnText||(isLast?'Finalizar ✓':'Siguiente →')}</button>
      </div>`;
    document.body.appendChild(card);

    // Calcular dimensiones reales ya con el card en el DOM
    const cardW = Math.min(340, window.innerWidth - 32);
    const cardH = card.offsetHeight || 220;
    card.style.width    = cardW + 'px';
    card.style.maxWidth = cardW + 'px';

    if (step.target) {
      const anchor = document.querySelector(step.target);
      if (anchor) {
        const rect = anchor.getBoundingClientRect();
        const PAD  = 10; // padding alrededor del elemento destacado

        // ── Spotlight con agujero recortado (clip-path evenodd) ──────────
        // Polígono exterior = pantalla completa (sentido horario)
        // Polígono interior = hueco del elemento (sentido antihorario) → crea agujero
        const W = window.innerWidth, H = window.innerHeight;
        const hx1 = Math.max(0, rect.left  - PAD);
        const hy1 = Math.max(0, rect.top   - PAD);
        const hx2 = Math.min(W, rect.right + PAD);
        const hy2 = Math.min(H, rect.bottom+ PAD);
        spotlight.style.clipPath = [
          'polygon(evenodd,',
          // exterior (horario)
          `0px 0px, ${W}px 0px, ${W}px ${H}px, 0px ${H}px, 0px 0px,`,
          // hueco (antihorario)
          `${hx1}px ${hy1}px, ${hx1}px ${hy2}px, ${hx2}px ${hy2}px, ${hx2}px ${hy1}px, ${hx1}px ${hy1}px`,
          ')'
        ].join(' ');

        // ── Anillo de foco sobre el elemento ────────────────────────────
        const ring = document.createElement('div');
        ring.id = 'gc-tour-focus-ring';
        ring.style.left   = hx1 + 'px';
        ring.style.top    = hy1 + 'px';
        ring.style.width  = (hx2 - hx1) + 'px';
        ring.style.height = (hy2 - hy1) + 'px';
        // Ajustar border-radius al del elemento si lo tiene
        const anchorBr = getComputedStyle(anchor).borderRadius;
        ring.style.borderRadius = anchorBr && anchorBr !== '0px' ? anchorBr : '10px';
        document.body.appendChild(ring);

        // ── Posicionar la tarjeta ────────────────────────────────────────
        let left = rect.left + rect.width / 2 - cardW / 2;
        left = Math.max(16, Math.min(left, window.innerWidth - cardW - 16));
        let top = rect.top - cardH - 24;
        if (top < 70) top = rect.bottom + 24;
        top = Math.max(70, Math.min(top, window.innerHeight - cardH - 16));
        card.style.left      = left + 'px';
        card.style.top       = top  + 'px';
        card.style.transform = 'none';

        // ── Flecha apuntando al elemento ─────────────────────────────────
        const arrow = document.createElement('div');
        const cardBottom = top + cardH;
        arrow.className = cardBottom <= rect.top ? 'gc-tour-arrow down' : 'gc-tour-arrow up';
        const arrowLeft = (rect.left + rect.width / 2) - left;
        arrow.style.left      = Math.max(16, Math.min(arrowLeft, cardW - 20)) + 'px';
        arrow.style.transform = 'none';
        card.appendChild(arrow);

        card._hl = anchor;
      } else {
        _centerCard(card, cardW, cardH);
      }
    } else {
      // Sin target — solo overlay oscuro sin agujero, centrado
      _centerCard(card, cardW, cardH);
    }
  }

  function _centerCard(card, cardW, cardH) {
    // Centrado en px reales — sin transform para no pelear con la animacion gcPopIn
    cardW = cardW || card.offsetWidth  || Math.min(340, window.innerWidth  - 32);
    cardH = cardH || card.offsetHeight || 220;
    card.style.left      = Math.round((window.innerWidth  - cardW) / 2) + 'px';
    card.style.top       = Math.round((window.innerHeight - cardH) / 2) + 'px';
    card.style.transform = 'none';
  }

  function _clearHighlight() {
    // Limpiar focus-ring y clip-path del spotlight
    const ring=document.getElementById('gc-tour-focus-ring'); if(ring) ring.remove();
    const sp=document.getElementById('gc-tour-spotlight'); if(sp) sp.style.clipPath='';
    // Limpiar cualquier estilo residual en el anchor
    const card=document.getElementById('gc-tour-card');
    if (card && card._hl) {
      card._hl.style.position=''; card._hl.style.zIndex='';
      card._hl.style.boxShadow=''; card._hl.style.borderRadius='';
    }
  }

  function _tourNext() {
    _clearHighlight(); _tourStep++;
    if (_tourStep>=TOUR_STEPS.length) _closeTour(); else _renderTourStep();
  }

  function _closeTour() {
    _tourOpen=false; _markTourDone();
    ['gc-tour-spotlight','gc-tour-card','gc-tour-focus-ring'].forEach(id=>{const e=document.getElementById(id);if(e)e.remove();});
    document.querySelectorAll('.nav-btn').forEach(el=>{el.style.position='';el.style.boxShadow='';el.style.zIndex='';el.style.borderRadius='';});
  }

  /* ══════════════════════════════════════════════════════════════════════════
     TOOLTIPS "?"
  ══════════════════════════════════════════════════════════════════════════ */
  function _injectTooltips() {
    let activePopup=null;
    TOOLTIPS.forEach(cfg=>{
      document.querySelectorAll(cfg.anchorSelector).forEach(anchor=>{
        if (anchor.querySelector('.gc-tip-btn')) return;
        const btn=document.createElement('span');
        btn.className='gc-tip-btn'; btn.textContent='?';
        btn.onclick=e=>{
          e.stopPropagation();
          if (activePopup){activePopup.remove();activePopup=null;return;}
          const popup=document.createElement('div');
          popup.className='gc-tooltip-popup'; popup.textContent=cfg.text;
          document.body.appendChild(popup);
          activePopup=popup;
          const r=btn.getBoundingClientRect(), pw=260;
          let left=r.left+r.width/2-pw/2;
          left=Math.max(12,Math.min(left,window.innerWidth-pw-12));
          let top=r.top-10;
          // Si no cabe arriba, poner abajo
          popup.style.left=left+'px'; popup.style.top='0px';
          const ph=popup.offsetHeight||60;
          top=r.top-ph-10;
          popup.style.top=(top<60?r.bottom+8:top)+'px';
          popup.style.maxWidth=pw+'px';
          const close=()=>{popup.remove();activePopup=null;document.removeEventListener('click',close);};
          setTimeout(()=>document.addEventListener('click',close),50);
          setTimeout(()=>{if(activePopup===popup)close();},5000);
        };
        if (anchor.parentNode) anchor.parentNode.insertBefore(btn,anchor.nextSibling);
      });
    });
  }

  /* ══════════════════════════════════════════════════════════════════════════
     MOCK DATA — inyección y limpieza
  ══════════════════════════════════════════════════════════════════════════ */
  function _inyectarMockData() {
    if (typeof data==='undefined') return;
    if (!data.history.some(h=>h._isDemo))
      data.history=[...MOCK_PEDIDOS,...data.history];
    if (!Array.isArray(data.ventaHistory)) data.ventaHistory=[];
    if (!data.ventaHistory.some(h=>h._isDemo))
      data.ventaHistory=[...MOCK_VENTAS,...data.ventaHistory];
    if (typeof renderHistory==='function')      renderHistory();
    if (typeof renderAllScreens==='function')   renderAllScreens();
    if (typeof renderVentaHistory==='function') renderVentaHistory();
  }

  function _limpiarMockData() {
    if (typeof data==='undefined') return;
    data.history     =(data.history     ||[]).filter(h=>!h._isDemo);
    data.ventaHistory=(data.ventaHistory||[]).filter(h=>!h._isDemo);
  }

  function _renderGuestSessionBtn() {
    // Elimina botón registrado anterior (si quedó de sesión previa)
    const old = document.getElementById('btn-signout');
    if (old) old.remove();
    // Evita duplicado del botón invitado
    if (document.getElementById('gc-session-btn')) return;
    const configScreen = document.getElementById('screen-config');
    if (!configScreen) return;
    const container = configScreen.querySelector('.container');
    if (!container) return;
    const btn = document.createElement('button');
    btn.id = 'gc-session-btn';
    btn.className = 'btn-main ghost-btn';
    btn.style.cssText = 'margin:8px 0;width:100%;color:var(--danger);text-transform:none;font-size:13px';
    btn.innerHTML = '🚪 Cerrar sesión &nbsp;<span style="font-weight:400;opacity:0.75">(usuario invitado)</span>';
    btn.onclick = () => _irALogin();
    container.appendChild(btn);
  }

  function _desactivar() {
    _active=false; _closeTour();
    localStorage.removeItem(GUEST_ACTIVE);
    _limpiarMockData();
    const b=document.getElementById('gc-banner'); if(b) b.remove();
    const s=document.getElementById('gc-session-btn'); if(s) s.remove();
  }

  /* ══════════════════════════════════════════════════════════════════════════
     API PÚBLICA
  ══════════════════════════════════════════════════════════════════════════ */

  /**
   * HOOK 1 — inicio del bloque else en onAuthStateChanged
   *
   *   } else {
   *       // [GUEST MODE] ────────────────────────────────────────────────
   *       GuestController.activar();
   *       return;
   *       // [/GUEST MODE] ───────────────────────────────────────────────
   */
  async function activar() {
    _active=true;
    localStorage.setItem(GUEST_ACTIVE,'1');
    if (_getOps()>GUEST_MAX_OPS) _resetOps();

    _injectStyles();

    // ①  Ocultar login, mostrar app
    const ls=document.getElementById('login-screen');
    const am=document.getElementById('app-main');
    if (ls) ls.style.display='none';
    if (am) am.style.display='block';
    if (typeof hideSplash==='function') hideSplash();

    // ②  Ocultar Admin (el invitado no debe verlo)
    if (typeof aplicarVisibilidadAdmin==='function') aplicarVisibilidadAdmin(false);
    if (typeof aplicarPermisosUsuario==='function')  aplicarPermisosUsuario(false);

    // ③  Cargar catálogo real de Firestore (prods, kits, distributors)
    //    Firestore requiere request.auth != null; el invitado no tiene sesión,
    //    por eso primero obtenemos credenciales anónimas (solo lectura) y luego
    //    cargamos el catálogo. La bandera window._guestAnonAuth evita que
    //    onAuthStateChanged procese al usuario anónimo como cuenta real.
    if (typeof fbLoadCatalogo==='function') {
      try {
        const auth = (typeof firebase!=='undefined') ? firebase.auth() : null;
        if (auth && !auth.currentUser) {
          window._guestAnonAuth = true;          // señal para onAuthStateChanged
          await auth.signInAnonymously();        // dispara onAuthStateChanged →
          // onAuthStateChanged detecta _guestAnonAuth y aborta el flujo normal;
          // el catálogo se carga a continuación con las credenciales activas.
        }
        await fbLoadCatalogo();
      } catch(e) {
        window._guestAnonAuth = false;
        console.warn('[GuestMode] Catálogo sin conexión, usando local', e.message||e);
      }
    }

    // ④  Inicializar app
    if (!window._fbLoaded) {
      window._fbLoaded=true;
      if (typeof init==='function') init();
    } else {
      if (typeof renderAllScreens==='function') renderAllScreens();
      if (typeof renderKitsScreen==='function') renderKitsScreen();
      if (typeof populateKitSelector==='function') populateKitSelector();
    }

    // ⑤  Inyectar demos, banner, tooltips y bienvenida
    setTimeout(()=>{
      _inyectarMockData();
      _renderBanner();
      _injectTooltips();
      _showWelcome();
      _renderGuestSessionBtn();
    }, 400);
  }

  /**
   * HOOK 2 — primera línea de saveAndShow() y saveVentaCotizacion()
   *
   *   if (GuestController.interceptarCotizacion()) return;
   */
  function interceptarCotizacion() {
    if (!_active) return false;
    const ops=_getOps();
    if (ops<=0) { _showPaywall(false); return true; }
    _setOps(ops-1);
    _renderBanner();
    if (ops-1<=0) setTimeout(()=>_showPaywall(false),900);
    return false;
  }

  /**
   * HOOK 3 — inicio del bloque if(user) en onAuthStateChanged
   *
   *   GuestController.onLogin();
   */
  function onLogin() {
    _desactivar(); _cerrarPaywall(); _cerrarWelcome(); _resetOps();
    localStorage.removeItem(TOUR_DONE_KEY);
  }

  function esInvitado() { return _active; }

  return {
    activar, interceptarCotizacion, onLogin, esInvitado,
    _irALogin, _cerrarPaywall, _cerrarWelcome, _showPaywall,
    _startTour, _tourNext, _closeTour,
  };

})();
