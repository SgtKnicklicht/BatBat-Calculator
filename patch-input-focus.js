(function(){
  function patchInputs(){
    const ids = ['e_gross','b_am_','b_cb_','b_pvdf_','b_extra_'];
    document.addEventListener('input', function(ev){
      const el = ev.target;
      if (!el || !el.id) return;
      const id = el.id;
      const isLiveNumeric = id === 'e_gross' || ids.slice(1).some(prefix => id.startsWith(prefix));
      if (!isLiveNumeric) return;
      ev.stopImmediatePropagation();
      try {
        if (id === 'e_gross' && typeof current === 'function') {
          const ctx = current();
          if (ctx && ctx.e) ctx.e.grossMg = el.value;
        } else if (typeof state !== 'undefined') {
          const match = id.match(/^(b_am_|b_cb_|b_pvdf_|b_extra_)(.+)$/);
          if (match) {
            const b = state.batches.find(x => x.id === match[2]);
            if (b) {
              if (match[1] === 'b_am_') b.amMassMg = el.value;
              if (match[1] === 'b_cb_') b.cbMassMg = el.value;
              if (match[1] === 'b_pvdf_') b.pvdfMassMg = el.value;
              if (match[1] === 'b_extra_') b.extraInactiveMassMg = el.value;
            }
          }
        }
        if (typeof save === 'function') save();
      } catch(e) {}
    }, true);

    document.addEventListener('change', function(ev){
      const el = ev.target;
      if (!el || !el.id) return;
      const id = el.id;
      const isLiveNumeric = id === 'e_gross' || ['b_am_','b_cb_','b_pvdf_','b_extra_'].some(prefix => id.startsWith(prefix));
      if (!isLiveNumeric) return;
      try { if (typeof render === 'function') render(); } catch(e) {}
    }, true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', patchInputs);
  else patchInputs();
})();
