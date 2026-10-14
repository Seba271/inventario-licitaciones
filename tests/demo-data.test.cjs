const {test}=require('node:test');
const assert=require('node:assert/strict');
const D=require('../assets/demo-data.js');
test('Las fechas respetan fin de mes y año bisiesto',()=>{
  assert.equal(D.addMonths('2024-01-31',1),'2024-02-29');
  assert.equal(D.addMonths('2025-01-31',1),'2025-02-28');
  assert.equal(D.addMonths('2026-12-31',2),'2027-02-28');
});
test('Avisos de 4 y 2 meses y límites de vencimiento',()=>{
  const item={fecha_inicio:'2026-01-14',meses:12,tipo:'Normal'};
  assert.equal(D.status(item,'2026-09-13'),'active');
  assert.equal(D.status(item,'2026-09-14'),'warning');
  assert.equal(D.status(item,'2027-01-14'),'expired');
  assert.equal(D.dates({...item,tipo:'Compra ágil'}).notice,'2026-11-14');
});
test('Demo incluye los tres estados, pagos asociados y montos coherentes',()=>{
  for(const today of ['2026-10-13','2028-02-29','2026-01-31']){
    const data=D.createDemo(today,()=>0.5);
    assert.equal(data.licitaciones.length,8);
    assert.deepEqual(new Set(data.licitaciones.map(x=>D.status(x,today))),new Set(['active','warning','expired']));
    assert.equal(new Set(data.pagos.map(x=>x.id)).size,data.pagos.length);
    for(const x of data.licitaciones)assert.equal(x.monto_total,x.valor_cuota_inicial+x.meses*x.valor_cuota_mensual);
    for(const p of data.pagos){assert.ok(data.licitaciones.some(x=>x.id===p.id_licitacion));assert.ok(p.fecha<=today);assert.ok(p.monto>0);}
  }
});
test('Exportación CSV escapa delimitadores y evita fórmulas de hojas de cálculo',()=>{
  const csv=D.csv([['Empresa; "Demo"','=HYPERLINK("x")',' +1','normal']]);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('"Empresa; ""Demo"""'));
  assert.ok(csv.includes('"\'=HYPERLINK'));
  assert.ok(csv.includes('"\' +1"'));
});
