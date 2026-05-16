(function(){
  const liveExact = new Set(['e_gross']);
  const livePrefixes = ['b_am_','b_cb_','b_pvdf_','b_extra_'];
  let timer = null;

  function isLiveField(id){
    return liveExact.has(id) || livePrefixes.some(p => id.startsWith(p));
  }

  function updateStateFromInput(id, value){
    try {
      if (id === 'e_gross' && typeof current === 'function') {
        const ctx = current();
        if (ctx && ctx.e) ctx.e.grossMg = value;
        return;
      }
      if (typeof state === 'undefined') return;
      const m = id.match(/^(b_am_|b_cb_|b_pvdf_|b_extra_)(.+)$/);
      if (!m) return;
      const b = state.batches.find(x => x.id === m[2]);
      if (!b) return;
      if (m[1] === 'b_am_') b.amMassMg = value;
      if (m[1] === 'b_cb_') b.cbMassMg = value;
      if (m[1] === 'b_pvdf_') b.pvdfMassMg = value;
      if (m[1] === 'b_extra_') b.extraInactiveMassMg = value;
    } catch(e) {}
  }

  function renderPreserveFocus(id, start, end){
    try {
      if (typeof save === 'function') save();
      if (typeof render !== 'function') return;
      render();
      requestAnimationFrame(function(){
        const next = document.getElementById(id);
        if (!next) return;
        next.focus({preventScroll:true});
        try { next.setSelectionRange(start, end); } catch(e) {}
      });
    } catch(e) {}
  }

  document.addEventListener('input', function(ev){
    const el = ev.target;
    if (!el || !el.id || !isLiveField(el.id)) return;
    ev.stopImmediatePropagation();
    const id = el.id;
    const value = el.value;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    updateStateFromInput(id, value);
    clearTimeout(timer);
    timer = setTimeout(function(){ renderPreserveFocus(id, start, end); }, 80);
  }, true);
})();
