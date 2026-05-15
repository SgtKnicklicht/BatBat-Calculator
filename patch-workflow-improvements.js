(function(){
  let showArchivedBatches = false;

  function cleanPart(v){
    return String(v || '')
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^A-Za-z0-9_\-]/g, '')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  function getBatchSampleId(b){
    if (!b) return '';
    if (b.sampleId) return cleanPart(b.sampleId);
    if (b.batchName) return cleanPart(b.batchName);
    const m = typeof material === 'function' ? material(b.materialId) : null;
    return cleanPart((m && (m.shortName || m.name)) || 'Sample');
  }

  function nextBatteryId(batchId, sampleId, excludeId){
    const batchPart = cleanPart(batchId || 'BATCH');
    const samplePart = cleanPart(sampleId || 'Sample');
    const prefix = `${batchPart}_${samplePart}_B`;
    let max = 0;
    try {
      state.electrodes.forEach(e => {
        if (excludeId && e.id === excludeId) return;
        const m = String(e.id || '').match(new RegExp('^' + prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\d+)$'));
        if (m) max = Math.max(max, Number(m[1]));
      });
    } catch(e) {}
    return `${prefix}${max + 1}`;
  }

  function updateBatchSampleField(){
    try {
      state.batches.forEach(b => {
        const idInput = document.getElementById('b_id_' + b.id);
        if (!idInput) return;
        const card = idInput.closest('.manager-item');
        if (!card || card.querySelector('[data-sample-row="' + b.id + '"]')) return;
        const row = document.createElement('label');
        row.className = 'field';
        row.dataset.sampleRow = b.id;
        row.innerHTML = `<span>Sample identifier for electrode IDs</span><input id="b_sample_${b.id}" value="${String(b.sampleId || '').replace(/"/g,'&quot;')}" inputmode="text" placeholder="e.g. NFM_Sn">`;
        const grid = card.querySelector('.form-grid');
        if (grid) grid.insertBefore(row, grid.children[4] || null);
        const inp = row.querySelector('input');
        inp.addEventListener('change', function(){ b.sampleId = cleanPart(inp.value); if (typeof save === 'function') save(); if (typeof render === 'function') render(); });
      });
    } catch(e) {}
  }

  function patchBatchVisibility(){
    try {
      if (!state || !state.batches) return;
      const lib = document.querySelector('.library-switch');
      if (lib && !document.getElementById('toggleArchivedBatches')) {
        const btn = document.createElement('button');
        btn.id = 'toggleArchivedBatches';
        btn.textContent = showArchivedBatches ? 'Hide archived' : 'Show archived';
        btn.addEventListener('click', function(){ showArchivedBatches = !showArchivedBatches; if (typeof render === 'function') render(); });
        lib.appendChild(btn);
      }
      state.batches.forEach(b => {
        const idInput = document.getElementById('b_id_' + b.id);
        const card = idInput && idInput.closest('.manager-item');
        if (card && b.archived && !showArchivedBatches) card.style.display = 'none';
      });
    } catch(e) {}
  }

  function duplicateSelectedElectrode(){
    try {
      const ctx = typeof current === 'function' ? current() : {};
      const src = ctx.e;
      if (!src) return;
      const b = ctx.b || (typeof batch === 'function' ? batch(src.batchId) : null);
      const sample = getBatchSampleId(b);
      const newId = nextBatteryId(src.batchId, sample, src.id);
      const copy = Object.assign({}, src, {
        id: newId,
        grossMg: '',
        directAmMassMg: '',
        measuredAmMassMg: '',
        label: '',
        notes: src.notes || ''
      });
      state.electrodes.unshift(copy);
      selected = newId;
      tab = 'quick';
      if (typeof save === 'function') save();
      if (typeof render === 'function') render();
    } catch(e) { alert('Duplicate failed.'); }
  }

  function patchQuickActions(){
    try {
      const del = document.querySelector('[data-action="delE"]');
      if (!del || document.getElementById('duplicateElectrodeBtn')) return;
      const btn = document.createElement('button');
      btn.id = 'duplicateElectrodeBtn';
      btn.className = 'btn';
      btn.type = 'button';
      btn.textContent = 'Duplicate electrode';
      btn.addEventListener('click', duplicateSelectedElectrode);
      del.parentElement.insertBefore(btn, del);
    } catch(e) {}
  }

  function patchAddElectrode(){
    try {
      if (window.__autoIdAddElectrodePatched) return;
      window.__autoIdAddElectrodePatched = true;
      const oldAddE = addE;
      addE = function(){
        oldAddE();
        try {
          const ctx = typeof current === 'function' ? current() : {};
          const e = ctx.e;
          const b = ctx.b || (e && typeof batch === 'function' ? batch(e.batchId) : null);
          if (!e || !b) return;
          const sample = getBatchSampleId(b);
          e.id = nextBatteryId(e.batchId, sample, e.id);
          selected = e.id;
          if (typeof save === 'function') save();
          if (typeof render === 'function') render();
        } catch(err) {}
      };
      const top = document.getElementById('newElectrodeTop');
      if (top) top.onclick = addE;
    } catch(e) {}
  }

  function warningsFor(ctx){
    const out = [];
    const c = ctx.c || {};
    const e = ctx.e || {};
    const b = ctx.b || {};
    if (b.archived) out.push(['Archived batch', 'This electrode uses an archived batch. Old data is preserved, but the batch is hidden for new Quick C-Rate entries.']);
    if (!e.grossMg) out.push(['Missing gross mass', 'Enter gross electrode mass incl. foil.']);
    if (c.net !== null && c.net !== undefined && c.net < 0) out.push(['Negative coating mass', 'Gross mass is smaller than empty mass. Check standard or weighing.']);
    if (c.amf === null || c.amf === undefined || Number.isNaN(c.amf)) out.push(['Missing AM fraction', 'Enter AM / CB / PVDF weighings in the selected batch.']);
    if (c.loading !== null && c.loading !== undefined && !Number.isNaN(c.loading)) {
      if (c.loading > 20) out.push(['Very high loading', 'Areal loading is above 20 mg/cm². Check area, empty mass, and gross mass.']);
      if (c.loading > 0 && c.loading < 0.5) out.push(['Very low loading', 'Areal loading is below 0.5 mg/cm². Check whether the mass is realistic.']);
    }
    if (c.one !== null && c.one !== undefined && !Number.isNaN(c.one) && c.one > 20) out.push(['High 1C current', '1C current is above 20 mA. Check AM mass and theoretical capacity.']);
    return out;
  }

  function patchWarnings(){
    try {
      const ctx = typeof current === 'function' ? current() : {};
      const warns = warningsFor(ctx).filter(w => w[0] !== 'Missing gross mass' || (ctx.e && !ctx.e.grossMg));
      const target = document.querySelector('.kpis');
      if (!target || document.getElementById('warningBox')) return;
      const box = document.createElement('div');
      box.id = 'warningBox';
      box.className = 'card';
      box.style.borderColor = warns.length ? '#a16207' : '#27272a';
      box.innerHTML = warns.length
        ? `<h2 class="section-title">Checks</h2>${warns.map(w=>`<div class="notice" style="margin-bottom:8px"><b>${w[0]}</b><br><span class="muted">${w[1]}</span></div>`).join('')}`
        : `<h2 class="section-title">Checks</h2><p class="muted">No obvious input problems detected.</p>`;
      target.parentElement.insertBefore(box, target.nextSibling);
    } catch(e) {}
  }

  function patchNaming(){
    document.title = 'Battery C-Rate App';
    document.querySelectorAll('h1').forEach(h => { if (/Battery CF App|Battery C-Rate App/.test(h.textContent)) h.textContent = 'Battery C-Rate App'; });
    document.querySelectorAll('*').forEach(el => {
      if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
        el.textContent = el.textContent
          .replace('Quick CF', 'Quick C-Rate')
          .replace('CF copy line', 'Cycler copy line')
          .replace('Export JSON', 'Backup JSON');
      }
    });
  }

  function patchRender(){
    try {
      if (window.__workflowPatchActive) return;
      window.__workflowPatchActive = true;
      patchAddElectrode();
      const oldRender = render;
      render = function(){
        oldRender();
        patchNaming();
        updateBatchSampleField();
        patchBatchVisibility();
        patchQuickActions();
        patchWarnings();
      };
      render();
    } catch(e) {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', patchRender);
  else setTimeout(patchRender, 0);
})();
