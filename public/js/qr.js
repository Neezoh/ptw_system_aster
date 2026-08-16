const labels = document.getElementById('labelGrid');
const ptwNumber = decodeURIComponent(window.location.pathname.split('/').slice(-1)[0] || '');

const renderLabel = (record) => {
  const card = document.createElement('article');
  card.className = 'label-card';
  card.innerHTML = `
    <div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
        <h3>${record.ptw_number}</h3>
        <span class="type-badge ${record.permit_type === 'Hot' ? 'type-hot' : 'type-cold'}">${record.permit_type}</span>
      </div>
      <div class="label-meta">${record.location}</div>
    </div>
    <canvas id="qr-${record.ptw_number}"></canvas>
    <div class="label-meta">Issued: ${record.date_issued}<br />Status: ${record.status}</div>
  `;
  labels.appendChild(card);
  QRCode.toCanvas(document.getElementById(`qr-${record.ptw_number}`), `${window.location.origin}/ptw/${encodeURIComponent(record.ptw_number)}`, { width: 150, margin: 1 }, (error) => {
    if (error) console.error('QR error', error);
  });
};

const loadRecords = async () => {
  try {
    const response = await fetch('/api/ptw?status=Open&limit=50');
    const payload = await response.json();
    const records = payload.data || [];
    if (ptwNumber) {
      const single = records.find((record) => record.ptw_number === ptwNumber) || await (await fetch(`/api/ptw/${encodeURIComponent(ptwNumber)}`)).json();
      if (single && single.success !== false) {
        renderLabel(single.data || single);
      }
      return;
    }
    records.forEach(renderLabel);
  } catch (error) {
    labels.innerHTML = '<div class="label-card"><h3>No label available</h3></div>';
  }
};

loadRecords();
