/**
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  guestController.js  —  AluGest Pro  v1.0                              │
 * │  Modo Invitado: aislado, quirúrgico y 100 % reversible.                │
 * │                                                                         │
 * │  PARA REMOVER ESTE MÓDULO EN EL FUTURO:                                 │
 * │    1. Borra este archivo (guestController.js).                          │
 * │    2. En ListaMaterial.html elimina la etiqueta <script> que lo carga.  │
 * │    3. En onAuthStateChanged (bloque else), elimina la línea:            │
 * │         GuestController.activar();                                       │
 * │    4. En saveAndShow(), elimina la línea:                               │
 * │         if (GuestController.interceptarCotizacion()) return;            │
 * │    5. En saveVentaCotizacion(), elimina la misma línea anterior.        │
 * │  Eso es todo — ninguna otra función nativa resulta afectada.            │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

const GuestController = (() => {

  // ─── Constantes ────────────────────────────────────────────────────────────
  const GUEST_KEY      = 'alugest_guest_ops';   // localStorage: contador de ops
  const GUEST_MAX_OPS  = 3;                     // cotizaciones gratuitas
  const GUEST_ACTIVE   = 'alugest_guest_mode';  // flag de sesión activa

  // ─── Datos de plantillas de ejemplo ─────────────────────────────────────────
  const MOCK_TEMPLATES = [
    {
      id: 'demo_001',
      folio: 'DEMO-001',
      client: 'EJEMPLO: RESIDENCIA RAMÍREZ',
      date: new Date().toLocaleDateString('es-MX', { day:'2-digit', month:'2-digit', year:'numeric' }),
      _isDemo: true,
      cart: {},
      itemsSnapshot: [
        { id: 9001, name: 'PERFIL RIEL SUPERIOR 3"',   color: 'BLANCO',    category: 'perfil',   measureGroup: 'ML', price: 185, qty: 4.8 },
        { id: 9002, name: 'PERFIL RIEL INFERIOR 3"',   color: 'BLANCO',    category: 'perfil',   measureGroup: 'ML', price: 165, qty: 4.8 },
        { id: 9003, name: 'PERFIL JAMBA LATERAL 3"',   color: 'BLANCO',    category: 'perfil',   measureGroup: 'ML', price: 175, qty: 5.0 },
        { id: 9004, name: 'HOJA CORREDIZA 3"',          color: 'BLANCO',    category: 'perfil',   measureGroup: 'ML', price: 198, qty: 9.6 },
        { id: 9005, name: 'VIDRIO CLARO 6mm',           color: 'CLARO',     category: 'vidrio',   measureGroup: 'M2', price: 320, qty: 3.2 },
        { id: 9006, name: 'RODAMIENTOS NYLON (par)',    color: 'N/A',       category: 'herraje',  measureGroup: '',   price: 45,  qty: 4   },
        { id: 9007, name: 'CERRADURA CORREDIZA',        color: 'N/A',       category: 'herraje',  measureGroup: '',   price: 120, qty: 2   },
        { id: 9008, name: 'SELLADOR SILICÓN TRANSP.',   color: 'N/A',       category: 'consumible', measureGroup: '', price: 68,  qty: 2   },
      ],
      _summary: { label: 'Ventana Corrediza Línea 3"', desc: '2 hojas · 2.4×1.6 m · Vidrio 6mm', icon: '🪟' }
    },
    {
      id: 'demo_002',
      folio: 'DEMO-002',
      client: 'EJEMPLO: BAÑO DEPTO. "B"',
      date: new Date().toLocaleDateString('es-MX', { day:'2-digit', month:'2-digit', year:'numeric' }),
      _isDemo: true,
      cart: {},
      itemsSnapshot: [
        { id: 9010, name: 'PERFIL CANAL U PIVOTE',       color: 'NATURAL',   category: 'perfil',   measureGroup: 'ML', price: 210, qty: 2.2 },
        { id: 9011, name: 'PERFIL BORDE TEMPLADO 10mm',  color: 'NATURAL',   category: 'perfil',   measureGroup: 'ML', price: 195, qty: 2.0 },
        { id: 9012, name: 'VIDRIO TEMPLADO 10mm',        color: 'CLARO',     category: 'vidrio',   measureGroup: 'M2', price: 980, qty: 1.1 },
        { id: 9013, name: 'BISAGRA PIVOTE PISO-TECHO',   color: 'CROMO',     category: 'herraje',  measureGroup: '',   price: 850, qty: 1   },
        { id: 9014, name: 'JALADOR BARRA INOX 30cm',     color: 'INOX',      category: 'herraje',  measureGroup: '',   price: 340, qty: 1   },
        { id: 9015, name: 'SELLADOR NEUTRO BAÑO',        color: 'N/A',       category: 'consumible', measureGroup: '', price: 82,  qty: 1   },
      ],
      _summary: { label: 'Puerta de Baño Vidrio Templado', desc: 'Pivote · 0.85×2.05 m · 10mm', icon: '🚿' }
    },
    {
      id: 'demo_003',
      folio: 'DEMO-003',
      client: 'EJEMPLO: CANCEL SALA COMEDOR',
      date: new Date().toLocaleDateString('es-MX', { day:'2-digit', month:'2-digit', year:'numeric' }),
      _isDemo: true,
      cart: {},
      itemsSnapshot: [
        { id: 9020, name: 'PERFIL CANCEL TRADICIONAL MARCO', color: 'BRONCE',  category: 'perfil',   measureGroup: 'ML', price: 220, qty: 12.0 },
        { id: 9021, name: 'PERFIL CANCEL DIVISION VERTICAL',  color: 'BRONCE',  category: 'perfil',   measureGroup: 'ML', price: 198, qty: 4.0  },
        { id: 9022, name: 'VIDRIO CLARO 4mm',                color: 'CLARO',   category: 'vidrio',   measureGroup: 'M2', price: 185, qty: 5.6  },
        { id: 9023, name: 'BISAGRAS VAIVÉN 3" (par)',        color: 'BRONCE',  category: 'herraje',  measureGroup: '',   price: 185, qty: 2    },
        { id: 9024, name: 'CERROJO CANCEL BRONCE',           color: 'BRONCE',  category: 'herraje',  measureGroup: '',   price: 95,  qty: 2    },
        { id: 9025, name: 'TORNILLO AUTOPERF. 3/4"',        color: 'N/A',     category: 'consumible', measureGroup: '', price: 2,   qty: 60   },
        { id: 9026, name: 'SELLADOR SILICÓN MADERA',        color: 'N/A',     category: 'consumible', measureGroup: '', price: 68,  qty: 2    },
      ],
      _summary: { label: 'Cancel Tradicional Bronce', desc: '3×2 m · 4 paños · Vidrio 4mm', icon: '🏠' }
    },
    {
      id: 'demo_004',
      folio: 'DEMO-004',
      client: 'EJEMPLO: FACHADA OFICINAS',
      date: new Date().toLocaleDateString('es-MX', { day:'2-digit', month:'2-digit', year:'numeric' }),
      _isDemo: true,
      cart: {},
      itemsSnapshot: [
        { id: 9030, name: 'PERFIL TUBULAR RECTO 1"×1"',     color: 'NEGRO',   category: 'perfil',   measureGroup: 'ML', price: 145, qty: 18.0 },
        { id: 9031, name: 'PERFIL L ESQUINERO 1"',           color: 'NEGRO',   category: 'perfil',   measureGroup: 'ML', price: 130, qty: 6.0  },
        { id: 9032, name: 'VIDRIO ESPEJO 4mm',               color: 'PLATA',   category: 'vidrio',   measureGroup: 'M2', price: 420, qty: 3.8  },
        { id: 9033, name: 'SILICÓN ESTRUCTURAL NEGRO',       color: 'N/A',     category: 'consumible', measureGroup: '', price: 145, qty: 3    },
        { id: 9034, name: 'TAQUETES FISHER 5/16"',          color: 'N/A',     category: 'consumible', measureGroup: '', price: 4,   qty: 30   },
      ],
      _summary: { label: 'Mampara de Espejo Modular', desc: 'Tubo negro 1" · 2.4×1.6 m', icon: '🪞' }
    }
  ];

  // ─── Estado interno ────────────────────────────────────────────────────────
  let _active = false;

  // ─── Helpers ───────────────────────────────────────────────────────────────

  function _getOps() {
    const v = parseInt(localStorage.getItem(GUEST_KEY), 10);
    return isNaN(v) ? GUEST_MAX_OPS : v;
  }

  function _setOps(n) {
    localStorage.setItem(GUEST_KEY, Math.max(0, n));
  }

  function _resetOps() {
    localStorage.setItem(GUEST_KEY, GUEST_MAX_OPS);
  }

  // ─── Estilos del Módulo ────────────────────────────────────────────────────
  function _injectStyles() {
    if (document.getElementById('gc-styles')) return;
    const s = document.createElement('style');
    s.id = 'gc-styles';
    s.textContent = `
      /* ── GuestController Styles ── */
      #gc-banner {
        position: fixed; bottom: 72px; left: 50%; transform: translateX(-50%);
        z-index: 8800; display: flex; align-items: center; gap: 10px;
        background: rgba(26,34,54,0.92); backdrop-filter: blur(16px) saturate(180%);
        border: 1px solid rgba(124,157,255,0.30); border-radius: 50px;
        padding: 9px 18px 9px 14px; box-shadow: 0 4px 24px rgba(0,0,0,0.35);
        font-family: 'DM Sans', system-ui, sans-serif; white-space: nowrap;
        animation: gcSlideUp .35s cubic-bezier(.22,.68,0,1.12) both;
        cursor: pointer; transition: transform .15s;
      }
      #gc-banner:hover { transform: translateX(-50%) scale(1.03); }
      #gc-banner .gc-chips { display: flex; gap: 6px; }
      #gc-banner .gc-chip {
        width: 10px; height: 10px; border-radius: 50%;
        background: rgba(255,255,255,0.18); transition: background .3s;
      }
      #gc-banner .gc-chip.used { background: #7c9dff; }
      #gc-banner .gc-label {
        font-size: 12px; font-weight: 600; color: #a8b8d8; letter-spacing: .3px;
      }
      #gc-banner .gc-label span { color: #7c9dff; }

      /* ── Paywall overlay ── */
      #gc-paywall {
        position: fixed; inset: 0; z-index: 9998;
        background: rgba(10,14,26,0.75);
        backdrop-filter: blur(18px) saturate(160%);
        display: flex; align-items: center; justify-content: center;
        padding: 20px; animation: gcFadeIn .28s ease both;
      }
      #gc-paywall-card {
        background: rgba(26,34,54,0.95);
        border: 1px solid rgba(124,157,255,0.22);
        border-radius: 24px; max-width: 380px; width: 100%;
        box-shadow: 0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(124,157,255,0.08);
        overflow: hidden; animation: gcPopIn .32s cubic-bezier(.22,.68,0,1.12) both;
      }
      .gc-pw-header {
        background: linear-gradient(135deg, #3b5bdb 0%, #7c3aed 100%);
        padding: 28px 24px 24px; text-align: center; position: relative;
      }
      .gc-pw-icon { font-size: 40px; margin-bottom: 10px; position: relative; z-index: 1; }
      .gc-pw-title {
        font-family: 'DM Sans', system-ui, sans-serif;
        font-size: 18px; font-weight: 800; color: #fff;
        line-height: 1.3; position: relative; z-index: 1; margin: 0;
      }
      .gc-pw-sub {
        font-family: 'DM Sans', system-ui, sans-serif;
        font-size: 12px; color: rgba(255,255,255,.7);
        margin: 6px 0 0; position: relative; z-index: 1;
      }
      .gc-pw-body { padding: 22px 22px 20px; }
      .gc-pw-benefits { list-style: none; margin: 0 0 20px; padding: 0; display: flex; flex-direction: column; gap: 10px; }
      .gc-pw-benefits li {
        display: flex; align-items: flex-start; gap: 10px;
        font-family: 'DM Sans', system-ui, sans-serif;
        font-size: 13px; color: #a8b8d8; line-height: 1.45;
      }
      .gc-pw-benefits li .gc-bicon {
        width: 26px; height: 26px; border-radius: 8px; flex-shrink: 0;
        background: rgba(124,157,255,0.14); display: flex; align-items: center;
        justify-content: center; font-size: 14px; margin-top: 1px;
      }
      .gc-pw-benefits li strong { color: #f0f4ff; display: block; font-size: 13px; font-weight: 700; }
      .gc-btn-register {
        width: 100%; padding: 15px; border: none; border-radius: 14px;
        background: linear-gradient(135deg, #3b5bdb 0%, #7c3aed 100%);
        color: #fff; font-family: 'DM Sans', system-ui, sans-serif;
        font-size: 15px; font-weight: 800; cursor: pointer; letter-spacing: .3px;
        box-shadow: 0 4px 18px rgba(59,91,219,0.45);
        transition: transform .15s, box-shadow .15s;
      }
      .gc-btn-register:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(59,91,219,0.55); }
      .gc-btn-register:active { transform: translateY(0); }
      .gc-pw-note {
        font-family: 'DM Sans', system-ui, sans-serif;
        font-size: 11px; color: #6a80a8; text-align: center;
        margin: 12px 0 0; line-height: 1.5;
      }
      .gc-btn-dismiss {
        display: block; margin: 10px auto 0; background: none; border: none;
        color: #6a80a8; font-size: 12px; font-family: 'DM Sans', system-ui, sans-serif;
        cursor: pointer; padding: 4px 8px;
      }
      .gc-btn-dismiss:hover { color: #a8b8d8; }

      /* ── Demo badge en historial ── */
      .gc-demo-badge {
        display: inline-flex; align-items: center; gap: 4px;
        background: rgba(124,157,255,0.14); color: #7c9dff;
        border: 1px solid rgba(124,157,255,0.22); border-radius: 20px;
        font-size: 10px; font-weight: 700; padding: 2px 8px; letter-spacing: .4px;
      }

      /* ── Welcome overlay ── */
      #gc-welcome {
        position: fixed; inset: 0; z-index: 9997;
        background: rgba(10,14,26,0.82); backdrop-filter: blur(20px);
        display: flex; align-items: flex-end; justify-content: center;
        padding: 0 16px 32px; animation: gcFadeIn .3s ease both;
      }
      #gc-welcome-card {
        background: rgba(20,28,48,0.97);
        border: 1px solid rgba(124,157,255,0.22);
        border-radius: 24px 24px 20px 20px; max-width: 420px; width: 100%;
        padding: 28px 24px 24px;
        box-shadow: 0 -8px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(124,157,255,0.06);
        animation: gcSlideUp .4s cubic-bezier(.22,.68,0,1.12) both;
      }
      .gc-wc-emoji { font-size: 36px; margin-bottom: 6px; }
      .gc-wc-title {
        font-family: 'DM Sans', system-ui, sans-serif;
        font-size: 20px; font-weight: 800; color: #f0f4ff; margin: 0 0 6px;
      }
      .gc-wc-desc {
        font-family: 'DM Sans', system-ui, sans-serif;
        font-size: 13px; color: #6a80a8; margin: 0 0 18px; line-height: 1.5;
      }
      .gc-wc-counter {
        display: flex; align-items: center; gap: 8px;
        background: rgba(59,91,219,0.12); border: 1px solid rgba(59,91,219,0.22);
        border-radius: 12px; padding: 10px 14px; margin-bottom: 18px;
      }
      .gc-wc-counter-label {
        font-family: 'DM Sans', system-ui, sans-serif;
        font-size: 12px; color: #a8b8d8; flex: 1;
      }
      .gc-wc-counter-val {
        font-size: 18px; font-weight: 800; color: #7c9dff; font-family: 'DM Mono', monospace;
      }
      .gc-btn-continue {
        width: 100%; padding: 14px; border: none; border-radius: 14px;
        background: #3b5bdb; color: #fff;
        font-family: 'DM Sans', system-ui, sans-serif;
        font-size: 15px; font-weight: 800; cursor: pointer; margin-bottom: 10px;
        transition: background .15s;
      }
      .gc-btn-continue:hover { background: #2f4ac2; }
      .gc-btn-login-link {
        display: block; text-align: center; background: none; border: none;
        color: #6a80a8; font-size: 12px; font-family: 'DM Sans', system-ui, sans-serif;
        cursor: pointer; padding: 6px;
      }
      .gc-btn-login-link:hover { color: #a8b8d8; }

      /* ── Keyframes ── */
      @keyframes gcFadeIn { from { opacity:0 } to { opacity:1 } }
      @keyframes gcSlideUp { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
      @keyframes gcPopIn {
        from { opacity:0; transform:scale(.88) translateY(16px) }
        to   { opacity:1; transform:scale(1) translateY(0) }
      }
    `;
    document.head.appendChild(s);
  }

  // ─── Banner flotante (contador de usos) ────────────────────────────────────
  function _renderBanner() {
    let banner = document.getElementById('gc-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'gc-banner';
      banner.onclick = () => _showPaywall(true);
      document.body.appendChild(banner);
    }
    const ops = _getOps();
    const chips = Array.from({ length: GUEST_MAX_OPS }, (_, i) =>
      `<div class="gc-chip${i < ops ? ' used' : ''}"></div>`
    ).join('');
    banner.innerHTML = `
      <div class="gc-chips">${chips}</div>
      <div class="gc-label">Modo Invitado · <span>${ops}/${GUEST_MAX_OPS} cotizaciones</span></div>
    `;
  }

  // ─── Paywall / Modal de Registro ───────────────────────────────────────────
  function _showPaywall(dismissible = false) {
    if (document.getElementById('gc-paywall')) return;

    const overlay = document.createElement('div');
    overlay.id = 'gc-paywall';
    overlay.innerHTML = `
      <div id="gc-paywall-card">
        <div class="gc-pw-header">
          <div class="gc-pw-icon">🔓</div>
          <p class="gc-pw-title">¡Pruebas gratuitas agotadas!</p>
          <p class="gc-pw-sub">Regístrate gratis para seguir cotizando</p>
        </div>
        <div class="gc-pw-body">
          <ul class="gc-pw-benefits">
            <li>
              <div class="gc-bicon">☁️</div>
              <div><strong>Historial ilimitado en la nube</strong>Clientes, proyectos y cotizaciones guardadas y accesibles siempre.</div>
            </li>
            <li>
              <div class="gc-bicon">💲</div>
              <div><strong>Tu lista de precios personalizada</strong>Ingresa los precios de tus proveedores locales; nadie más los ve.</div>
            </li>
            <li>
              <div class="gc-bicon">🔒</div>
              <div><strong>Espacio privado y seguro</strong>Tu base de datos es tuya. Ni otros usuarios ni el admin ven tus datos.</div>
            </li>
            <li>
              <div class="gc-bicon">📱</div>
              <div><strong>Cualquier teléfono o computadora</strong>Tu cuenta viaja contigo. Inicia sesión donde quieras.</div>
            </li>
          </ul>
          <button class="gc-btn-register" onclick="GuestController._irALogin()">
            ✉️ &nbsp;Crear cuenta o Iniciar sesión
          </button>
          <p class="gc-pw-note">
            El registro asigna un espacio de base de datos único, privado y cifrado para tu taller.
          </p>
          ${dismissible ? `<button class="gc-btn-dismiss" onclick="GuestController._cerrarPaywall()">Seguir explorando como invitado</button>` : ''}
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    if (dismissible) {
      overlay.addEventListener('click', e => {
        if (e.target === overlay) _cerrarPaywall();
      });
    }
  }

  function _cerrarPaywall() {
    const el = document.getElementById('gc-paywall');
    if (el) el.remove();
  }

  function _irALogin() {
    _cerrarPaywall();
    const appMain     = document.getElementById('app-main');
    const loginScreen = document.getElementById('login-screen');
    if (appMain)      appMain.style.display      = 'none';
    if (loginScreen) {
      loginScreen.style.display       = 'flex';
      loginScreen.style.flexDirection = 'column';
    }
    _desactivar();
  }

  // ─── Pantalla de bienvenida ────────────────────────────────────────────────
  function _showWelcome() {
    const overlay = document.createElement('div');
    overlay.id = 'gc-welcome';
    overlay.innerHTML = `
      <div id="gc-welcome-card">
        <div class="gc-wc-emoji">👋</div>
        <h2 class="gc-wc-title">Bienvenido a AluGest Pro</h2>
        <p class="gc-wc-desc">
          Estás en <strong style="color:#7c9dff">Modo Invitado</strong>.
          Cargamos 4 plantillas de proyectos reales de cancelería para que explores
          cómo la app desglosa perfiles, herrajes, vidrios y costos en tiempo real.
        </p>
        <div class="gc-wc-counter">
          <span class="gc-wc-counter-label">Cotizaciones de prueba disponibles</span>
          <span class="gc-wc-counter-val">${_getOps()}/${GUEST_MAX_OPS}</span>
        </div>
        <button class="gc-btn-continue" onclick="GuestController._cerrarWelcome()">
          Explorar plantillas →
        </button>
        <button class="gc-btn-login-link" onclick="GuestController._irALogin()">
          Ya tengo cuenta — Iniciar sesión
        </button>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  function _cerrarWelcome() {
    const el = document.getElementById('gc-welcome');
    if (el) el.remove();
  }

  // ─── Inyectar plantillas demo en data.history ─────────────────────────────
  function _inyectarMockData() {
    if (typeof data === 'undefined') return;
    const yaExisten = data.history.some(h => h._isDemo);
    if (!yaExisten) {
      data.history = [...MOCK_TEMPLATES, ...data.history];
    }
    if (typeof renderHistory === 'function') renderHistory();
    if (typeof renderAllScreens === 'function') renderAllScreens();
  }

  function _limpiarMockData() {
    if (typeof data === 'undefined') return;
    data.history = data.history.filter(h => !h._isDemo);
  }

  function _desactivar() {
    _active = false;
    localStorage.removeItem(GUEST_ACTIVE);
    _limpiarMockData();
    const banner = document.getElementById('gc-banner');
    if (banner) banner.remove();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  API PÚBLICA
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * HOOK 1 de 3 — Pega esta línea en el bloque `else` de onAuthStateChanged:
   *
   *   } else {
   *       // [GUEST MODE] ── 1 línea ──────────────────────────────────────
   *       GuestController.activar();
   *       // [/GUEST MODE] ───────────────────────────────────────────────
   *       _currentUser = null;
   *       _fbIsAdmin   = false;
   *       ...
   */
  function activar() {
    _active = true;
    localStorage.setItem(GUEST_ACTIVE, '1');
    if (_getOps() > GUEST_MAX_OPS) _resetOps();

    _injectStyles();

    const loginScreen = document.getElementById('login-screen');
    const appMain     = document.getElementById('app-main');
    if (loginScreen) loginScreen.style.display = 'none';
    if (appMain)     appMain.style.display      = 'block';

    if (typeof hideSplash === 'function') hideSplash();

    // Inicializar app normalmente (usa datos de localStorage del invitado, si los hay)
    if (typeof init === 'function') {
      if (!window._fbLoaded) { window._fbLoaded = true; init(); }
      else { if (typeof renderAllScreens === 'function') renderAllScreens(); }
    }

    setTimeout(() => {
      _inyectarMockData();
      _renderBanner();
      _showWelcome();
    }, 350);
  }

  /**
   * HOOK 2 de 3 — Pega esta línea como PRIMERA línea de saveAndShow():
   *
   *   async function saveAndShow() { vibrate(30);
   *       // [GUEST MODE] ── 1 línea ──────────────────────────────────────
   *       if (GuestController.interceptarCotizacion()) return;
   *       // [/GUEST MODE] ───────────────────────────────────────────────
   *       const now = new Date();
   *       ...
   *
   * HOOK 3 de 3 — Pega la misma línea como PRIMERA línea de saveVentaCotizacion():
   *
   *   async function saveVentaCotizacion() {
   *       // [GUEST MODE] ── 1 línea ──────────────────────────────────────
   *       if (GuestController.interceptarCotizacion()) return;
   *       // [/GUEST MODE] ───────────────────────────────────────────────
   *       const includePerfiles = ...
   */
  function interceptarCotizacion() {
    if (!_active) return false;

    const ops = _getOps();
    if (ops <= 0) {
      _showPaywall(false);
      return true;
    }

    _setOps(ops - 1);
    _renderBanner();

    if (ops - 1 <= 0) {
      setTimeout(() => _showPaywall(false), 900);
    }

    return false; // permite continuar con el guardado local normal
  }

  /**
   * HOOK OPCIONAL — Pega al inicio del bloque `if (user)` en onAuthStateChanged:
   *
   *   if (user) {
   *       // [GUEST MODE] ── 1 línea ──────────────────────────────────────
   *       GuestController.onLogin();
   *       // [/GUEST MODE] ───────────────────────────────────────────────
   *       _currentUser = user;
   *       ...
   */
  function onLogin() {
    _desactivar();
    _cerrarPaywall();
    _cerrarWelcome();
    _resetOps();
  }

  function esInvitado() { return _active; }

  // Métodos expuestos para onclick inline generado dinámicamente
  return {
    activar,
    interceptarCotizacion,
    onLogin,
    esInvitado,
    _irALogin,
    _cerrarPaywall,
    _cerrarWelcome,
    _showPaywall,
  };

})();
