# Micro Michael y el Rey del Pop

Juegos de fans sobre Michael Jackson para jugar en el móvil o el ordenador, presentados por Michael, un micrófono de lentejuelas.

- **El gran quiz**: preguntas sobre su vida y sus discos, con cuenta atrás en los niveles altos.
- **Moonwalk al ritmo**: pulsa al compás de una base de baile electrónica.
- **Línea del tiempo**: ordena los momentos de su carrera.
- **Parejas brillantes**: juego de memoria con curiosidades.
- **Puzles**: nueve dibujos originales, de 3×3 a 5×5.
- **Sopa de letras**: cinco niveles, con palabras al revés y letras trampa.

Cada juego tiene 5 niveles que se desbloquean jugando. Hay puntos, récords y medallas por jugador, una copia de seguridad del progreso y, si se activa Firebase, guardado online con cuenta de Google y una clasificación mundial.

> Juego de fans no oficial. No está afiliado a Michael Jackson, a sus herederos ni a sus discográficas. No incluye canciones, fotos ni logotipos oficiales: los dibujos y los sonidos son originales.

---

## 1. Publicar el juego con GitHub Pages

1. En el repositorio, ve a **Settings → Pages**.
2. En **Build and deployment**, elige **Deploy from a branch**.
3. Elige la rama **main** y la carpeta **/ (root)**, y pulsa **Save**.
4. En un par de minutos el juego estará en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.

Sin hacer nada más, el juego ya funciona. Cada persona guarda su progreso en su propio dispositivo.

En el móvil, abre el enlace y usa **Añadir a pantalla de inicio** (Safari en iPhone, Chrome en Android). Así queda con su propio icono, como una app.

## 2. Activar el guardado online y la clasificación mundial (Firebase, gratis)

### 2.1 Crear el proyecto

1. Entra en <https://console.firebase.google.com> con tu cuenta de Google.
2. Pulsa **Crear un proyecto**, ponle un nombre (por ejemplo `micro-michael`) y sigue los pasos. Google Analytics no hace falta.

### 2.2 Activar el inicio de sesión con Google

1. En el menú de la izquierda: **Compilación → Authentication → Comenzar**.
2. En **Método de inicio de sesión**, elige **Google**, actívalo, pon tu correo de asistencia y guarda.
3. En **Configuración → Dominios autorizados**, pulsa **Agregar dominio** y escribe `TU-USUARIO.github.io`.

### 2.3 Crear la base de datos

1. **Compilación → Firestore Database → Crear base de datos**.
2. Elige una ubicación en Europa (por ejemplo `europe-west1`) y el **modo de producción**.
3. Abre la pestaña **Reglas**, borra lo que haya, pega el contenido del archivo `firestore.rules` de este repositorio y pulsa **Publicar**.

### 2.4 Conectar el juego

1. En Firebase, pulsa el engranaje ⚙️ → **Configuración del proyecto**.
2. Abajo, en **Tus apps**, pulsa el icono web **`</>`**, ponle un nombre y regístrala. Firebase Hosting no hace falta.
3. Firebase te enseña un bloque `firebaseConfig`. Copia sus datos.
4. En GitHub, abre `firebase-config.js`, pulsa el lápiz ✏️ para editarlo y sustituye `null` por esos datos, así:

```js
window.FIREBASE_CONFIG = {
  apiKey: "AIza...",
  authDomain: "micro-michael.firebaseapp.com",
  projectId: "micro-michael",
  storageBucket: "micro-michael.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abc123"
};
```

5. Guarda el cambio con **Commit changes**. En un par de minutos, al entrar en cualquier juego aparecerá el botón **Entrar con Google**, y en **Puntos y medallas** la **Clasificación mundial**.

Los datos de `firebase-config.js` no son secretos: es normal que estén en una web pública. Lo que protege la información son las reglas de Firestore del paso 2.3.

## Cómo se guarda el progreso

| Situación | Dónde se guarda |
|---|---|
| Juega sin entrar con Google | En el navegador de ese dispositivo |
| Entra con Google | En Firebase. Se recupera en cualquier móvil al volver a entrar |
| Copia de seguridad | Un archivo `.json` que se descarga desde **Puntos y medallas** |

En Firebase solo se guarda un **apodo** (no el nombre real de la cuenta de Google), los puntos, los niveles y las medallas. En la clasificación mundial solo se ven el apodo y los puntos.

## Privacidad y menores

Si el juego lo van a usar niños, conviene que el apodo no sea su nombre real. En España, para que un menor de 14 años use una cuenta de Google hace falta el consentimiento de sus padres; las cuentas de Google para niños se gestionan con Family Link. Si publicas el juego para el público general, añade una página sencilla de privacidad explicando qué se guarda (apodo, puntos y medallas) y cómo pedir que se borre.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `index.html` | El juego completo |
| `cloud.js` | Guardado online y clasificación mundial |
| `firebase-config.js` | Tu configuración de Firebase (empieza en `null`) |
| `firestore.rules` | Reglas de seguridad para pegar en Firebase |
| `manifest.webmanifest`, `icon-*.png`, `icon.svg` | Icono y nombre al añadirlo a la pantalla de inicio |
