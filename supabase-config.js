// Configuración de Supabase para los puntos online y la clasificación mundial.
// Mientras esto valga null, el juego funciona igual, pero cada jugador
// guarda su progreso solo en su propio dispositivo.
//
// Pon aquí la URL del proyecto y la clave pública (anon o publishable).
// No son secretas: es normal que estén en una web pública. La seguridad
// la ponen las funciones de supabase.sql, que no dejan tocar la tabla.
window.SUPABASE_CONFIG = null;

/* Ejemplo:
window.SUPABASE_CONFIG = {
  url: "https://abcdefghijklmno.supabase.co",
  key: "sb_publishable_..."
};
*/
