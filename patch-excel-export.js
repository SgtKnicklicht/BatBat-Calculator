(function(){
  function text(v){ return v === null || v === undefined ? '' : String(v); }
  function xml(v){
    return text(v).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function n(v){
    if (typeof num === 'function') return num(v);
    if (v === null || v === undefined || v === '') return null;
    const m = String(v).replace(',', '.').match(/-?\d+(\.\d+)?/);
    return m ? Number(m[0]) : null;
  }
  function f(v, d){
    if (typeof fmt === 'function') return fmt(v, d || 3);
    if (v === null || v === undefined || Number.isNaN(v)) return '';
    return Number(v).toFixed(d || 3);
  }
  function p(v){
    if (typeof pct === 'function') return pct(v);
    if (v === null || v === undefined || Number.isNaN(v)) return '';
    return (v * 100).toFixed(2) + ' %';
  }
  function amFraction(b){
    if (typeof batchFraction === 'function') return batchFraction(b);
    const am = n(b && b.amMassMg), cb = n(b && b.cbMassMg) || 0, pvdf = n(b && b.pvdfMassMg) || 0, extra = n(b && b.extraInactiveMassMg) || 0;
    if (am === null) return null;
    const total = am + cb + pvdf + extra;
    return total > 0 ? am / total : null;
  }
  function calcRow(e){
    const b = state.batches.find(x => x.id === e.batchId) || {};
    const m = state.materials.find(x => x.id === b.materialId) || {};
    const s = state.standards.find(x => x.id === e.standardId) || {};
    let c = {};
    try { c = typeof calc === 'function' ? calc(e, m, s, b) : {}; } catch(err) { c = {}; }
    return {e,b,m,s,c};
  }
  function table(title, headers, rows){
    return `<h2>${xml(title)}</h2><table><thead><tr>${headers.map(h=>`<th>${xml(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(v=>`<td>${xml(v)}</td>`).join('')}</tr>`).join('')}</tbody></table><br/>`;
  }
  function excelHtml(){
    const standards = state.standards.map(s => [s.id, s.name, s.collectorType, s.emptyMassMg, s.diameterMm, s.areaCm2, s.side, s.notes]);
    const materials = state.materials.map(m => [m.id, m.shortName, m.name, m.chemistry, m.theoreticalCapacity, m.defaultStandardId, m.voltage || m.defaultVoltage, m.reference || m.defaultReference, m.electrolyte || m.defaultElectrolyte, m.notes]);
    const batches = state.batches.map(b => [b.id, b.archived ? 'archived' : 'active', b.materialId, b.project, b.batchName, b.amMassMg, b.cbMassMg, b.pvdfMassMg, b.extraInactiveMassMg, p(amFraction(b)), b.coating, b.date, b.notes]);
    const electrodes = state.electrodes.map(e => {
      const {b,m,s,c} = calcRow(e);
      return [
        e.id, e.label, e.batchId, b.archived ? 'archived batch' : 'active batch', m.shortName || m.name, e.standardId, s.name,
        e.grossMg, f(c.empty,4), f(c.net,4), p(c.amf), f(c.am,4), f(c.loading,3), f(c.one,4),
        f(c.one ? c.one/10 : null,4), f(c.one ? c.one/5 : null,4), f(c.one ? c.one/2 : null,4), f(c.one ? c.one*2 : null,4),
        m.voltage || m.defaultVoltage, m.reference || m.defaultReference, m.electrolyte || m.defaultElectrolyte, e.notes
      ];
    });
    const now = new Date().toISOString().slice(0,19).replace('T',' ');
    return `<!doctype html><html><head><meta charset="utf-8"><style>
      body{font-family:Arial,sans-serif} h1{font-size:18pt} h2{font-size:14pt;margin-top:18px}
      table{border-collapse:collapse;margin-bottom:16px} th{background:#e9e9e9;font-weight:bold} th,td{border:1px solid #999;padding:4px 7px;font-size:10pt;white-space:nowrap}
    </style></head><body>
      <h1>Battery C-Rate App Export</h1><p>Exported: ${xml(now)}</p>
      ${table('Electrodes', ['Electrode ID','Label','Batch ID','Batch status','Material','Standard ID','Standard name','Gross incl. foil [mg]','Empty mass [mg]','Net coating [mg]','Actual AM fraction','AM mass [mg]','Loading [mg/cm2]','1C [mA]','C/10 [mA]','C/5 [mA]','C/2 [mA]','2C [mA]','Voltage','Reference','Electrolyte','Notes'], electrodes)}
      ${table('Batches', ['Batch ID','Status','Material ID','Project','Batch name','AM weighing [mg]','CB weighing [mg]','PVDF weighing [mg]','Extra inactive [mg]','Actual AM fraction','Coating / doping','Date','Notes'], batches)}
      ${table('Materials', ['Material ID','Short name','Full name','Chemistry','Theoretical capacity [mAh/g]','Default standard','Voltage','Reference','Electrolyte','Notes'], materials)}
      ${table('Standards', ['Standard ID','Name','Collector type','Empty mass [mg]','Diameter [mm]','Area [cm2]','Side','Notes'], standards)}
    </body></html>`;
  }
  function downloadExcel(){
    try {
      const blob = new Blob([excelHtml()], {type:'application/vnd.ms-excel;charset=utf-8'});
      const a = document.createElement('a');
      const stamp = new Date().toISOString().slice(0,10);
      a.href = URL.createObjectURL(blob);
      a.download = 'battery-c-rate-export-' + stamp + '.xls';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(()=>URL.revokeObjectURL(a.href),1000);
    } catch(e) { alert('Excel export failed.'); }
  }
  function addButton(){
    const bar = document.querySelector('.top-actions');
    if (!bar || document.getElementById('exportExcelBtn')) return;
    const btn = document.createElement('button');
    btn.id = 'exportExcelBtn';
    btn.className = 'btn';
    btn.type = 'button';
    btn.textContent = 'Export Excel';
    btn.addEventListener('click', downloadExcel);
    const jsonBtn = document.getElementById('exportBtn');
    if (jsonBtn) bar.insertBefore(btn, jsonBtn.nextSibling);
    else bar.appendChild(btn);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addButton);
  else addButton();
})();
