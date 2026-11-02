
// Charts 4 and 6: Vega-Lite map implementations using preprojected GeoJSON
// and the same display data as the approved SVG versions.
// The SVGs are hidden only after each Vega chart has actually rendered.
document.addEventListener('DOMContentLoaded', async () => {
  if (typeof window.vegaEmbed !== 'function') return;
  const maps = [
    {script:'state-circle-vega-spec', target:'#state-circle-map-vega', state:'vega-map4-ready'},
    {script:'state-choropleth-vega-spec', target:'#state-choropleth-vega', state:'vega-map6-ready'},
  ];
  for (const map of maps) {
    try {
      const contents = document.getElementById(map.script)?.textContent;
      if (!contents) continue;
      const spec = JSON.parse(contents);
      await window.vegaEmbed(map.target, spec, {actions:false, renderer:'svg'});
      // Vega's SVG sometimes has fixed intrinsic dimensions but no viewBox.
      // A viewBox makes its map, circles and labels all shrink together.
      const mapSvg = document.querySelector(`${map.target} .vega-embed svg`);
      if (!mapSvg) throw new Error('Map SVG was not created');
      if (!mapSvg.hasAttribute('viewBox')) {
        const sourceWidth = Number(mapSvg.getAttribute('width')) || Number(spec.width) || 630;
        const sourceHeight = Number(mapSvg.getAttribute('height')) || Number(spec.height) || 480;
        mapSvg.setAttribute('viewBox', `0 0 ${sourceWidth} ${sourceHeight}`);
      }
      mapSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      mapSvg.style.width = '100%';
      mapSvg.style.height = 'auto';
      mapSvg.style.maxWidth = '100%';
      document.body.classList.add(map.state);
    } catch (error) {
      console.warn('Vega-Lite map could not be rendered; displaying original fallback.',error);
    }
  }
  scheduleFamilyChartAlignment();
});

document.addEventListener('DOMContentLoaded', async () => {
  // Build exact 100-cell fallback waffle
  const fallback = document.getElementById('waffle-fallback');
  if (fallback && !fallback.children.length) {
    for (let i = 1; i <= 100; i += 1) {
      const tile = document.createElement('span');
      tile.className = 'tile';
      tile.style.setProperty('--tile', i <= 26 ? '#5066B3' : '#DCE6F8');
      fallback.appendChild(tile);
    }
  }

  try {
    const waffleSource = document.getElementById('waffle-spec')?.textContent;
    if (waffleSource && typeof window.vegaEmbed === 'function') {
      await window.vegaEmbed('#waffle', JSON.parse(waffleSource), {actions:false, renderer:'svg'});
      document.body.classList.add('vega-waffle-ready');
    }
  } catch (err) {
    console.warn('Waffle chart could not be embedded.', err);
  }

  try {
    const barSource = document.getElementById('family-bar-spec')?.textContent;
    if (barSource && typeof window.vegaEmbed === 'function') {
      await window.vegaEmbed('#family-bars', JSON.parse(barSource), {actions:false, renderer:'svg'});
      document.body.classList.add('vega-bars-ready');
      scheduleFamilyChartAlignment();
    }
  } catch (err) {
    console.warn('Bar chart could not be embedded.', err);
  }
});

// Chart 3: conservation-status heatmap. A CSS fallback remains available offline.
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const source = document.getElementById('family-heatmap-spec')?.textContent;
    if (source && typeof window.vegaEmbed === 'function') {
      await window.vegaEmbed('#family-heatmap', JSON.parse(source), {actions:false, renderer:'svg'});
      document.body.classList.add('vega-heatmap-ready');
      scheduleFamilyChartAlignment();
    }
  } catch (err) {
    console.warn('Heatmap Vega-Lite unavailable; CSS fallback is shown.', err);
  }
});



// Chart 5: state-by-state conservation severity. CSS fallback remains available offline.
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const source = document.getElementById('state-severity-spec')?.textContent;
    if (source && typeof window.vegaEmbed === 'function') {
      await window.vegaEmbed('#state-severity', JSON.parse(source), {actions:false, renderer:'svg'});
      document.body.classList.add('vega-state-severity-ready');
      scheduleFamilyChartAlignment();
    }
  } catch (err) {
    console.warn('State severity chart could not be embedded.', err);
  }
});

