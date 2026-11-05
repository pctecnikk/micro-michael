# Micro Michael y el Rey del Pop

Juegos de fans sobre Michael Jackson para jugar en el móvil o el ordenador, presentados por Michael, un micrófono de lentejuelas.

- **El gran quiz**: preguntas sobre su vida y sus discos, con cuenta atrás en los niveles altos.
- **Moonwalk al ritmo**: pulsa al compás de una base de baile electrónica.
- **Línea del tiempo**: ordena los momentos de su carrera.
- **Parejas brillantes**: juego de memoria con curiosidades.
- **Puzles**: nueve dibujos originales, de 3×3 a 5×5.
- **Sopa de letras**: palabras al revés, en diagonal y letras trampa.
- **Ruleta del Pop**: gira la ruleta, adivina letras y resuelve paneles con títulos y curiosidades.
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

## 2. Activar los puntos online y la clasificación mundial (Supabase, gratis)

Cada jugador puede crear un **código secreto** (por ejemplo `MJ-7K3Q-9XPA`). Con él sus puntos se guardan online, los recupera en cualquier móvil u ordenador y sale en la **clasificación mundial**. No hace falta cuenta de Google ni correo.

1. Entra en <https://supabase.com>, pulsa **Start your project** y entra con tu cuenta de **GitHub**.
2. Pulsa **New project**. Ponle de nombre `micro-michael`, inventa una contraseña para la base de datos (no la necesitarás en el juego), elige una región de Europa y pulsa **Create new project**. Tarda un par de minutos.
3. En el menú de la izquierda, abre **SQL Editor**, pulsa **New query**, pega el contenido de `supabase.sql` de este repositorio y pulsa **Run**. Debe salir *Success*.
4. Ve a **Project Settings → API Keys** (o **Data API**) y copia la **URL del proyecto** y la **clave pública** (*publishable key* o *anon key*). La clave secreta no se usa nunca.
5. En GitHub, edita `supabase-config.js` y sustituye `null` por esos dos datos:

```js
window.SUPABASE_CONFIG = {
  url: "https://abcdefghijklmno.supabase.co",
  key: "sb_publishable_..."
};
```

6. Guarda con **Commit changes**. En un par de minutos, al elegir jugador aparecerá **🌍 Puntos online**, y en **Puntos y medallas** la **clasificación mundial**.

La URL y la clave pública no son secretas. La tabla está cerrada: solo se puede usar a través de las funciones de `supabase.sql`, que guardan el código cifrado y en la clasificación solo muestran el nombre de jugador y los puntos.

## Ver quién está jugando ahora (solo tú)

Mientras alguien tiene el juego abierto, avisa cada 30 segundos a tu base de datos de en qué juego está. Los jugadores no ven nada de esto.

Para verlo: Supabase → tu proyecto → **Table Editor** → **jugando_ahora**. Salen las personas que han dado señales en los últimos 2 minutos, con su nombre de jugador (si ha elegido uno), el juego y desde cuándo están conectadas. Los avisos de más de un día se borran solos.

## Versión

La app muestra la versión que está funcionando: arriba, junto a «Juegos para fans» (por ejemplo `v1.0.0`), y abajo del todo con la fecha y hora de publicación. El número está en `RELEASE` y sube con cada actualización: el último número para cambios pequeños, el del medio para novedades grandes.

## Avisar de una versión nueva

La web consulta `version.json` cada minuto. Cuando ese número cambia, a quien esté jugando le sale un aviso para actualizar, sin perder su progreso.

- Si Claude te prepara los cambios, `version.json` ya va actualizado.
- Si cambias `index.html` a mano en GitHub, cambia también el número de `version.json` (por ejemplo, pon la fecha y hora: `{"version":"20261103-1830"}`). Si no lo cambias, nadie recibe el aviso.

## Cómo se guarda el progreso

| Situación | Dónde se guarda |
|---|---|
| Jugador sin código | En el navegador de ese dispositivo |
| Jugador con código | En Supabase. Se recupera en cualquier dispositivo con **¿Ya tienes un código?** |
| Copia de seguridad | Un archivo `.json` por jugador (`michael-progreso-NOMBRE-AAAA-MM-DD.json`), con el botón **💾 Guardar copia de seguridad** de cada jugador en **Puntos y medallas**. Se recupera con **📂 Cargar una copia de seguridad**, en esa misma pantalla o en «¿Quién va a jugar?». También se pueden cargar las copias antiguas con todos los jugadores |

En la clasificación mundial solo se ven el nombre de jugador y los puntos. Si juegan niños, mejor que usen un apodo y no su nombre real.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `index.html` | El juego completo |
| `supa.js` | Puntos online con código de jugador y clasificación mundial |
| `supabase-config.js` | URL y clave pública de Supabase (empieza en `null`) |
| `supabase.sql` | Script para preparar la base de datos en Supabase |
| `RELEASE` | Número de la versión publicada |
| `version.json` | Número de versión para avisar de actualizaciones |
| `manifest.webmanifest`, `icon-*.png`, `icon.svg` | Icono y nombre al añadirlo a la pantalla de inicio |
