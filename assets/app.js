/* Frontend autónomo adaptado de las vistas de c4_inventario. */
(() => {
  'use strict';
  const D=window.DemoData, KEY='inventario-licitaciones-demo-v1';
  const app=document.querySelector('#app');
  const money=value=>new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(value);
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const date=value=>value?value.split('-').reverse().join('/'):'—';
  const uid=()=>globalThis.crypto?.randomUUID?.() || `demo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const labels={active:'Vigente',warning:'Por vencer',expired:'Vencida'};
  let storageWarning=false;
  function load() {
    try {
      const stored=localStorage.getItem(KEY);
      if(stored) {
        const parsed=JSON.parse(stored);
        if(parsed.version!==1||!Array.isArray(parsed.licitaciones)||!Array.isArray(parsed.pagos)||
          !parsed.licitaciones.every(x=>x&&typeof x.id==='string'&&typeof x.nombre_licitacion==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x.fecha_inicio)&&Number.isInteger(x.meses)&&x.meses>0)||
          !parsed.pagos.every(x=>x&&typeof x.id==='string'&&typeof x.id_licitacion==='string'&&typeof x.fecha==='string'&&Number.isFinite(x.monto))) throw new Error('Datos incompatibles');
        return parsed;
      }
    } catch { storageWarning=true; }
    return D.createDemo();
  }
  let state=load(), timer, query='', filter='all', currentId=null;
  function notify(message) {clearTimeout(timer);document.querySelector('#feedback').textContent=message;timer=setTimeout(()=>document.querySelector('#feedback').textContent='',6500);}
  function persist() {
    try{localStorage.setItem(KEY,JSON.stringify(state));return true;}
    catch{notify('No se pudo guardar en el navegador. Los cambios durarán hasta cerrar o recargar esta página.');return false;}
  }
  async function confirmAction(message) {
    const dialog=document.querySelector('#confirm-dialog');
    document.querySelector('#confirm-message').textContent=message;
    dialog.returnValue='cancel';dialog.showModal();
    return new Promise(resolve=>dialog.addEventListener('close',()=>resolve(dialog.returnValue==='accept'),{once:true}));
  }
  const badge=item=>{const s=D.status(item);return `<span class="badge ${s}">${labels[s]}</span>`;};
  const stat=(label,value,cls='')=>`<div class="stat"><span class="stat-label">${label}</span><strong class="stat-value ${cls}">${value}</strong></div>`;
  function heading(title,subtitle,actions='') {return `<div class="page-heading"><div><div class="eyebrow">Gestión de contratos</div><h1>${esc(title)}</h1><div class="subtitle">${esc(subtitle)}</div></div><div class="actions">${actions}</div></div>`;}
  function download(rows,name) {
    const url=URL.createObjectURL(new Blob([D.csv(rows)],{type:'text/csv;charset=utf-8;'}));
    const link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  const normalize=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function visibleTenders() {return state.licitaciones.filter(x=>(filter==='all'||(filter==='alerts'?D.status(x)!=='active':D.status(x)===filter))&&normalize(Object.values(x).join(' ')).includes(normalize(query)));}
  function renderTenders() {
    currentId=null;
    const counts=state.licitaciones.reduce((acc,x)=>(acc[D.status(x)]++,acc),{active:0,warning:0,expired:0});
    app.innerHTML=heading('Licitaciones','Consulta contratos, revisa sus vencimientos y administra los pagos.',`<button class="button secondary" id="alerts">Avisos (${counts.warning+counts.expired})</button><a class="button" href="#/licitaciones/nueva">+ Agregar licitación</a>`)+
      `<div class="stats">${stat('Total de licitaciones',state.licitaciones.length)}${stat('Vigentes',counts.active)}${stat('Por vencer',counts.warning)}${stat('Vencidas',counts.expired)}</div>
      <section class="panel" aria-label="Listado de licitaciones"><div class="toolbar"><div class="filters"><input id="search" type="search" placeholder="Buscar nombre, empresa, orden…" aria-label="Buscar licitaciones" value="${esc(query)}"><select id="status-filter" aria-label="Filtrar por estado"><option value="all">Todos los estados</option><option value="active">Vigentes</option><option value="warning">Por vencer</option><option value="expired">Vencidas</option><option value="alerts">Todos los avisos</option></select></div><button id="export" class="button secondary">↓ Exportar CSV / Excel</button></div><div class="table-scroll" role="region" aria-label="Tabla de licitaciones, desplazable horizontalmente" tabindex="0"><table><thead><tr>${['N°','Nombre','Estado','Tipo','Renovable','Fecha de inicio','Meses','Fecha de término','Monto total','Cuota inicial','Cuota mensual','Orden de compra','Empresa','RUT empresa','Usuario beneficiado','Observación','Acciones'].map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody id="rows"></tbody></table></div><div class="table-footer" id="count" aria-live="polite"></div></section><p class="muted">Avisos: 4 meses antes del término para licitaciones normales y 2 meses para compra ágil. Desliza la tabla para ver todos los campos.</p>`;
    document.querySelector('#status-filter').value=filter;
    document.querySelector('#search').addEventListener('input',event=>{query=event.target.value;renderTenderRows();});
    document.querySelector('#status-filter').addEventListener('change',event=>{filter=event.target.value;renderTenderRows();});
    document.querySelector('#alerts').onclick=()=>{filter='alerts';document.querySelector('#status-filter').value=filter;renderTenderRows();};
    document.querySelector('#export').onclick=()=>download([['Nombre','Estado','Tipo','Renovable','Inicio','Meses','Término','Monto total','Cuota inicial','Cuota mensual','Orden de compra','Empresa','RUT empresa','Usuario beneficiado','Observación'],...visibleTenders().map(x=>[x.nombre_licitacion,labels[D.status(x)],x.tipo,x.renovable,x.fecha_inicio,x.meses,D.dates(x).end,x.monto_total,x.valor_cuota_inicial,x.valor_cuota_mensual,x.orden_compra,x.nombre_empresa,x.rut_empresa,x.usuario_beneficiado,x.observacion])],'licitaciones-demo.csv');
    renderTenderRows();
  }
  function renderTenderRows() {
    const rows=visibleTenders();
    document.querySelector('#rows').innerHTML=rows.map((x,i)=>`<tr><td>${i+1}</td><td class="name-cell">${esc(x.nombre_licitacion)}<small>${esc(x.orden_compra)}</small></td><td>${badge(x)}</td><td class="nowrap">${esc(x.tipo)}</td><td>${esc(x.renovable)}</td><td class="nowrap">${date(x.fecha_inicio)}</td><td>${x.meses}</td><td class="nowrap">${date(D.dates(x).end)}</td><td class="nowrap">${money(x.monto_total)}</td><td class="nowrap">${money(x.valor_cuota_inicial)}</td><td class="nowrap">${money(x.valor_cuota_mensual)}</td><td>${esc(x.orden_compra)}</td><td>${esc(x.nombre_empresa)}</td><td class="nowrap">${esc(x.rut_empresa)}</td><td>${esc(x.usuario_beneficiado)}</td><td>${esc(x.observacion)}</td><td><div class="actions"><a class="button small edit" href="#/licitaciones/${encodeURIComponent(x.id)}/editar" aria-label="Editar ${esc(x.nombre_licitacion)}">Editar</a><a class="button small pay" href="#/pagos/${encodeURIComponent(x.id)}" aria-label="Pagos de ${esc(x.nombre_licitacion)}">Pagos</a><button class="button small secondary" data-delete-tender="${esc(x.id)}" aria-label="Eliminar ${esc(x.nombre_licitacion)}">Eliminar</button></div></td></tr>`).join('')||'<tr><td colspan="17" class="empty">No hay licitaciones que coincidan. Agrega una o cambia los filtros.</td></tr>';
    document.querySelector('#count').textContent=`${rows.length} de ${state.licitaciones.length} licitaciones · Montos en pesos chilenos (CLP)`;
  }
  const input=(name,label,value='',type='text',extra='')=>`<label class="field" for="${name}">${label}<input id="${name}" name="${name}" type="${type}" value="${esc(value)}" ${extra}></label>`;
  const select=(name,label,value,options)=>`<label class="field" for="${name}">${label}<select id="${name}" name="${name}">${options.map(x=>`<option${x===value?' selected':''}>${x}</option>`).join('')}</select></label>`;
  function renderTenderForm(id) {
    const item=id?state.licitaciones.find(x=>x.id===id):{};
    if(!item)return missing();
    app.innerHTML='<a class="back-link" href="#/licitaciones">← Regresar a licitaciones</a>'+heading(id?'Editar licitación':'Nueva licitación','Completa los campos del contrato. Los importes se expresan en CLP.')+
    `<form id="tender-form" class="panel form-panel"><div class="form-grid">${input('nombre_licitacion','Nombre *',item.nombre_licitacion,'text','required maxlength="160"')}${select('tipo','Tipo de licitación',item.tipo,['Normal','Compra ágil'])}${select('renovable','Renovable',item.renovable,['Sí','No'])}${input('fecha_inicio','Fecha de inicio *',item.fecha_inicio||D.localDate(new Date()),'date','required min="1900-01-01" max="2100-12-31"')}${input('meses','Número de meses *',item.meses||12,'number','required min="1" max="600" step="1"')}${input('monto_total','Monto total *',item.monto_total,'number','required min="0" max="999999999999" step="1"')}${input('valor_cuota_inicial','Valor cuota inicial',item.valor_cuota_inicial||0,'number','min="0" max="999999999999" step="1"')}${input('valor_cuota_mensual','Valor cuota mensual *',item.valor_cuota_mensual,'number','required min="0" max="999999999999" step="1"')}${input('orden_compra','Orden de compra *',item.orden_compra,'text','required maxlength="100"')}${input('nombre_empresa','Nombre de la empresa *',item.nombre_empresa,'text','required maxlength="160"')}${input('rut_empresa','RUT de la empresa / identificador demo *',item.rut_empresa,'text','required maxlength="30"')}${input('usuario_beneficiado','Usuario beneficiado *',item.usuario_beneficiado,'text','required maxlength="160"')}<label class="field full" for="observacion">Observación<textarea id="observacion" name="observacion" maxlength="1000">${esc(item.observacion)}</textarea></label></div><p class="muted" id="date-preview"></p><p id="form-error" class="error" role="alert"></p><div class="actions form-actions"><a class="button secondary" href="#/licitaciones">Cancelar</a><button class="button" type="submit">Guardar licitación</button></div></form>`;
    const form=document.querySelector('#tender-form');
    function preview(){const v=Object.fromEntries(new FormData(form));document.querySelector('#date-preview').textContent=v.fecha_inicio&&Number(v.meses)>0?`Término: ${date(D.dates(v).end)} · Aviso desde: ${date(D.dates(v).notice)}`:'';}
    form.addEventListener('input',preview);preview();
    form.onsubmit=event=>{
      event.preventDefault();const value=Object.fromEntries(new FormData(form));
      for(const k of Object.keys(value))value[k]=value[k].trim();
      if(['nombre_licitacion','orden_compra','nombre_empresa','rut_empresa','usuario_beneficiado'].some(k=>!value[k])){document.querySelector('#form-error').textContent='Completa los campos obligatorios con texto válido.';return;}
      for(const k of ['meses','monto_total','valor_cuota_inicial','valor_cuota_mensual'])value[k]=Number(value[k]);
      value.id=id||uid();if(id)state.licitaciones=state.licitaciones.map(x=>x.id===id?value:x);else state.licitaciones.push(value);
      const saved=persist();location.hash='/licitaciones';if(saved)notify('Licitación guardada en este navegador.');
    };
  }
  function visiblePayments(id) {return state.pagos.filter(x=>x.id_licitacion===id&&normalize([x.fecha,date(x.fecha),x.factura,x.monto].join(' ')).includes(normalize(query)));}
  function renderPayments(id) {
    const item=state.licitaciones.find(x=>x.id===id);if(!item)return missing();currentId=id;
    const all=state.pagos.filter(x=>x.id_licitacion===id),paid=all.reduce((sum,x)=>sum+x.monto,0);
    app.innerHTML='<a class="back-link" href="#/licitaciones">← Regresar a licitaciones</a>'+heading('Pagos',item.nombre_licitacion,`<a class="button" href="#/pagos/${encodeURIComponent(id)}/nuevo">+ Agregar pago</a>`)+
      `<div class="details"><strong>${esc(item.nombre_empresa)}</strong> · ${esc(item.orden_compra)}<br>Inicio: ${date(item.fecha_inicio)} · Término: ${date(D.dates(item).end)} · ${badge(item)}</div><div class="stats">${stat('Monto del contrato',money(item.monto_total),'money')}${stat('Total pagado',money(paid),'money')}${stat('Saldo del contrato',money(item.monto_total-paid),'money')}${stat('Pagos registrados',all.length)}</div><section class="panel" aria-label="Pagos de la licitación"><div class="toolbar"><div class="filters"><input id="search" type="search" aria-label="Buscar pagos" placeholder="Buscar fecha, factura o monto…" value="${esc(query)}"></div><button class="button secondary" id="export">↓ Exportar CSV / Excel</button></div><div class="table-scroll"><table><thead><tr><th scope="col">Número de cuota</th><th scope="col">Fecha</th><th scope="col">Monto</th><th scope="col">Factura</th><th scope="col">Acciones</th></tr></thead><tbody id="rows"></tbody></table></div><div class="table-footer" id="count" aria-live="polite"></div></section>`;
    document.querySelector('#search').oninput=event=>{query=event.target.value;renderPaymentRows(id);};
    document.querySelector('#export').onclick=()=>download([['Número de cuota','Fecha','Monto','Factura'],...visiblePayments(id).map(x=>[all.findIndex(p=>p.id===x.id)+1,x.fecha,x.monto,x.factura])],`pagos-${id}.csv`);
    renderPaymentRows(id);
  }
  function renderPaymentRows(id) {
    const all=state.pagos.filter(x=>x.id_licitacion===id),rows=visiblePayments(id);
    document.querySelector('#rows').innerHTML=rows.map(x=>`<tr><td>${all.findIndex(p=>p.id===x.id)+1}</td><td>${date(x.fecha)}</td><td>${money(x.monto)}</td><td>${esc(x.factura)}</td><td><div class="actions"><a class="button small edit" href="#/pagos/${encodeURIComponent(id)}/${encodeURIComponent(x.id)}/editar" aria-label="Editar pago ${esc(x.factura)}">Editar</a><button class="button small secondary" data-delete-payment="${esc(x.id)}" aria-label="Eliminar pago ${esc(x.factura)}">Eliminar</button></div></td></tr>`).join('')||'<tr><td colspan="5" class="empty">No hay pagos que mostrar. Puedes registrar un nuevo pago.</td></tr>';
    document.querySelector('#count').textContent=`${rows.length} de ${all.length} pagos · Montos en pesos chilenos (CLP)`;
  }
  function renderPaymentForm(id,paymentId) {
    const item=state.licitaciones.find(x=>x.id===id),payment=paymentId?state.pagos.find(x=>x.id===paymentId&&x.id_licitacion===id):{};
    if(!item||!payment)return missing();
    const back=`#/pagos/${encodeURIComponent(id)}`;
    app.innerHTML=`<a class="back-link" href="${back}">← Regresar a pagos</a>`+heading(paymentId?'Editar pago':'Nuevo pago',item.nombre_licitacion)+`<form id="payment-form" class="panel form-panel"><div class="form-grid">${input('fecha','Fecha *',payment.fecha||D.localDate(new Date()),'date','required min="1900-01-01" max="2100-12-31"')}${input('factura','Factura *',payment.factura,'text','required maxlength="100"')}${input('monto','Monto (CLP) *',payment.monto??item.valor_cuota_mensual,'number','required min="1" max="999999999999" step="1"')}</div><p id="form-error" class="error" role="alert"></p><div class="actions form-actions"><a class="button secondary" href="${back}">Cancelar</a><button class="button" type="submit">Guardar pago</button></div></form>`;
    document.querySelector('#payment-form').onsubmit=event=>{
      event.preventDefault();const value=Object.fromEntries(new FormData(event.target));value.factura=value.factura.trim();
      if(!value.factura){document.querySelector('#form-error').textContent='Escribe un número o identificador de factura.';return;}
      value.monto=Number(value.monto);value.id=paymentId||uid();value.id_licitacion=id;
      if(paymentId)state.pagos=state.pagos.map(x=>x.id===paymentId?value:x);else state.pagos.push(value);
      const saved=persist();location.hash=back;if(saved)notify('Pago guardado en este navegador.');
    };
  }
  function missing(){app.innerHTML=heading('Registro no encontrado','El registro pudo haberse eliminado o el enlace no es válido.')+'<a class="button" href="#/licitaciones">Volver a licitaciones</a>';}
  function route() {
    query='';
    let parts;try{parts=location.hash.replace(/^#\/?/,'').split('/').map(decodeURIComponent);}catch{return missing();}
    if(!parts[0]||(parts[0]==='licitaciones'&&parts.length===1))renderTenders();
    else if(parts[0]==='licitaciones'&&parts[1]==='nueva'&&parts.length===2)renderTenderForm();
    else if(parts[0]==='licitaciones'&&parts[2]==='editar'&&parts.length===3)renderTenderForm(parts[1]);
    else if(parts[0]==='pagos'&&parts.length===2)renderPayments(parts[1]);
    else if(parts[0]==='pagos'&&parts[2]==='nuevo'&&parts.length===3)renderPaymentForm(parts[1]);
    else if(parts[0]==='pagos'&&parts[3]==='editar'&&parts.length===4)renderPaymentForm(parts[1],parts[2]);
    else missing();
    app.focus({preventScroll:true});window.scrollTo(0,0);
  }
  app.addEventListener('click',async event=>{
    const tenderButton=event.target.closest('[data-delete-tender]');
    if(tenderButton){const id=tenderButton.dataset.deleteTender;if(await confirmAction('¿Eliminar esta licitación y todos sus pagos de la demostración?')){state.licitaciones=state.licitaciones.filter(x=>x.id!==id);state.pagos=state.pagos.filter(x=>x.id_licitacion!==id);const saved=persist();renderTenders();if(saved)notify('Licitación y pagos eliminados.');}}
    const paymentButton=event.target.closest('[data-delete-payment]');
    if(paymentButton){const id=paymentButton.dataset.deletePayment;if(await confirmAction('¿Eliminar este pago de la demostración?')){state.pagos=state.pagos.filter(x=>x.id!==id);const saved=persist();renderPayments(currentId);if(saved)notify('Pago eliminado.');}}
  });
  document.querySelector('#reset-demo').onclick=async()=>{
    if(await confirmAction('Se reemplazarán tus cambios locales por nuevos datos ficticios aleatorios. ¿Continuar?')){state=D.createDemo();filter='all';const saved=persist();if(location.hash==='#/licitaciones')route();else location.hash='/licitaciones';if(saved)notify('Datos de demostración restablecidos.');}
  };
  window.addEventListener('hashchange',route);route();
  if(storageWarning)notify('No fue posible recuperar los datos locales. Se cargó una nueva demostración.');
  else persist();
})();
