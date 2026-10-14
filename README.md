# Inventario de licitaciones — demostración frontend

Adaptación del frontend del programa **c4_inventario**, originalmente desarrollado con PHP y CodeIgniter. Conserva los campos y flujos de licitaciones y pagos, con una interfaz adaptable a celulares y una tabla horizontal para consultar todos los campos.

**No necesita base de datos, PHP, Composer ni instalar paquetes. Toda la información inicial es ficticia.** Los proveedores, órdenes y facturas son ejemplos; los identificadores `DEMO-*` no son RUT reales.

## Abrir el programa

Descarga el repositorio como ZIP, descomprímelo y abre **index.html** con Chrome, Edge o Firefox. Funciona sin conexión a Internet y sin dependencias externas.

Opcionalmente, si tienes Node.js instalado, ejecuta en esta carpeta:

```sh
npm start
```

Luego abre http://127.0.0.1:4173. Este comando solo sirve archivos estáticos para la vista previa local.

## Qué puedes probar

- Ocho licitaciones ficticias con montos aleatorios y pagos asociados.
- Agregar, editar y eliminar licitaciones y pagos; eliminar una licitación también elimina sus pagos.
- Buscar por nombre, empresa, orden, factura o fecha y filtrar contratos por estado.
- Ver contratos vigentes, por vencer y vencidos. Los avisos aparecen 4 meses antes del término para contratos normales y 2 meses para compra ágil, siguiendo la lógica del programa original.
- Consultar montos del contrato, total pagado y saldo.
- Exportar los resultados filtrados a CSV compatible con Excel (UTF-8 y separador punto y coma).
- Restablecer los ejemplos con nuevos montos aleatorios y fechas relativas al día actual.

Los cambios se guardan en `localStorage`, únicamente en el navegador y origen utilizados. No se sincronizan entre dispositivos ni pestañas. Si el navegador bloquea el almacenamiento, se muestra un aviso y la sesión sigue funcionando en memoria. Borrar los datos del navegador elimina los cambios. Al abrir con `file://`, el comportamiento del almacenamiento depende del navegador; usa la vista previa local para un origen estable.

## Alcance de esta adaptación

Es una demostración para recuperar y explorar el funcionamiento del frontend. No envía correos, no tiene autenticación, no consulta servicios reales y no incluye el backend, credenciales, archivos `.env` ni una base de datos. La exportación original de Excel se sustituye por CSV; las notificaciones son avisos dentro de la página. El aspecto conserva la paleta verde/gris y los campos originales, con mejoras de legibilidad. Las fechas que caen fuera del mes se ajustan a su último día.

## GitHub Pages (opcional)

En **Settings → Pages**, elige **Deploy from a branch**, rama **main** y carpeta **/(root)**. El sitio es completamente estático y usa rutas con `#`, por lo que puede servirse desde la subcarpeta del repositorio sin configuración adicional. Esta configuración de hosting es independiente de subir el código.

## Verificación

Con Node.js 18 o posterior:

```sh
npm test
```

Las pruebas cubren generación de ejemplos, integridad de pagos, fechas de fin de mes, estados y exportación CSV segura. Para verificar la interfaz: crea una licitación, registra y edita un pago, recarga para comprobar persistencia, prueba búsqueda y avisos, exporta CSV y restablece los ejemplos.
