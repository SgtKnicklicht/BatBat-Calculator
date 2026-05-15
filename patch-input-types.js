(function(){
  const numericExact = new Set(['e_gross','e_empty','e_dia','e_area','e_am']);
  const numericPrefixes = ['b_am_','b_cb_','b_pvdf_','b_extra_','s_empty_','s_dia_','s_area_','m_cap_'];

  function isNumericInput(id){
    return numericExact.has(id) || numericPrefixes.some(prefix => id.startsWith(prefix));
  }

  function applyInputModes(){
    document.querySelectorAll('input').forEach(input => {
      if (input.type === 'file') return;
      const id = input.id || '';
      input.type = 'text';
      if (isNumericInput(id)) {
        input.setAttribute('inputmode', 'decimal');
        input.setAttribute('autocomplete', 'off');
      } else {
        input.setAttribute('inputmode', 'text');
        input.setAttribute('autocomplete', 'off');
        input.removeAttribute('pattern');
      }
    });
  }

  function patchRender(){
    try {
      const oldRender = render;
      render = function(){
        oldRender();
        applyInputModes();
      };
      applyInputModes();
    } catch(e) {
      applyInputModes();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', patchRender);
  else patchRender();
})();
