// Configuración de Firebase para el guardado online y la clasificación mundial.
// Mientras esto valga null, el juego funciona igual, pero cada jugador
// guarda su progreso solo en su propio dispositivo.
//
// Para activarlo, sigue los pasos del README.md y sustituye null por la
// configuración que te da Firebase. Estos datos no son secretos: es normal
// que estén en una web pública. La seguridad la ponen las reglas de Firestore.
window.FIREBASE_CONFIG = null;

/* Ejemplo de cómo debe quedar (con tus propios datos):
window.FIREBASE_CONFIG = {
  apiKey: "AIza...",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abc123"
};
*/
