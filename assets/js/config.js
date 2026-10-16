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
// Para pasar a modo local: ejecutar tools/descargar_catalogo.py, luego comentar la linea remota
// de abajo y descomentar esta.
//export const CATALOGO_BASE_URL = "";
export const CATALOGO_BASE_URL = "https://cajasfuertescm.com/kidmodastore/public";

// Numero de WhatsApp que usa el formulario de contacto (con codigo de pais, sin +).
export const WHATSAPP_NUMERO = "59162441699";

// Formulario de contacto: URL donde se guardan los datos del cliente
// (ver tools/leads-google-sheets.gs). Si queda vacio (""), el formulario
// abre WhatsApp con los datos ya escritos y no se guarda ningun registro.
export const FORM_ENDPOINT = "";

// URL base de la API en tu servidor CodeIgniter (sin barra final), por ejemplo:
// "https://cajasfuertescm.com/kidmodastore/public/api"
// Si queda vacio (""), no se registran pedidos ni contactos en tu BD y todo
// sigue funcionando como antes (solo WhatsApp). Es una URL publica, no un secreto.
export const API_BASE_URL = "";
