/* Original CodeIgniter views, backed only by fictitious browser-local data. */
(() => {
  'use strict';
  const D = window.DemoData, V = window.OriginalViews;
  const KEY = 'inventario-licitaciones-demo-v1', app = document.querySelector('#app');
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid = () => globalThis.crypto?.randomUUID?.() || `demo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let storageWarning = false;
  function load() {
    try {
      const stored = localStorage.getItem(KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.version !== 1 || !Array.isArray(data.licitaciones) || !Array.isArray(data.pagos) ||
          !data.licitaciones.every(x => x && typeof x.id === 'string' && typeof x.nombre_licitacion === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x.fecha_inicio) && Number.isInteger(x.meses) && x.meses > 0) ||
          !data.pagos.every(x => x && typeof x.id === 'string' && typeof x.id_licitacion === 'string' && typeof x.fecha === 'string' && Number.isFinite(x.monto))) throw new Error('Datos incompatibles');
        return data;
      }
    } catch { storageWarning = true; }
    return D.createDemo();
  }
  let state = load(), timer, query = '', currentId = null;
  function notify(message) {
    clearTimeout(timer);
    const box = document.querySelector('#feedback'); box.textContent = message; box.hidden = false;
    timer = setTimeout(() => { box.hidden = true; }, 6500);
  }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); return true; }
    catch { notify('No se pudo guardar en el navegador. Los cambios durarán hasta cerrar o recargar esta página.'); return false; }
  }
  function confirmAction(message, label = 'Eliminar') {
    const element = document.querySelector('#eliminaModal');
    const modal = bootstrap.Modal.getOrCreateInstance(element);
    document.querySelector('#confirm-message').textContent = message;
    const accept = document.querySelector('#confirm-action');
    accept.textContent = label;
    const buttons = element.querySelectorAll('button');
    buttons.forEach(button => { button.disabled = true; });
    element.addEventListener('shown.bs.modal', () => { buttons.forEach(button => { button.disabled = false; }); }, {once:true});
    let accepted = false;
    return new Promise(resolve => {
      document.querySelector('#form-elimina').onsubmit = event => { event.preventDefault(); accepted = true; modal.hide(); };
      element.addEventListener('hidden.bs.modal', () => resolve(accepted), {once:true});
      modal.show();
    });
  }
  function download(rows, name) {
    const url = URL.createObjectURL(new Blob([D.csv(rows)], {type:'text/csv;charset=utf-8;'}));
    const link = document.createElement('a'); link.href = url; link.download = name;
    document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const tenderFields = ['nombre_licitacion','tipo','renovable','fecha_inicio','meses','monto_total','valor_cuota_inicial','valor_cuota_mensual','orden_compra','nombre_empresa','rut_empresa','usuario_beneficiado','observacion'];
  const tenderHeaders = ['Nombre','Tipo','Renovable','Fecha De Inicio','Numero De Meses','Monto Total','Valor Cuota Inicial','Valor Cuota Mensual','Orden De Compra','Nombre De La Empresa','Rut De La Empresa','Usuario Beneficiado','Observacion'];
  const visibleTenders = () => state.licitaciones.filter(x => normalize(tenderFields.map(k => x[k]).join(' ')).includes(normalize(query)));
  const visiblePayments = id => state.pagos.filter(x => x.id_licitacion === id && normalize([x.fecha,x.factura,x.monto].join(' ')).includes(normalize(query)));
  function labelResponsiveCells() {
    const table = app.querySelector('table');
    table.setAttribute('role', 'table');
    table.removeAttribute('aria-describedby');
    table.setAttribute('aria-label', currentId ? 'Pagos' : 'Licitaciones');
    const headings = Array.from(table.querySelectorAll('thead th'));
    table.querySelectorAll('thead, tbody').forEach(group => group.setAttribute('role', 'rowgroup'));
    table.querySelectorAll('tr').forEach(row => row.setAttribute('role', 'row'));
    headings.forEach((heading, index) => {
      heading.id = `${table.id}-column-${index}`;
      heading.setAttribute('role', 'columnheader');
      heading.setAttribute('scope', 'col');
    });
    for (const row of table.tBodies[0].rows) {
      const cells = Array.from(row.cells).filter(cell => !cell.hidden);
      if (cells.length === 1) { cells[0].classList.add('empty-cell'); continue; }
      cells.forEach((cell, index) => {
        cell.setAttribute('role', 'cell');
        cell.setAttribute('headers', headings[index].id);
        const value = document.createElement('span'); value.className = 'cell-value';
        value.append(...cell.childNodes);
        const label = document.createElement('span'); label.className = 'cell-label';
        label.setAttribute('aria-hidden', 'true'); label.textContent = headings[index].textContent.trim();
        cell.append(label, value);
        if (label.textContent === 'Acciones') cell.classList.add('actions-cell');
      });
    }
  }
  function bindSearch(render) {
    const input = document.querySelector('#search'); input.value = query;
    input.form.onsubmit = event => { event.preventDefault(); query = input.value; render(); };
    input.addEventListener('input', () => { query = input.value; render(); });
  }
  function renderTenders() {
    currentId = null; app.innerHTML = V.tenders;
    const alerts = state.licitaciones.filter(x => D.status(x) !== 'active');
    document.querySelector('#numeroMensajes').textContent = alerts.length;
    const bell = document.querySelector('#notificaciones-icono');
    if (alerts.length) bell.classList.add('bx-tada');
    function showAlerts() {
      document.querySelector('#contract-alerts')?.remove();
      const holder = document.createElement('div'); holder.id = 'contract-alerts';
      holder.innerHTML = alerts.map(x => `<div class="alert alert-${D.status(x) === 'expired' ? 'danger' : 'warning'} alert-dismissible fade show" role="alert">La licitación de nombre: <strong>"${esc(x.nombre_licitacion)}"</strong> del tipo ${esc(x.tipo)}, <strong>${D.status(x) === 'expired' ? 'ALCANZÓ su período de término' : 'está por alcanzar su período de término'}</strong> y su observación es: ${esc(x.observacion)}.<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button></div>`).join('') || '<div class="alert alert-info" role="alert">No hay avisos de vencimiento.</div>';
      document.querySelector('#tablaindex').before(holder);
      bell.classList.remove('bx-tada'); document.querySelector('#numeroMensajes').textContent = '';
    }
    bell.onclick = showAlerts;
    bell.onkeydown = event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); showAlerts(); } };
    bindSearch(renderTenderRows);
    document.querySelector('#formExcel').onsubmit = event => { event.preventDefault(); download([tenderHeaders,...visibleTenders().map(x => tenderFields.map(k => x[k]))], 'licitaciones-demo.csv'); };
    renderTenderRows();
  }
  function renderTenderRows() {
    const images = {active:'Verde',warning:'Amarillo',expired:'Rojo'};
    const labels = {active:'Vigente',warning:'Por vencer',expired:'Vencida'};
    document.querySelector('#rows').innerHTML = visibleTenders().map(x => {
      const index = state.licitaciones.indexOf(x) + 1, status = D.status(x), id = encodeURIComponent(x.id);
      return `<tr class="centrado" id="fila-${index}"><td>${index}</td>${tenderFields.map(k => `<td>${esc(x[k])}</td>`).join('')}<td hidden>${D.dates(x).end}</td><td hidden>${D.dates(x).notice}</td><td class="container-custom"><a href="#/licitaciones/${id}/editar" class="btn btn-warning btn-sm" aria-label="Editar ${esc(x.nombre_licitacion)}">Editar</a> <a href="#/pagos/${id}" class="btn btn-primary btn-sm" aria-label="Pagos de ${esc(x.nombre_licitacion)}">Pagos</a> <button type="button" class="btn btn-danger btn-sm" data-delete-tender="${esc(x.id)}" aria-label="Eliminar ${esc(x.nombre_licitacion)}">Eliminar</button></td><td class="centrado"><figure class="figure"><img src="assets/imagenes/semaforo${images[status]}.png" class="figure-img rounded" width="15" height="15" alt="${labels[status]}" title="${labels[status]}"></figure></td></tr>`;
    }).join('') || '<tr><td colspan="16" class="centrado">No hay licitaciones que mostrar.</td></tr>';
    labelResponsiveCells();
  }
  function configureForm(form, item) {
    for (const element of form.elements) {
      if (!element.name) continue;
      const key = element.name === 'nombre' ? 'nombre_licitacion' : element.name, value = item[key];
      if (element.type === 'radio') element.checked = value != null && normalize(element.value) === normalize(value);
      else if (value != null) element.value = value;
      if (element.type === 'number') { element.min = key === 'meses' || key === 'monto' ? '1' : '0'; element.max = key === 'meses' ? '600' : '999999999999'; element.step = '1'; }
      if (element.type === 'date') { element.min = '1900-01-01'; element.max = '2100-12-31'; }
    }
    const error = document.createElement('div'); error.id = 'form-error'; error.className = 'alert alert-danger'; error.setAttribute('role','alert'); error.hidden = true; form.before(error);
  }
  function formValue(form) {
    const value = Object.fromEntries(new FormData(form));
    for (const key of Object.keys(value)) value[key] = value[key].trim();
    const invalid = Array.from(form.elements).find(x => x.required && x.type !== 'radio' && !x.value.trim());
    if (invalid) { const error = document.querySelector('#form-error'); error.textContent = 'Completa los campos obligatorios con texto válido.'; error.hidden = false; invalid.focus(); return null; }
    return value;
  }
  function renderTenderForm(id) {
    const item = id ? state.licitaciones.find(x => x.id === id) : {};
    if (!item) return missing();
    app.innerHTML = id ? V.editTender : V.newTender;
    const form = document.querySelector('#tender-form'); configureForm(form, item);
    form.onsubmit = event => {
      event.preventDefault(); const value = formValue(form); if (!value) return;
      value.nombre_licitacion = value.nombre; delete value.nombre;
      for (const key of ['meses','monto_total','valor_cuota_inicial','valor_cuota_mensual']) value[key] = Number(value[key]);
      value.id = id || uid();
      if (id) state.licitaciones = state.licitaciones.map(x => x.id === id ? value : x); else state.licitaciones.push(value);
      const saved = persist(); location.hash = '/licitaciones'; if (saved) notify('Licitación guardada en este navegador.');
    };
  }
  function bindPaymentLinks(id) {
    for (const link of app.querySelectorAll('[data-payment-link]')) link.href = `#/pagos/${encodeURIComponent(id)}${link.textContent.trim() === 'Agregar' ? '/nuevo' : ''}`;
  }
  function renderPayments(id) {
    const item = state.licitaciones.find(x => x.id === id); if (!item) return missing();
    currentId = id; app.innerHTML = V.payments;
    document.querySelector('#payment-title').textContent = item.nombre_licitacion;
    bindPaymentLinks(id); bindSearch(() => renderPaymentRows(id));
    document.querySelector('#formExcel').onsubmit = event => {
      event.preventDefault(); const all = state.pagos.filter(x => x.id_licitacion === id);
      download([['Numero de cuota','Fecha','Monto','Factura'],...visiblePayments(id).map(x => [all.indexOf(x)+1,x.fecha,x.monto,x.factura])], `pagos-${id}.csv`);
    };
    renderPaymentRows(id);
  }
  function renderPaymentRows(id) {
    const all = state.pagos.filter(x => x.id_licitacion === id);
    document.querySelector('#rows').innerHTML = visiblePayments(id).map(x => `<tr><td>${all.indexOf(x)+1}</td><td>${esc(x.fecha)}</td><td>${esc(x.monto)}</td><td>${esc(x.factura)}</td><td><a class="btn btn-warning btn-sm" href="#/pagos/${encodeURIComponent(id)}/${encodeURIComponent(x.id)}/editar" aria-label="Editar pago ${esc(x.factura)}">Editar</a> <button type="button" class="btn btn-danger btn-sm" data-delete-payment="${esc(x.id)}" aria-label="Eliminar pago ${esc(x.factura)}">Eliminar</button></td></tr>`).join('') || '<tr><td colspan="5">No hay pagos que mostrar.</td></tr>';
    labelResponsiveCells();
  }
  function renderPaymentForm(id, paymentId) {
    const item = state.licitaciones.find(x => x.id === id), payment = paymentId ? state.pagos.find(x => x.id === paymentId && x.id_licitacion === id) : {};
    if (!item || !payment) return missing();
    app.innerHTML = paymentId ? V.editPayment : V.newPayment;
    const title = document.querySelector('#payment-title'); if (title) title.textContent = item.nombre_licitacion;
    bindPaymentLinks(id);
    const form = document.querySelector('#payment-form'); configureForm(form, payment);
    form.onsubmit = event => {
      event.preventDefault(); const value = formValue(form); if (!value) return;
      value.monto = Number(value.monto); value.id = paymentId || uid(); value.id_licitacion = id;
      if (paymentId) state.pagos = state.pagos.map(x => x.id === paymentId ? value : x); else state.pagos.push(value);
      const saved = persist(); location.hash = `/pagos/${encodeURIComponent(id)}`; if (saved) notify('Pago guardado en este navegador.');
    };
  }
  function missing() { app.innerHTML = '<h3 class="my-3">Registro no encontrado</h3><a class="btn btn-secondary" href="#/licitaciones">Regresar</a>'; }
  function route() {
    query = ''; let parts;
    try { parts = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent); } catch { return missing(); }
    if (!parts[0] || (parts[0] === 'licitaciones' && parts.length === 1)) renderTenders();
    else if (parts[0] === 'licitaciones' && parts[1] === 'nueva' && parts.length === 2) renderTenderForm();
    else if (parts[0] === 'licitaciones' && parts[2] === 'editar' && parts.length === 3) renderTenderForm(parts[1]);
    else if (parts[0] === 'pagos' && parts.length === 2) renderPayments(parts[1]);
    else if (parts[0] === 'pagos' && parts[2] === 'nuevo' && parts.length === 3) renderPaymentForm(parts[1]);
    else if (parts[0] === 'pagos' && parts[3] === 'editar' && parts.length === 4) renderPaymentForm(parts[1], parts[2]);
    else missing();
    app.focus({preventScroll:true}); window.scrollTo(0,0);
  }
  app.addEventListener('click', async event => {
    const tender = event.target.closest('[data-delete-tender]');
    if (tender && await confirmAction('¿Desea eliminar este registro y sus pagos asociados?')) {
      const id = tender.dataset.deleteTender;
      state.licitaciones = state.licitaciones.filter(x => x.id !== id); state.pagos = state.pagos.filter(x => x.id_licitacion !== id);
      const saved = persist(); renderTenders(); if (saved) notify('Licitación y pagos eliminados.');
    }
    const payment = event.target.closest('[data-delete-payment]');
    if (payment && await confirmAction('¿Desea eliminar este registro?')) {
      state.pagos = state.pagos.filter(x => x.id !== payment.dataset.deletePayment);
      const saved = persist(); renderPayments(currentId); if (saved) notify('Pago eliminado.');
    }
  });
  document.querySelector('#reset-demo').onclick = async () => {
    if (await confirmAction('Se reemplazarán tus cambios locales por nuevos datos ficticios. ¿Continuar?', 'Restablecer')) {
      state = D.createDemo(); const saved = persist();
      if (location.hash === '#/licitaciones') route(); else location.hash = '/licitaciones';
      if (saved) notify('Datos de demostración restablecidos.');
    }
  };
  document.querySelector('#year').textContent = new Date().getFullYear();
  window.addEventListener('hashchange', route); route();
  if (storageWarning) notify('No fue posible recuperar los datos locales. Se cargó una nueva demostración.'); else persist();
})();