// Make the paired charts share their full *natural* height, without clipping
// the heatmap legend or leaving either visual overflowing its rounded card.
// This affects only Charts 2 and 3; the first chart is untouched.
function alignFamilyChartCards() {
  const sections = Array.from(document.querySelectorAll('.chapter--paired'));
  sections.forEach(section => {
    const cards = Array.from(section.querySelectorAll('.paired-panel .chart-card'));
    if (cards.length < 2) return;
    cards.forEach(card => { card.style.minHeight = ''; });
    if (window.innerWidth < 721) return;
    const height = Math.ceil(Math.max(...cards.map(card => card.getBoundingClientRect().height)));
    cards.forEach(card => { card.style.minHeight = height + 'px'; });
  });
}

function scheduleFamilyChartAlignment() {
  window.requestAnimationFrame(alignFamilyChartCards);
}

window.addEventListener('load', scheduleFamilyChartAlignment);
window.addEventListener('resize', scheduleFamilyChartAlignment);
document.addEventListener('DOMContentLoaded', scheduleFamilyChartAlignment);
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(scheduleFamilyChartAlignment);
}



// Chart 4: Inline SVG proportional spike map.
// Native SVG title tooltips, hover highlighting and keyboard focus work offline.


// Chart 4: reference-style custom tooltip for the proportional circle map.
// The map data is embedded in index.html, so this also works when index.html is opened locally.
document.addEventListener('DOMContentLoaded', () => {
  const map = document.getElementById('state-circle-map');
  const dataScript = document.getElementById('circle-map-tooltip-data');
  if (!map || !dataScript || document.body.classList.contains('vega-map4-ready')) return;
  let data;
  try { data = JSON.parse(dataScript.textContent); }
  catch (error) { console.warn('Circle map tooltip data unavailable.', error); return; }

  const popup = document.createElement('div');
  // Reuse the same visual styling and table classes as Vega-Lite's tooltip.
  popup.className = 'vg-tooltip circle-info-tooltip';
  popup.id = 'circle-info-tooltip';
  popup.setAttribute('role', 'tooltip');
  popup.hidden = true;
  // Match Chart 5's built-in Vega tooltip: plain grey keys and dark values.
  popup.innerHTML = `
    <table><tbody>
      <tr><td class="key">State / territory</td><td class="value circle-info-tooltip__state"></td></tr>
      <tr><td class="key">Listings</td><td class="value circle-info-tooltip__count"></td></tr>
      <tr><td class="key">Vulnerable</td><td class="value" data-status="Vulnerable"></td></tr>
      <tr><td class="key">Endangered</td><td class="value" data-status="Endangered"></td></tr>
      <tr><td class="key">Critically endangered</td><td class="value" data-status="Critically Endangered"></td></tr>
    </tbody></table>
  `;
  document.body.appendChild(popup);

  function placeTooltip(x, y) {
    const margin = 12;
    const offset = 18;
    const width = popup.offsetWidth;
    const height = popup.offsetHeight;
    const left = x + offset + width <= window.innerWidth - margin
      ? x + offset
      : x - width - offset;
    const top = Math.max(margin, Math.min(y - 45, window.innerHeight - height - margin));
    popup.style.left = Math.max(margin, left) + 'px';
    popup.style.top = top + 'px';
  }

  function showTooltip(group, x, y) {
    const name = group.dataset.state;
    const entry = data[name];
    if (!entry) return;
    popup.querySelector('.circle-info-tooltip__state').textContent = name;
    popup.querySelector('.circle-info-tooltip__count').textContent = entry.total;
    popup.querySelectorAll('[data-status]').forEach(node => {
      node.textContent = entry.statuses[node.dataset.status] ?? 0;
    });
    popup.hidden = false;
    group.setAttribute('aria-describedby', 'circle-info-tooltip');
    placeTooltip(x,y);
  }
  function hideTooltip(group) {
    popup.hidden = true;
    group?.removeAttribute('aria-describedby');
  }

  map.querySelectorAll('.circle-group').forEach(group => {
    const label = group.getAttribute('aria-label') || '';
    const name = label.split(':')[0].trim();
    if (!data[name]) return;
    group.dataset.state = name;
    group.addEventListener('pointerenter', event => showTooltip(group,event.clientX,event.clientY));
    group.addEventListener('pointermove', event => { if (!popup.hidden) placeTooltip(event.clientX,event.clientY); });
    group.addEventListener('pointerleave', () => hideTooltip(group));
    group.addEventListener('focus', () => {
      const circle = group.querySelector('circle');
      const bounds = circle ? circle.getBoundingClientRect() : group.getBoundingClientRect();
      showTooltip(group,bounds.right,bounds.top+bounds.height/2);
    });
    group.addEventListener('blur', () => hideTooltip(group));
    group.addEventListener('keydown', event => { if (event.key === 'Escape') hideTooltip(group); });
  });
  window.addEventListener('scroll', () => { popup.hidden = true; }, {passive:true});
});

