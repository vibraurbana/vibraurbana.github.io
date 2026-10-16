// Guarda los datos del formulario de contacto en una hoja de Google Sheets.
//
// 1. Crea una hoja de calculo en Google Sheets. En la fila 1 escribe:
//    Fecha | Nombre | Celular | Interes | Origen | Pagina
// 2. Menu Extensiones > Apps Script. Borra lo que haya y pega este codigo.
// 3. Implementar > Nueva implementacion > tipo "Aplicacion web".
//    Ejecutar como: Yo.  Quien tiene acceso: Cualquier persona.
// 4. Copia la URL que te da y pegala en FORM_ENDPOINT, en assets/js/config.js.
//
// Si cambias este codigo despues, vuelve a implementar (nueva version).

function doPost(e) {
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var p = e.parameter;
  hoja.appendRow([new Date(), p.nombre, "'" + p.telefono, p.interes, p.origen, p.pagina]);
  return ContentService.createTextOutput("ok");
}
