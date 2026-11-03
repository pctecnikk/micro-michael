# Micro Michael y el Rey del Pop

Juegos de fans sobre Michael Jackson para jugar en el móvil o el ordenador, presentados por Michael, un micrófono de lentejuelas.

- **El gran quiz**: preguntas sobre su vida y sus discos, con cuenta atrás en los niveles altos.
- **Moonwalk al ritmo**: pulsa al compás de una base de baile electrónica.
- **Línea del tiempo**: ordena los momentos de su carrera.
- **Parejas brillantes**: juego de memoria con curiosidades.
- **Puzles**: nueve dibujos originales, de 3×3 a 5×5.
- **Sopa de letras**: palabras al revés, en diagonal y letras trampa.
- **Gira mundial**: juego de mesa original. Compra escenarios por ciudades de todo el mundo y gana a los rivales del ordenador.

Cada juego tiene 50 niveles que se desbloquean jugando. Hay puntos, récords y medallas por jugador, y una copia de seguridad del progreso.

> Juego de fans no oficial. No está afiliado a Michael Jackson, a sus herederos ni a sus discográficas. No incluye canciones, fotos ni logotipos oficiales: los dibujos y los sonidos son originales.

---

## 1. Publicar el juego con GitHub Pages

1. En el repositorio, ve a **Settings → Pages**.
2. En **Build and deployment**, elige **Deploy from a branch**.
3. Elige la rama **main** y la carpeta **/ (root)**, y pulsa **Save**.
4. En un par de minutos el juego estará en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.

El juego ya funciona. Cada persona guarda su progreso en su propio dispositivo.

En el móvil, abre el enlace y usa **Añadir a pantalla de inicio** (Safari en iPhone, Chrome en Android). Así queda con su propio icono, como una app.

## Avisar de una versión nueva

La web consulta `version.json` cada minuto. Cuando ese número cambia, a quien esté jugando le sale un aviso para actualizar, sin perder su progreso.

- Si Claude te prepara los cambios, `version.json` ya va actualizado.
- Si cambias `index.html` a mano en GitHub, cambia también el número de `version.json` (por ejemplo, pon la fecha y hora: `{"version":"20261103-1830"}`). Si no lo cambias, nadie recibe el aviso.

## Cómo se guarda el progreso

El progreso de cada jugador se guarda en el navegador de cada dispositivo. Para pasarlo a otro móvil u ordenador, usa la **copia de seguridad** en **Puntos y medallas**: descarga un archivo `.json` y cárgalo en el otro dispositivo.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `index.html` | El juego completo |
| `version.json` | Número de versión para avisar de actualizaciones |
| `manifest.webmanifest`, `icon-*.png`, `icon.svg` | Icono y nombre al añadirlo a la pantalla de inicio |
