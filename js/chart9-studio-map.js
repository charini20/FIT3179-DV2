// Chart 9: Vega-Lite map, with direct manipulation added to Week 10's
// projection centre / scale parameter pattern. Site locations remain Vega-Lite marks.
(() => {
  'use strict';
  const RAD = Math.PI / 180;
  const MIN_SCALE = 800;
  const MAX_SCALE = 13000;
  const INITIAL_VIEW = { lon: 134, lat: -26.5, scale: 800 };
  const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));
  function attachControls(view, target, spec) {
    const toolbar = document.getElementById('c9-map-toolbar');
    const svg = target.querySelector('.vega-embed svg');
    if (!svg || !toolbar) throw new Error('Map SVG or custom controls unavailable');
    let state = { ...INITIAL_VIEW };
    const slider = toolbar.querySelector('#c9-zoom-range');
    const zoomValue = toolbar.querySelector('#c9-zoom-value');
    if (!slider || !zoomValue) throw new Error('Zoom slider UI missing');
    // At slider 0 the entire map is shown at the new, larger 800 scale.
    // A logarithmic slider makes zooming feel gradual over many scales.
    const sliderToScale = value => MIN_SCALE * Math.pow(MAX_SCALE / MIN_SCALE, Number(value) / 100);
    const scaleToSlider = scale => 100 * Math.log(scale / MIN_SCALE) / Math.log(MAX_SCALE / MIN_SCALE);
    function syncZoomUI() {
      slider.value = String(Math.round(clamp(scaleToSlider(state.scale), 0, 100)));
      zoomValue.textContent = `${(state.scale / INITIAL_VIEW.scale).toFixed(1)}×`;
    }
    let dragging = null;
    let rafPending = false;
    let rendering = false;
    let dirty = false;
    async function pushSignals() {
      if (rendering) { dirty = true; return; }
      rendering = true;
      try {
        do {
          dirty = false;
          const snapshot = { ...state };
          view.signal('map_lon', snapshot.lon);
          view.signal('map_lat', snapshot.lat);
          view.signal('map_scale', snapshot.scale);
          await view.runAsync();
        } while (dirty);
      } catch (error) {
        console.error('Chart 9 map navigation failed:', error);
      } finally {
        rendering = false;
      }
    }
    function update(patch) {
      state = {
        lon: clamp(patch.lon ?? state.lon, 109, 156),
        lat: clamp(patch.lat ?? state.lat, -45, -9),
        scale: clamp(patch.scale ?? state.scale, MIN_SCALE, MAX_SCALE)
      };
      syncZoomUI();
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(() => { rafPending = false; pushSignals(); });
      } else dirty = true;
    }
    function zoom(factor, pos) {
      const nextScale = clamp(state.scale * factor, MIN_SCALE, MAX_SCALE);
      if (nextScale === state.scale) return;
      if (!pos) { update({ scale: nextScale }); return; }
      const halfW = spec.width / 2, halfH = spec.height / 2;
      const rx = pos.x - halfW, ry = pos.y - halfH;
      const cursorLon = state.lon + rx / (state.scale * RAD);
      const cursorLat = state.lat - ry / (state.scale * RAD);
      update({ lon: cursorLon - rx / (nextScale * RAD),
               lat: cursorLat + ry / (nextScale * RAD), scale: nextScale });
    }
    toolbar.addEventListener('click', event => {
      const btn = event.target.closest('button');
      if (!btn) return;
      if (btn.dataset.c9Action === 'reset') update({ ...INITIAL_VIEW });
    });
    slider.addEventListener('input', event => {
      update({ scale: sliderToScale(event.target.value) });
    });
    syncZoomUI();
    // The SVG scales responsively, so convert browser pixels to Vega's plot pixels.
    function point(event) {
      const rect = svg.getBoundingClientRect();
      return {x: (event.clientX - rect.left) * spec.width / rect.width,
              y: (event.clientY - rect.top) * spec.height / rect.height};
    }
    svg.style.cursor = 'grab';
    svg.style.touchAction = 'none';
    svg.addEventListener('pointerdown', event => {
      if (event.button !== 0 && event.pointerType === 'mouse') return;
      // Stop Chrome selecting map labels while click-drag panning.
      event.preventDefault();
      dragging = { id: event.pointerId, x: event.clientX, y: event.clientY,
                   lon: state.lon, lat: state.lat, moved: false };
      svg.setPointerCapture(event.pointerId);
      svg.style.cursor = 'grabbing';
    });
    svg.addEventListener('pointermove', event => {
      if (!dragging || event.pointerId !== dragging.id) return;
      const rect = svg.getBoundingClientRect();
      const dx = (event.clientX - dragging.x) * spec.width / rect.width;
      const dy = (event.clientY - dragging.y) * spec.height / rect.height;
      if (Math.abs(dx) + Math.abs(dy) > 3) dragging.moved = true;
      if (!dragging.moved) return;
      event.preventDefault();
      update({ lon: dragging.lon - dx / (state.scale * RAD),
               lat: dragging.lat + dy / (state.scale * RAD) });
    });
    function stopDrag(event) {
      if (!dragging || event.pointerId !== dragging.id) return;
      if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
      dragging = null;
      svg.style.cursor = 'grab';
    }
    svg.addEventListener('pointerup', stopDrag);
    svg.addEventListener('pointercancel', stopDrag);
    svg.addEventListener('lostpointercapture', () => { dragging = null; svg.style.cursor = 'grab'; });
    svg.addEventListener('wheel', event => {
      event.preventDefault();
      zoom(Math.exp(-event.deltaY * 0.0013), point(event));
    }, { passive:false });
    // Keyboard accessible pan and zoom. Keep pointer interactions unchanged.
    svg.setAttribute('tabindex', '0');
    svg.setAttribute('role', 'application');
    svg.setAttribute('aria-label', 'Interactive map of 124 cat-free refuge locations. Drag to pan, scroll to zoom, use arrow keys to move, plus and minus keys to zoom, or press Home to reset.');
    svg.addEventListener('keydown', event => {
      const panStep = 46 / (state.scale * RAD);
      let handled = true;
      if (event.key === 'ArrowLeft') update({ lon: state.lon - panStep });
      else if (event.key === 'ArrowRight') update({ lon: state.lon + panStep });
      else if (event.key === 'ArrowUp') update({ lat: state.lat + panStep });
      else if (event.key === 'ArrowDown') update({ lat: state.lat - panStep });
      else if (event.key === '+' || event.key === '=') zoom(1.22);
      else if (event.key === '-' || event.key === '_') zoom(1 / 1.22);
      else if (event.key === 'Home' || event.key === '0') update({ ...INITIAL_VIEW });
      else handled = false;
      if (handled) event.preventDefault();
    });
    // Slider, wheel, and drag all manipulate the same Vega-Lite view parameters.
    toolbar.hidden = false;
  }
  async function renderStudioMap() {
    const target = document.getElementById('mammal-haven-dot-map');
    const status = document.getElementById('c9-loading-note');
    const source = document.getElementById('chart9-vega-spec');
    if (!target || !source) return;
    const showError = message => {
      document.body.classList.remove('vega-c9-havens-ready');
      if (status) { status.textContent = message; status.classList.add('c9-loading--error'); status.hidden = false; }
    };
    if (typeof window.vegaEmbed !== 'function') {
      showError('The interactive map library did not load. Connect to the internet and reopen this page, or use VS Code Live Server. The static map remains visible below.');
      return;
    }
    try {
      const spec = JSON.parse(source.textContent);
      const result = await window.vegaEmbed('#mammal-haven-dot-map', spec, {actions:false, renderer:'svg'});
      const svg = target.querySelector('.vega-embed svg');
      if (!svg) throw new Error('Vega-Lite did not render an SVG');
      if (!svg.hasAttribute('viewBox')) {
        const w = Number(svg.getAttribute('width')) || spec.width;
        const h = Number(svg.getAttribute('height')) || spec.height;
        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      }
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      attachControls(result.view, target, spec);
      document.body.classList.add('vega-c9-havens-ready');
      if (status) status.hidden = true;
    } catch (error) {
      console.error('Chart 9 Vega-Lite render error:', error);
      showError('The interactive view could not start. Check the browser console and use VS Code Live Server. The static map remains available below.');
    }
  }
  document.addEventListener('DOMContentLoaded', renderStudioMap);
})();
