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

// WhatsApp de RESPALDO (con codigo de pais, sin +). El numero principal se toma de
// catalogo.json (meta.whatsapp_numero) y se usa en TODA la web: carrito, consultas,
// formulario, botones y pies de pagina. Estos valores solo se usan si catalogo.json no se
// puede leer (y el alternativo, mientras catalogo.json no traiga meta.whatsapp_alternativo).
export const WHATSAPP_NUMERO = "59162441699";
export const WHATSAPP_ALTERNATIVO = "59177299670";


// Formulario de contacto: URL donde se guardan los datos del cliente
// (ver tools/leads-google-sheets.gs). Si queda vacio (""), el formulario
// abre WhatsApp con los datos ya escritos y no se guarda ningun registro.
export const FORM_ENDPOINT = "";

// Google Analytics 4 (gratuito). Pega aqui tu ID de medicion (empieza con "G-").
// Se crea en analytics.google.com > Administrar > Flujos de datos > Web.
// Vacio = no se mide nada. En localhost nunca se envia nada (los eventos salen en consola).
export const GA_MEASUREMENT_ID = "G-32HD6ZQ0NG";

// URL base de la API publica del sistema CI4 (sin barra final). Termina en /api/web:
// expone /token, /pedido y /contacto. Lleva "index.php" porque asi son todas las URLs del
// sistema (Config\App::$indexPage); sin el, el servidor responde "No input file specified".
// Si queda vacio (""), no se registran pedidos ni contactos en el sistema y todo
// sigue funcionando como antes (solo WhatsApp). Si el sistema no responde, tambien:
// la venta por WhatsApp nunca depende de la API. Es una URL publica, no un secreto.
// En el sistema, app/Config/CatalogoWeb.php debe tener $origin = <el dominio de esta web>.
export const API_BASE_URL = "https://cajasfuertescm.com/kidmodastore/public/index.php/api/web";

// Enlaces publicos de la tienda (UN solo lugar). Si uno queda vacio (""), su boton/enlace
// simplemente no se muestra en la web.
// MAPS: enlace EXACTO del local en Google Maps (compartir > copiar enlace), no una busqueda generica.
export const ENLACES = {
  maps: "",
  tiktok: "https://www.tiktok.com/@StepTrendStore",
  facebook: "",
  instagram: "",
};