// Chart 6: small hover panel, matching the simple value tooltips used elsewhere.
document.addEventListener('DOMContentLoaded', () => {
  const map = document.getElementById('c6-map-wrap');
  if (!map) return;
  const values = {"Western Australia": {"state": "Western Australia", "abbr": "WA", "extinct": 20, "total": 68, "share": 29.4}, "Northern Territory": {"state": "Northern Territory", "abbr": "NT", "extinct": 12, "total": 45, "share": 26.7}, "South Australia": {"state": "South Australia", "abbr": "SA", "extinct": 21, "total": 61, "share": 34.4}, "Queensland": {"state": "Queensland", "abbr": "QLD", "extinct": 15, "total": 64, "share": 23.4}, "New South Wales": {"state": "New South Wales", "abbr": "NSW", "extinct": 14, "total": 57, "share": 24.6}, "Victoria": {"state": "Victoria", "abbr": "VIC", "extinct": 10, "total": 38, "share": 26.3}, "Tasmania": {"state": "Tasmania", "abbr": "TAS", "extinct": 1, "total": 12, "share": 8.3}, "Australian Capital Territory": {"state": "Australian Capital Territory", "abbr": "ACT", "extinct": 0, "total": 12, "share": 0.0}};
  const tooltip = document.createElement('div');
  tooltip.className = 'c6-tooltip';
  tooltip.setAttribute('role','tooltip');
  tooltip.hidden = true;
  tooltip.innerHTML = '<table><tbody>' +
    '<tr><td>State / territory</td><td data-field="state"></td></tr>' +
    '<tr><td>Extinct listings</td><td data-field="extinct"></td></tr>' +
    '<tr><td>Total listings</td><td data-field="total"></td></tr>' +
    '<tr><td>Extinct share</td><td data-field="share"></td></tr>' +
    '</tbody></table>';
  document.body.appendChild(tooltip);
  const set = (name, val) => tooltip.querySelector('[data-field="'+name+'"]').textContent = val;
  function position(x,y) {
    const w = tooltip.offsetWidth, h = tooltip.offsetHeight;
    const left = x+15+w < window.innerWidth-12 ? x+15 : x-15-w;
    tooltip.style.left = Math.max(10,left)+'px';
    tooltip.style.top = Math.max(10, Math.min(window.innerHeight-h-10,y-20))+'px';
  }
  function show(el,x,y) {
    const rec = values[el.getAttribute('data-state')];
    if (!rec) return;
    set('state',rec.state); set('extinct',rec.extinct);
    set('total',rec.total); set('share',rec.share.toFixed(1)+'%');
    tooltip.hidden = false;
    position(x,y);
  }
  map.querySelectorAll('.c6-state').forEach(el => {
    // Suppress native black browser tooltip; information remains in aria-label.
    const label = el.querySelector('title'); if (label) label.remove();
    el.addEventListener('pointerenter',e=>show(el,e.clientX,e.clientY));
    el.addEventListener('pointermove',e=>{if (!tooltip.hidden)position(e.clientX,e.clientY)});
    el.addEventListener('pointerleave',()=>{tooltip.hidden=true});
    el.addEventListener('focus',()=>{const b=el.getBoundingClientRect();show(el,b.right,b.top+b.height/2)});
    el.addEventListener('blur',()=>{tooltip.hidden=true});
  });
  window.addEventListener('scroll',()=>{tooltip.hidden=true},{passive:true});
});

