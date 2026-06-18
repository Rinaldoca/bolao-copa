/* ─── Times da Copa 2026 ─────────────────────────────────────────────────── */
const WC2026_TEAMS = [
  {f:'🇲🇽',n:'México'},      {f:'🇿🇦',n:'África do Sul'}, {f:'🇰🇷',n:'Coreia do Sul'},{f:'🇨🇿',n:'Tchéquia'},
  {f:'🇨🇦',n:'Canadá'},      {f:'🇧🇦',n:'Bósnia'},         {f:'🇶🇦',n:'Catar'},         {f:'🇨🇭',n:'Suíça'},
  {f:'🇧🇷',n:'Brasil'},      {f:'🇲🇦',n:'Marrocos'},       {f:'🇭🇹',n:'Haiti'},         {f:'🏴󠁧󠁢󠁳󠁣󠁴󠁿',n:'Escócia'},
  {f:'🇺🇸',n:'EUA'},         {f:'🇵🇾',n:'Paraguai'},       {f:'🇦🇺',n:'Austrália'},     {f:'🇹🇷',n:'Turquia'},
  {f:'🇩🇪',n:'Alemanha'},    {f:'🇨🇼',n:'Curaçao'},        {f:'🇨🇮',n:'Costa do Marfim'},{f:'🇪🇨',n:'Equador'},
  {f:'🇳🇱',n:'Holanda'},     {f:'🇯🇵',n:'Japão'},          {f:'🇸🇪',n:'Suécia'},        {f:'🇹🇳',n:'Tunísia'},
  {f:'🇧🇪',n:'Bélgica'},     {f:'🇪🇬',n:'Egito'},          {f:'🇮🇷',n:'Irã'},           {f:'🇳🇿',n:'Nova Zelândia'},
  {f:'🇪🇸',n:'Espanha'},     {f:'🇨🇻',n:'Cabo Verde'},     {f:'🇸🇦',n:'Arábia Saudita'},{f:'🇺🇾',n:'Uruguai'},
  {f:'🇫🇷',n:'França'},      {f:'🇸🇳',n:'Senegal'},        {f:'🇮🇶',n:'Iraque'},        {f:'🇳🇴',n:'Noruega'},
  {f:'🇦🇷',n:'Argentina'},   {f:'🇩🇿',n:'Argélia'},        {f:'🇦🇹',n:'Áustria'},       {f:'🇯🇴',n:'Jordânia'},
  {f:'🇵🇹',n:'Portugal'},    {f:'🇨🇩',n:'Congo RD'},       {f:'🇺🇿',n:'Uzbequistão'},   {f:'🇨🇴',n:'Colômbia'},
  {f:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',n:'Inglaterra'},{f:'🇭🇷',n:'Croácia'},       {f:'🇬🇭',n:'Gana'},          {f:'🇵🇦',n:'Panamá'},
].sort((a, b) => a.n.localeCompare(b.n, 'pt'));

const _flagMap = Object.fromEntries(WC2026_TEAMS.map(t => [t.n, t.f]));
function flag(name) { return _flagMap[name] ? `<span class="team-flag">${_flagMap[name]}</span>` : ''; }

let _champPickerSelected = null;

function renderChampionPicker(currentValue) {
  _champPickerSelected = currentValue || null;
  const team = currentValue ? WC2026_TEAMS.find(t => t.n === currentValue) : null;
  return `
    <div class="cp-wrap" id="cp-wrap">
      <button type="button" class="cp-btn" id="cp-btn" onclick="cpToggle(event)">
        <span class="cp-value" id="cp-value">
          ${team ? `<span class="cp-flag">${team.f}</span><span>${tTeam(team.n)}</span>` : `<span class="cp-placeholder">${t('cp_placeholder')}</span>`}
        </span>
        <span class="cp-arrow" id="cp-arrow">▾</span>
      </button>
      <div class="cp-dropdown hidden" id="cp-dropdown">
        <div class="cp-search-wrap">
          <input class="cp-search" id="cp-search" type="text" placeholder="${t('cp_search')}" oninput="cpFilter(this.value)" autocomplete="off">
        </div>
        <div class="cp-list" id="cp-list">
          ${WC2026_TEAMS.map(t => `
            <div class="cp-item ${currentValue===t.n?'cp-selected':''}" data-name="${t.n}" data-label="${tTeam(t.n).replace(/"/g,'&quot;')}" onclick="cpSelect('${t.n.replace(/'/g,"&#39;")}')">
              <span class="cp-flag">${t.f}</span>
              <span class="cp-name">${tTeam(t.n)}</span>
              ${currentValue===t.n?'<span class="cp-check">✓</span>':''}
            </div>`).join('')}
        </div>
      </div>
    </div>`;
}

function cpToggle(e) {
  e.stopPropagation();
  const dd = document.getElementById('cp-dropdown');
  const arrow = document.getElementById('cp-arrow');
  const isOpen = !dd.classList.contains('hidden');
  dd.classList.toggle('hidden');
  arrow.style.transform = isOpen ? '' : 'rotate(180deg)';
  if (!isOpen) setTimeout(() => document.getElementById('cp-search')?.focus(), 50);
}

function cpFilter(q) {
  const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  const lq = norm(q);
  document.querySelectorAll('.cp-item').forEach(el => {
    const matches = norm(el.dataset.name).includes(lq) || norm(el.dataset.label).includes(lq);
    el.style.display = matches ? '' : 'none';
  });
}

function cpSelect(name) {
  _champPickerSelected = name;
  const team = WC2026_TEAMS.find(t => t.n === name);
  const valueEl = document.getElementById('cp-value');
  if (valueEl && team) valueEl.innerHTML = `<span class="cp-flag">${team.f}</span><span>${tTeam(team.n)}</span>`;
  document.querySelectorAll('.cp-item').forEach(el => {
    const sel = el.dataset.name === name;
    el.classList.toggle('cp-selected', sel);
    const existing = el.querySelector('.cp-check');
    if (existing) existing.remove();
    if (sel) el.insertAdjacentHTML('beforeend', '<span class="cp-check">✓</span>');
  });
  const dd = document.getElementById('cp-dropdown');
  dd?.classList.add('hidden');
  document.getElementById('cp-arrow').style.transform = '';
}

document.addEventListener('click', e => {
  if (!e.target.closest('#cp-wrap')) {
    document.getElementById('cp-dropdown')?.classList.add('hidden');
    const arrow = document.getElementById('cp-arrow');
    if (arrow) arrow.style.transform = '';
  }
  ['a','b'].forEach(side => {
    if (!e.target.closest(`#pp-wrap-${side}`)) {
      document.getElementById(`pp-dropdown-${side}`)?.classList.add('hidden');
      const arrow = document.getElementById(`pp-arrow-${side}`);
      if (arrow) arrow.style.transform = '';
    }
  });
});

