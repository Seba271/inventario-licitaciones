/* Datos exclusivamente ficticios. Sin dependencias, solicitudes de red ni base de datos. */
(function (root) {
  'use strict';
  const localDate = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  function addMonths(iso, months) {
    const [y,m,d] = iso.split('-').map(Number);
    const target = new Date(y,m-1+Number(months),1,12);
    const lastDay = new Date(target.getFullYear(),target.getMonth()+1,0).getDate();
    target.setDate(Math.min(d,lastDay));
    return localDate(target);
  }
  function dates(item) {
    const end = addMonths(item.fecha_inicio,item.meses);
    return {end, notice:addMonths(end,item.tipo === 'Compra ágil' ? -2 : -4)};
  }
  function status(item,today=localDate(new Date())) {
    const {end,notice}=dates(item);
    return today>=end ? 'expired' : today>=notice ? 'warning' : 'active';
  }
  function createDemo(today=localDate(new Date()),random=Math.random) {
    const names=['Arriendo de equipos computacionales','Servicio de conectividad regional','Mantención de impresoras','Licencias de ofimática','Servicio de respaldo digital','Insumos de oficina','Soporte técnico de redes','Equipamiento de videoconferencia'];
    const companies=['Tecnología Horizonte Demo SpA','Conecta Norte Demo Ltda.','Soluciones Valle Demo SpA','Oficina Digital Demo Ltda.'];
    const terms=[8,1,-2,10,3,-1,6,1];
    const licitaciones=names.map((name,i)=>{
      const months=i===5?6:12;
      const monthly=(Math.floor(random()*15)+4)*50000;
      const initial=monthly*2;
      return {id:`lic-${i+1}`,nombre_licitacion:name,tipo:i%3===1?'Compra ágil':'Normal',renovable:i%3===0?'No':'Sí',fecha_inicio:addMonths(today,terms[i]-months),meses:months,monto_total:initial+monthly*months,valor_cuota_inicial:initial,valor_cuota_mensual:monthly,orden_compra:`DEMO-${String(i+1).padStart(4,'0')}-SE26`,nombre_empresa:companies[i%4],rut_empresa:`DEMO-${i+1}`,usuario_beneficiado:['Unidad de informática','Administración','Oficina de proyectos','Equipo territorial'][i%4],observacion:'Registro ficticio para probar el inventario y sus pagos.'};
    });
    const pagos=licitaciones.flatMap((item,i)=>Array.from({length:Math.min(3,12-terms[i])},(_,n)=>({id:`pago-${i+1}-${n+1}`,id_licitacion:item.id,fecha:addMonths(item.fecha_inicio,n),monto:n===0?item.valor_cuota_inicial:item.valor_cuota_mensual,factura:`DEMO-F${i+1}${String(n+1).padStart(3,'0')}`})));
    return {version:1,licitaciones,pagos};
  }
  function csv(rows) {
    return '\uFEFF'+rows.map(row=>row.map(value=>{
      let text=String(value??'');
      if (/^[\s]*[=+@-]/.test(text)) text="'"+text;
      return '"'+text.replace(/"/g,'""')+'"';
    }).join(';')).join('\r\n');
  }
  const api={localDate,addMonths,dates,status,createDemo,csv};
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  else root.DemoData=api;
})(globalThis);
