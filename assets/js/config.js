// Punto unico de configuracion del catalogo-web.
//
// CATALOGO_BASE_URL vacio ("") = MODO LOCAL: lee data/catalogo.json (el
// mock de este proyecto) y las imagenes salen de este mismo repo. Es el
// modo que usamos en las Fases 1-5 y el que queda activo por defecto.
//
// CATALOGO_BASE_URL con valor, ej. "https://catalogo.com"
// (SIN barra final) = MODO REMOTO: el catalogo se lee de
//   <CATALOGO_BASE_URL>/catalogo.json
// y cada imagen se arma como
//   <CATALOGO_BASE_URL>/<ruta que venga en el json>  (ej. uploads/productos/..)
//
// Antes de poner una URL real aca, correr el checklist de
// "Modo remoto (leer directo del CI4)" del README -- un catalogo.json
// sin CORS o sin HTTPS no va a cargar, y esto no tiene forma de avisar
// mas que el error silencioso en la consola del navegador.
//export const CATALOGO_BASE_URL = "";
export const CATALOGO_BASE_URL = "https://cajasfuertescm.com/kidmodastore/public/catalogo.json";