// Chart 7: seven major mammal threats assessed in Woinarski et al. (2015).
// The separate 138-species study is not combined with the EPBC state data.
document.addEventListener('DOMContentLoaded', async () => {
  const el = document.getElementById('native-threats-lollipop');
  const specNode = document.getElementById('native-threats-spec');
  if (!el || !specNode || typeof window.vegaEmbed !== 'function') return;
  try {
    const spec = JSON.parse(specNode.textContent);
    const result = await window.vegaEmbed('#native-threats-lollipop', spec, {actions:false, renderer:'svg'});
    // An empty Vega chart can still display axes. Only hide the HTML fallback
    // when the seven lollipop endpoints have actually appeared in the SVG.
    const svg = el.querySelector('.vega-embed svg');
    const endpoints = svg ? svg.querySelectorAll('.mark-symbol path, .mark-symbol circle') : [];
    if (endpoints.length >= 7) {
      document.body.classList.add('vega-threats-ready');
    } else {
      console.warn('Threat chart has no visible endpoints; retaining fallback chart.');
    }
  } catch (error) {
    console.warn('Threat lollipop Vega-Lite chart failed; retaining HTML fallback.', error);
  }
});


// Chart 8: official TSX 2025 data as a period-change waterfall; SVG fallback remains available offline.
document.addEventListener('DOMContentLoaded', async () => {
  if (typeof window.vegaEmbed !== 'function') return;
  const specText = document.getElementById('mammal-annual-trend-spec')?.textContent;
  if (!specText) return;
  try {
    const spec = JSON.parse(specText);
    const el = document.getElementById('mammal-annual-trend');
    const available = el?.getBoundingClientRect().width || 560;
    spec.width = Math.max(180, Math.min(570, Math.floor(available - 70)));
    await window.vegaEmbed('#mammal-annual-trend', spec, {actions:false,renderer:'svg'});
    const svg = document.querySelector('#mammal-annual-trend .vega-embed svg');
    if (!svg || svg.querySelectorAll('.mark-rect rect').length < 8) throw new Error('Waterfall bars not visible');
    if (!svg.getAttribute('viewBox')) {
      const width = parseFloat(svg.getAttribute('width')) || 600;
      const height = parseFloat(svg.getAttribute('height')) || 380;
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    }
    document.body.classList.add('vega-c8-annual-ready');
  } catch (error) { console.warn('Chart 8 waterfall fallback active:', error); }
});


// Chart 10: advanced connected dot plot (Tulloch et al. 2023, Table 1).
// Keep the readable fallback until Vega has rendered its dots and connecting lines.
document.addEventListener('DOMContentLoaded', async () => {
  const el = document.getElementById('mammals-management-connected');
  const node = document.getElementById('chart11-connected-spec');
  if (!el || !node || typeof window.vegaEmbed !== 'function') return;
  try {
    const spec = JSON.parse(node.textContent);
    const available = el.getBoundingClientRect().width;
    spec.width = Math.max(220, Math.min(365, Math.floor(available - 115)));
    await window.vegaEmbed('#mammals-management-connected', spec, {actions:false, renderer:'svg'});
    const svg = el.querySelector('.vega-embed svg');
    if (!svg || !svg.querySelectorAll('.mark-symbol path').length)
      throw new Error('Connected dot marks are missing');
    if (!svg.hasAttribute('viewBox')) {
      const width = parseFloat(svg.getAttribute('width')) || 560;
      const height = parseFloat(svg.getAttribute('height')) || 320;
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    }
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    document.body.classList.add('vega-c11-connected-ready');
  } catch(error) {
    console.warn('Connected dot chart unavailable; keeping accessible SVG fallback.', error);
  }
});

// Chart 10: native mammal taxa recorded across cat-free islands and fenced havens.
document.addEventListener('DOMContentLoaded', async () => {
  const el=document.getElementById('refuge-type-butterfly');
  const node=document.getElementById('chart10-refuge-butterfly-spec');
  if(!el || !node || typeof window.vegaEmbed!=='function') return;
  try {
    const spec=JSON.parse(node.textContent);
    const available=el.getBoundingClientRect().width;
    // Match the actual space available in the aligned left-hand card.
    spec.width=Math.max(165,Math.min(330,Math.floor(available-178)));
    await window.vegaEmbed('#refuge-type-butterfly',spec,{actions:false,renderer:'svg'});
    const svg=el.querySelector('.vega-embed svg');
    if(!svg || !svg.querySelectorAll('.mark-rect path, .mark-rect rect').length)
      throw new Error('Butterfly bars did not render');
    if(!svg.hasAttribute('viewBox')) {
      const width=parseFloat(svg.getAttribute('width'))||650;
      const height=parseFloat(svg.getAttribute('height'))||400;
      svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
    }
    svg.setAttribute('preserveAspectRatio','xMidYMid meet');
    document.body.classList.add('vega-c10-refuge-ready');
  } catch(err){console.warn('Refuge butterfly fallback active:',err);}
});
