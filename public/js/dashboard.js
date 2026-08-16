const statsGrid = document.getElementById('statsGrid');
const recentTable = document.getElementById('recentTable');
const longOpenTable = document.getElementById('longOpenTable');
const sessionBadge = document.getElementById('sessionBadge');

const updateSessionBadge = async () => {
  if (!sessionBadge) return;

  try {
    const response = await fetch('/api/session');
    const payload = await response.json();
    const isLoggedIn = payload?.success && payload?.data?.isLoggedIn;

    sessionBadge.textContent = isLoggedIn ? 'Logged in as Admin' : 'Guest Access';
    sessionBadge.classList.toggle('admin', isLoggedIn);
    sessionBadge.classList.toggle('guest', !isLoggedIn);
  } catch (error) {
    sessionBadge.textContent = 'Guest Access';
    sessionBadge.classList.remove('admin');
    sessionBadge.classList.add('guest');
  }
};

const renderStatCards = (summary) => {
  const cards = [
    { label: 'Total PTW', value: summary.total_ptw || 0 },
    { label: 'Open', value: summary.open_ptw || 0 },
    { label: 'Closed', value: summary.closed_ptw || 0 },
    { label: 'Suspended', value: summary.suspended_ptw || 0 },
    { label: 'Extended', value: summary.extended_ptw || 0 },
    { label: 'Hot Permits Active', value: summary.hot_active || 0 },
    { label: 'Cold Permits Active', value: summary.cold_active || 0 }
  ];

  statsGrid.innerHTML = cards.map((card) => `
    <article class="stat-card">
      <h4>${card.label}</h4>
      <strong>${card.value}</strong>
    </article>
  `).join('');
};

const renderRecent = (items) => {
  if (!items.length) {
    recentTable.innerHTML = '<tr><td colspan="2">No recent permits</td></tr>';
    return;
  }

  recentTable.innerHTML = items.map((item) => `
    <tr onclick="window.location.href='/ptw/${encodeURIComponent(item.ptw_number)}'">
      <td>${item.ptw_number}</td>
      <td><span class="status-badge ${({ Open: 'status-open', Extended: 'status-extended', Suspended: 'status-suspended', Closed: 'status-closed' }[item.status] || 'status-closed')}">${item.status}</span></td>
    </tr>
  `).join('');
};

const renderLongOpen = (items) => {
  if (!items.length) {
    longOpenTable.innerHTML = '<tr><td colspan="2">No long-open permits</td></tr>';
    return;
  }

  longOpenTable.innerHTML = items.map((item) => {
    const days = Math.max(0, Math.round((Date.now() - new Date(item.date_issued).getTime()) / 86400000));
    return `
      <tr onclick="window.location.href='/ptw/${encodeURIComponent(item.ptw_number)}'">
        <td>${item.ptw_number}</td>
        <td>${days}d</td>
      </tr>
    `;
  }).join('');
};

const loadDashboard = async () => {
  try {
    const response = await fetch('/api/stats');
    const payload = await response.json();
    if (!payload.success) throw new Error(payload.error || 'Failed to load dashboard');

    const { summary = {}, recent = [], longOpen = [] } = payload.data || {};
    renderStatCards(summary);
    renderRecent(recent);
    renderLongOpen(longOpen);
  } catch (error) {
    console.error(error);
    statsGrid.innerHTML = '<div class="stat-card"><h4>Dashboard</h4><strong>Unavailable</strong></div>';
  }
};

loadDashboard();
updateSessionBadge();
