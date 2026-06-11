# Modo Invitado — Guía de Integración
## AluGest Pro · `guestController.js` v1.0

---

## Archivos entregados

| Archivo | Descripción |
|---------|-------------|
| `guestController.js` | Módulo autocontenido. Va junto a `ListaMaterial.html` en tu repo. |
| `GUEST_MODE_INTEGRATION.md` | Esta guía. |

---

## Paso 1 — Cargar el módulo en `ListaMaterial.html`

Agrega esta línea **justo antes del cierre `</body>`** (o después de los `<script>` de Firebase):

```html
<!-- [GUEST MODE] ── Cargar módulo invitado ── BORRAR PARA REMOVER ── -->
<script src="guestController.js"></script>
<!-- [/GUEST MODE] ─────────────────────────────────────────────────── -->
```

---

## Paso 2 — Hook en `onAuthStateChanged` (bloque `else`)

Busca la línea ~7968 de `ListaMaterial.html`:

```js
} else {
    _currentUser = null;
    _fbIsAdmin   = false;
    cerrarSesion();
    ...
```

Agrega **2 líneas** al inicio del bloque `else`:

```js
} else {
    // [GUEST MODE] ── Activa Modo Invitado si no hay sesión ─────────────
    GuestController.activar();
    return; // El controlador maneja el estado de UI completo
    // [/GUEST MODE] ──────────────────────────────────────────────────────

    _currentUser = null;
    _fbIsAdmin   = false;
    ...
```

> **Nota:** El `return` evita que el bloque `else` oculte la app y muestre el login.
> Si prefieres no usar `return`, elimina las llamadas a
> `loginScreen.style.display = 'flex'` y `appMain.style.display = 'none'`
> dentro del bloque `else`, ya que `GuestController.activar()` las maneja.

---

## Paso 3 — Hook en `onAuthStateChanged` (bloque `if user`, opcional pero recomendado)

Busca la línea ~7903:

```js
if (user) {
    _currentUser = user;
    _fbIsAdmin = await verificarRolAdmin(user.uid);
    ...
```

Agrega **1 línea** al inicio:

```js
if (user) {
    // [GUEST MODE] ── Limpia datos demo al autenticar ── BORRAR PARA REMOVER ──
    GuestController.onLogin();
    // [/GUEST MODE] ────────────────────────────────────────────────────────────

    _currentUser = user;
    ...
```

---

## Paso 4 — Hook en `saveAndShow()`

Busca la línea ~3988:

```js
async function saveAndShow() { vibrate(30);
    const now = new Date();
    ...
```

Agrega **1 línea** al inicio:

```js
async function saveAndShow() { vibrate(30);
    // [GUEST MODE] ── Verifica cuota de invitado ── BORRAR PARA REMOVER ──
    if (GuestController.interceptarCotizacion()) return;
    // [/GUEST MODE] ─────────────────────────────────────────────────────

    const now = new Date();
    ...
```

---

## Paso 5 — Hook en `saveVentaCotizacion()`

Busca la línea ~6082:

```js
async function saveVentaCotizacion() {
    const includePerfiles = _pedItems.some(x => parseFloat(x.metros) > 0);
    ...
```

Agrega **1 línea** al inicio:

```js
async function saveVentaCotizacion() {
    // [GUEST MODE] ── Verifica cuota de invitado ── BORRAR PARA REMOVER ──
    if (GuestController.interceptarCotizacion()) return;
    // [/GUEST MODE] ─────────────────────────────────────────────────────

    const includePerfiles = _pedItems.some(x => parseFloat(x.metros) > 0);
    ...
```

---

## Resumen de cambios en `ListaMaterial.html`

| Ubicación | Código agregado | Líneas |
|-----------|----------------|--------|
| Antes de `</body>` | `<script src="guestController.js"></script>` | 1 |
| `onAuthStateChanged` bloque `else` | `GuestController.activar(); return;` | 2 |
| `onAuthStateChanged` bloque `if (user)` | `GuestController.onLogin();` | 1 |
| `saveAndShow()` inicio | `if (GuestController.interceptarCotizacion()) return;` | 1 |
| `saveVentaCotizacion()` inicio | `if (GuestController.interceptarCotizacion()) return;` | 1 |
| **Total** | | **6 líneas** |

---

## Cómo remover el Modo Invitado en el futuro

1. Borra `guestController.js` del repositorio.
2. En `ListaMaterial.html`, busca y elimina todos los bloques entre:
   `// [GUEST MODE]` → `// [/GUEST MODE]`
   y el `<script src="guestController.js">`.
3. Listo. Ninguna función nativa de Firebase Auth, Firestore o la lógica de negocio fue modificada.

---

## Comportamiento esperado

| Situación | Resultado |
|-----------|-----------|
| Usuario no autenticado abre la app | App carga directamente con 4 plantillas demo |
| Banner inferior | Muestra chips de usos restantes · toca para ver beneficios |
| Invitado genera cotización 1, 2, 3 | Se guarda en localStorage normal · contador baja |
| Invitado intenta cotización 4 | Paywall bloqueante sin opción de cerrar |
| Invitado toca el banner | Paywall informativo con opción de cerrar |
| Invitado toca "Crear cuenta" | Pantalla de login nativa · datos demo se limpian |
| Usuario se autentica con cuenta real | Datos demo se eliminan · Firestore carga los reales |
| Counter agotado · usuario regresa mañana | Counter persiste en localStorage (intencional) |

---

## Personalizar el límite de cotizaciones

En `guestController.js`, línea:

```js
const GUEST_MAX_OPS = 3;  // ← cambia a 5, 10, lo que quieras
```

## Resetear el contador (para pruebas)

En la consola del navegador:

```js
localStorage.removeItem('alugest_guest_ops');
location.reload();
```
