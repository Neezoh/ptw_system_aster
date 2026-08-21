const searchInput = document.getElementById('ptwSearch');
const suggestionsList = document.getElementById('suggestions');
const resultsBody = document.getElementById('resultsBody');
const resultMeta = document.getElementById('resultMeta');
const searchBtn = document.getElementById('searchBtn');
const advancedPanel = document.getElementById('advancedPanel');
const toggleAdvancedButton = document.getElementById('toggleAdvanced');

const filterLocation = document.getElementById('filterLocation');
const filterType = document.getElementById('filterType');
const filterStatus = document.getElementById('filterStatus');
const filterFrom = document.getElementById('filterFrom');
const filterTo = document.getElementById('filterTo');
const filterWorkLeader = document.getElementById('filterWorkLeader');
const filterAuthority = document.getElementById('filterAuthority');

const getStatusClass = (status) => ({
  Open: 'status-open',
  Extended: 'status-extended',
  Returned: 'status-extended',
  Suspended: 'status-suspended',
  Closed: 'status-closed'
}[status] || 'status-closed');

const getTypeClass = (type) => (type === 'Hot' ? 'type-hot' : 'type-cold');

const renderResults = (records) => {
  if (!records.length) {
    resultsBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          <div class="empty-copy">
            <strong>No PTW records found.</strong>
            <span>No PTW found for the search criteria.</span>
          </div>
        </td>
      </tr>
    `;
    resultMeta.textContent = '0 records';
    return;
  }

  resultMeta.textContent = `${records.length} records`;

  resultsBody.innerHTML = records.map((record) => `
    <tr data-ptw="${record.ptw_number}">
      <td><strong>${record.ptw_number}</strong></td>
      <td>${record.location}</td>
      <td><span class="type-badge ${getTypeClass(record.permit_type)}">${record.permit_type}</span></td>
      <td>${record.permit_applicant_name}</td>
      <td>${record.date_issued}</td>
      <td><span class="status-badge ${getStatusClass(record.status)}">${record.status}</span></td>
    </tr>
  `).join('');

  resultsBody.querySelectorAll('tr[data-ptw]').forEach((row) => {
    row.addEventListener('click', () => {
      const ptwNumber = row.dataset.ptw;
      window.location.href = `/ptw/${encodeURIComponent(ptwNumber)}`;
    });
  });
};

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
};

const loadLookups = async () => {
  try {
    const response = await fetchJson('/api/lookups');
    const { locations = [], personnel = [] } = response.data || {};

    filterLocation.innerHTML = '<option value="">All</option>' + locations.map((name) => `<option value="${name}">${name}</option>`).join('');

    const leaders = [...new Set(personnel.filter((p) => p.role === 'WL').map((p) => p.name))].sort();
    const authorities = [...new Set(personnel.filter((p) => p.role === 'AA' || p.role === 'AAR').map((p) => p.name))].sort();

    filterWorkLeader.innerHTML = '<option value="">All</option>' + leaders.map((name) => `<option value="${name}">${name}</option>`).join('');
    filterAuthority.innerHTML = '<option value="">All</option>' + authorities.map((name) => `<option value="${name}">${name}</option>`).join('');
  } catch (error) {
    console.error('Lookup loading failed', error);
  }
};

const buildQuery = () => {
  const params = new URLSearchParams();
  const qValue = searchInput.value.trim();
  if (qValue) params.set('q', qValue);
  if (filterStatus.value) params.set('status', filterStatus.value);
  if (filterLocation.value) params.set('location', filterLocation.value);
  if (filterType.value) params.set('type', filterType.value);
  if (filterFrom.value) params.set('from', filterFrom.value);
  if (filterTo.value) params.set('to', filterTo.value);
  if (filterWorkLeader.value) params.set('workLeader', filterWorkLeader.value);
  if (filterAuthority.value) params.set('authority', filterAuthority.value);
  return params;
};

const loadPTWResults = async () => {
  const params = buildQuery();
  const qs = params.toString();
  const url = qs ? `/api/ptw?${qs}` : '/api/ptw';

  try {
    const response = await fetchJson(url);
    renderResults(response.data || []);
  } catch (error) {
    console.error('PTW fetch failed', error);
    resultsBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          <div class="empty-copy">
            <strong>No PTW records found.</strong>
            <span>No data is currently available.</span>
          </div>
        </td>
      </tr>
    `;
  }
};

const updateSuggestions = async (rawValue) => {
  const value = rawValue.trim();
  if (value.length < 2) {
    suggestionsList.innerHTML = '';
    suggestionsList.classList.remove('visible');
    return;
  }

  try {
    const response = await fetchJson(`/api/ptw/suggest?q=${encodeURIComponent(value)}`);
    const items = response.data || [];

    if (!items.length) {
      suggestionsList.innerHTML = '';
      suggestionsList.classList.remove('visible');
      return;
    }

    suggestionsList.innerHTML = items.map((item) => `
      <li data-ptw="${item.ptw_number}">${item.ptw_number} — ${item.location}</li>
    `).join('');

    suggestionsList.classList.add('visible');
    suggestionsList.querySelectorAll('li').forEach((item) => {
      item.addEventListener('click', () => {
        const selected = item.dataset.ptw;
        searchInput.value = selected;
        suggestionsList.classList.remove('visible');
        window.location.href = `/ptw/${encodeURIComponent(selected)}`;
      });
    });
  } catch (error) {
    suggestionsList.classList.remove('visible');
  }
};

searchInput.addEventListener('input', (event) => {
  updateSuggestions(event.target.value);
});

searchBtn.addEventListener('click', () => {
  const value = searchInput.value.trim();
  if (!value) {
    loadPTWResults();
    return;
  }

  const match = /^PTW-\d{4}-\d{5}$/.test(value);
  if (match) {
    window.location.href = `/ptw/${encodeURIComponent(value)}`;
    return;
  }

  loadPTWResults();
});

searchInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    searchBtn.click();
  }
});

[filterStatus, filterLocation, filterType, filterFrom, filterTo, filterWorkLeader, filterAuthority].forEach((element) => {
  element.addEventListener('change', loadPTWResults);
});

toggleAdvancedButton.addEventListener('click', () => {
  const collapsed = advancedPanel.classList.toggle('collapsed');
  advancedPanel.setAttribute('aria-expanded', String(!collapsed));
});

loadLookups();
loadPTWResults();
