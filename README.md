# Inventario de licitaciones — demostración frontend

Versión sin base de datos del programa **c4_inventario**, originalmente desarrollado con PHP y CodeIgniter. Se recuperó la apariencia de las seis vistas entregadas: listado, creación y edición de licitaciones y pagos.

Se reutilizan el CSS original sin modificaciones, las mismas versiones de Bootstrap y Boxicons, el fondo, el logo, las imágenes de semáforo, los botones y los formularios. El HTML de las vistas está en `assets/original-views.js`; se sustituyeron las expresiones PHP y rutas de servidor por datos y navegación del navegador. Se eliminaron las tarjetas de resumen y la cabecera del rediseño anterior.

La adaptación responsiva está en `assets/demo.css`: las licitaciones y los pagos mantienen siempre el formato de tabla horizontal, con una fila por registro y todos los encabezados visibles. Las columnas tienen anchos proporcionales; el tamaño del texto, los espacios y los botones se compactan y el contenido largo se ajusta dentro de cada celda. No se convierten las filas en fichas. Los títulos, búsquedas y formularios también se acomodan al ancho disponible.

**No necesita base de datos, PHP, Composer ni instalar paquetes. Toda la información inicial es ficticia.** Los proveedores, órdenes y facturas son ejemplos; los identificadores `DEMO-*` no son RUT reales.

## Abrir el programa

Descarga el repositorio como ZIP, descomprímelo y abre **index.html** con Chrome, Edge o Firefox. Los estilos, iconos y las imágenes están incluidos localmente para que funcione sin conexión a Internet.

Opcionalmente, si tienes Node.js instalado, ejecuta en esta carpeta:

```sh
npm start
```

Luego abre http://127.0.0.1:4173. Este comando solo sirve archivos estáticos para la vista previa local.

## Qué puedes probar

- Ocho licitaciones ficticias con montos aleatorios y pagos asociados.
- Agregar, editar y eliminar licitaciones y pagos; eliminar una licitación también elimina sus pagos.
- Buscar por nombre, empresa, orden, factura o fecha.
- Ver contratos vigentes, por vencer y vencidos. Los avisos aparecen 4 meses antes del término para contratos normales y 2 meses para compra ágil, siguiendo la lógica del programa original.
- Consultar los montos del contrato y sus pagos en las tablas originales.
- Exportar los resultados filtrados a CSV compatible con Excel (UTF-8 y separador punto y coma).
- Restablecer los ejemplos con nuevos montos aleatorios y fechas relativas al día actual.

Los cambios se guardan en `localStorage`, únicamente en el navegador y origen utilizados. No se sincronizan entre dispositivos ni pestañas. Si el navegador bloquea el almacenamiento, se muestra un aviso y la sesión sigue funcionando en memoria. Borrar los datos del navegador elimina los cambios. Al abrir con `file://`, el comportamiento del almacenamiento depende del navegador; usa la vista previa local para un origen estable.

## Alcance de esta adaptación

Es una demostración para recuperar y explorar el funcionamiento del frontend. No envía correos, no consulta servicios reales y no incluye el backend, credenciales, archivos `.env` ni una base de datos. La carpeta original entregada no contiene login ni rutas de autenticación; esta versión también entra directamente a las licitaciones.

La exportación original de Excel se sustituye por CSV, conservando su icono; las notificaciones usan la campana y los avisos Bootstrap originales. Se añadió únicamente una nota discreta de demostración y el botón para restablecer datos al pie, además de mensajes al guardar. Las fechas que caen fuera del mes se ajustan a su último día. Los cambios de la demo anterior se conservan al usar el mismo navegador y dirección.

Los archivos de Bootstrap y Boxicons se distribuyen en `assets/vendor` con sus licencias. El logo del Gobierno Regional de Coquimbo, el icono de exportación de Icons8 y los semáforos reproducen los recursos usados por el proyecto entregado.

## GitHub Pages (opcional)

En **Settings → Pages**, elige **Deploy from a branch**, rama **main** y carpeta **/(root)**. El sitio es completamente estático y usa rutas con `#`, por lo que puede servirse desde la subcarpeta del repositorio sin configuración adicional. Esta configuración de hosting es independiente de subir el código.

## Verificación

Con Node.js 18 o posterior:

```sh
npm test
```

Las pruebas cubren generación de ejemplos, integridad de pagos, fechas de fin de mes, estados y exportación CSV segura. Para verificar la interfaz: crea una licitación, registra y edita un pago, recarga para comprobar persistencia, prueba búsqueda y avisos, exporta CSV y restablece los ejemplos.
