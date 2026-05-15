(function(){
  function isArchived(batch){ return !!(batch && batch.archived); }

  function ensureArchiveFlags(){
    try {
      if (typeof state === 'undefined' || !state.batches) return;
      state.batches.forEach(b => { if (typeof b.archived === 'undefined') b.archived = false; });
      if (typeof save === 'function') save();
    } catch(e) {}
  }

  function patchQuickDropdown(){
    try {
      if (typeof state === 'undefined') return;
      const sel = document.getElementById('e_batch');
      if (!sel) return;
      const currentValue = sel.value;
      Array.from(sel.options).forEach(opt => {
        const b = state.batches.find(x => x.id === opt.value);
        if (b && isArchived(b) && opt.value !== currentValue) opt.remove();
        if (b && isArchived(b) && opt.value === currentValue) opt.textContent = opt.textContent + ' · archived';
      });
    } catch(e) {}
  }

  function patchBatchLibrary(){
    try {
      if (typeof state === 'undefined') return;
      state.batches.forEach(b => {
        const idInput = document.getElementById('b_id_' + b.id);
        if (!idInput) return;
        const card = idInput.closest('.manager-item');
        if (!card || card.dataset.archivePatched === '1') return;
        card.dataset.archivePatched = '1';
        if (isArchived(b)) {
          card.style.opacity = '0.58';
          card.style.borderColor = '#52525b';
        }
        const row = document.createElement('div');
        row.className = 'row';
        row.style.marginTop = '10px';
        row.innerHTML = `
          <span class="muted">Status: <b>${isArchived(b) ? 'Archived' : 'Active'}</b></span>
          <button class="btn" type="button">${isArchived(b) ? 'Restore batch' : 'Archive batch'}</button>
        `;
        const btn = row.querySelector('button');
        btn.addEventListener('click', function(){
          b.archived = !isArchived(b);
          if (typeof save === 'function') save();
          if (typeof render === 'function') render();
        });
        card.appendChild(row);
      });
    } catch(e) {}
  }

  function patchRender(){
    try {
      const oldRender = render;
      render = function(){
        oldRender();
        ensureArchiveFlags();
        patchQuickDropdown();
        patchBatchLibrary();
      };
      render();
    } catch(e) {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', patchRender);
  else setTimeout(patchRender, 0);
})();
