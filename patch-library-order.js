(function(){
  function patch(){
    try {
      if (typeof window.library !== 'undefined') window.library = 'batches';
      const oldRender = window.render || render;
      window.render = function(){
        oldRender();
        const buttons = Array.from(document.querySelectorAll('[data-lib]'));
        if (!buttons.length) return;
        const container = buttons[0].parentElement;
        const batch = buttons.find(b => b.dataset.lib === 'batches');
        if (container && batch && container.firstElementChild !== batch) container.insertBefore(batch, container.firstElementChild);
      };
      window.render();
    } catch(e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', patch);
  else setTimeout(patch, 0);
})();
