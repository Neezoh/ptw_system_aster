const records = [
  {
    ptwNumber: 'PTW-2026-00142',
    location: 'Offshore Platform A',
    permitType: 'Hot',
    applicant: 'Rahman Hadi',
    dateIssued: '2026-08-10',
    status: 'Open',
    jhaNumber: 'JHA-2026-00087',
    workLeader: 'Farid Ismail',
    authority: 'HSE Manager, Khairul',
    rep: 'Shahrul Nizam',
    description:
      'Pipe spool modification and cutting of support brackets at the north manifold deck before lifting operation. Full exclusion zone to be established and gas test performed.',
    remark: 'Hot work permit valid for 12 hours with continuous gas monitoring.'
  },
  {
    ptwNumber: 'PTW-2026-00131',
    location: 'Tank Farm 2',
    permitType: 'Cold',
    applicant: 'Aina Zulkifli',
    dateIssued: '2026-08-08',
    status: 'Extended',
    jhaNumber: 'JHA-2026-00062',
    workLeader: 'Ilham Zain',
    authority: 'Supervisor, Zaim',
    rep: 'Nadia Binti',
    description:
      'Inspection and valve replacement for the tank transfer manifold isolation segment. Access platform to remain secure during work.',
    remark: 'Extension granted due to weather delay and inspection hold.'
  },
  {
    ptwNumber: 'PTW-2026-00118',
    location: 'Kertih',
    permitType: 'Hot',
    applicant: 'Jalaludin Omar',
    dateIssued: '2026-08-06',
    status: 'Suspended',
    jhaNumber: 'JHA-2026-00041',
    workLeader: 'Ahmad Rashid',
    authority: 'HSE Manager, Khairul',
    rep: 'Rafiq Irfan',
    description:
      'Grinding and surface preparation on the flare knockout drum casing before maintenance painting. Suspension due to high wind gusts.',
    remark: 'Suspended due to adverse weather and incomplete static grounding check.'
  },
  {
    ptwNumber: 'PTW-2026-00105',
    location: 'Gebeng',
    permitType: 'Cold',
    applicant: 'Nurin Sulaiman',
    dateIssued: '2026-08-03',
    status: 'Closed',
    jhaNumber: 'JHA-2026-00015',
    workLeader: 'Shahir Kadir',
    authority: 'AA-1, Shahrul',
    rep: 'Hafiz Salleh',
    description:
      'Scaffolding erection and dismantling for inspection of overhead pipe rack supports. Work completed with permit closure signed off.',
    remark: 'Closed after successful inspection and scaffold dismantling completed.'
  },
  {
    ptwNumber: 'PTW-2026-00092',
    location: 'Jetty 3',
    permitType: 'Hot',
    applicant: 'Azri Nasrul',
    dateIssued: '2026-08-01',
    status: 'Open',
    jhaNumber: 'JHA-2026-00003',
    workLeader: 'Adli Hassan',
    authority: 'Supervisor, Zaim',
    rep: 'Musa Fadzli',
    description:
      'Cutting and welding on temporary barrier support fittings near the loading jetty. Fire watch assigned throughout the task.',
    remark: 'Hot work in progress with continuous fire watch and gas checks.'
  },
  {
    ptwNumber: 'PTW-2026-00081',
    location: 'Utility Block',
    permitType: 'Cold',
    applicant: 'Syafiq Rahman',
    dateIssued: '2026-07-29',
    status: 'Open',
    jhaNumber: 'JHA-2026-00096',
    workLeader: 'Farid Ismail',
    authority: 'AA-1, Shahrul',
    rep: 'Azwan Kadir',
    description:
      'Lifting and inspection of utility piping support framework for preventive maintenance. Access barricade set up around work area.',
    remark: 'Permit remains active with routine inspection checkpoints scheduled.'
  }
];

const searchInput = document.getElementById('ptwSearch');
const suggestionsList = document.getElementById('suggestions');
const resultsBody = document.getElementById('resultsBody');
const toggleAdvancedButton = document.getElementById('toggleAdvanced');
const advancedPanel = document.getElementById('advancedPanel');

function getStatusClass(status) {
  const map = {
    Open: 'status-open',
    Extended: 'status-extended',
    Suspended: 'status-suspended',
    Closed: 'status-closed'
  };
  return map[status] || 'status-closed';
}

function getTypeClass(type) {
  return type === 'Hot' ? 'type-hot' : 'type-cold';
}

function renderRows(items) {
  if (!items.length) {
    resultsBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          <div class="empty-copy">
            <strong>Tiada PTW dijumpai.</strong>
            <span>No PTW found for the search criteria.</span>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  resultsBody.innerHTML = items
    .map(
      (item) => `
        <tr data-ptw="${item.ptwNumber}">
          <td><strong>${item.ptwNumber}</strong></td>
          <td>${item.location}</td>
          <td><span class="type-badge ${getTypeClass(item.permitType)}">${item.permitType}</span></td>
          <td>${item.applicant}</td>
          <td>${item.dateIssued}</td>
          <td><span class="status-badge ${getStatusClass(item.status)}">${item.status}</span></td>
        </tr>
      `
    )
    .join('');

  resultsBody.querySelectorAll('tr[data-ptw]').forEach((row) => {
    row.addEventListener('click', () => {
      const selected = records.find((record) => record.ptwNumber === row.dataset.ptw);
      if (!selected) return;
      highlightDetail(selected);
    });
  });
}

function highlightDetail(record) {
  const header = document.querySelector('.detail-panel h3');
  const badgeContainer = document.querySelector('.header-actions');
  const validityBanner = document.querySelector('.validity-banner');

  header.textContent = record.ptwNumber;

  badgeContainer.innerHTML = `
    <span class="status-badge ${getStatusClass(record.status)}">${record.status}</span>
    <span class="type-badge ${getTypeClass(record.permitType)}">${record.permitType}</span>
  `;

  const bannerMap = {
    Open: { className: 'success', text: 'PERMIT SAH — Kerja boleh diteruskan / VALID — Work may proceed' },
    Extended: { className: 'success', text: `PERMIT SAH — Pelanjutan diluluskan / VALID — Extension approved (${record.remark})` },
    Suspended: { className: 'warning', text: 'DIGANTUNG / SUSPENDED — Do not proceed' },
    Closed: { className: 'muted', text: 'DITUTUP / CLOSED — Permit no longer valid' }
  };

  const selectedBanner = bannerMap[record.status] || bannerMap.Closed;
  validityBanner.className = `validity-banner ${selectedBanner.className}`;
  validityBanner.innerHTML = `<strong>${selectedBanner.text}</strong>`;

  const outputs = document.querySelectorAll('output');
  outputs[0].textContent = record.ptwNumber;
  outputs[1].textContent = record.jhaNumber;
  outputs[2].textContent = record.permitType;
  outputs[3].textContent = record.location;
  outputs[4].textContent = record.description;
  outputs[5].textContent = record.applicant;
  outputs[6].textContent = record.workLeader;
  outputs[7].textContent = record.authority;
  outputs[8].textContent = record.rep;
  outputs[9].textContent = record.dateIssued;
  outputs[10].textContent = record.status === 'Closed' ? '2026-08-15' : '—';
  outputs[11].textContent = record.status;
  outputs[12].textContent = record.remark;

  const timestamp = document.querySelector('.qr-panel p');
  timestamp.textContent = 'Data as of 2026-08-16 09:41';
}

function updateSuggestions(value) {
  const trimmed = value.trim();

  if (!trimmed || trimmed.length < 2) {
    suggestionsList.classList.remove('visible');
    suggestionsList.innerHTML = '';
    return;
  }

  const filtered = records
    .filter((record) => record.ptwNumber.toLowerCase().includes(trimmed.toLowerCase()))
    .slice(0, 5);

  if (!filtered.length) {
    suggestionsList.classList.remove('visible');
    suggestionsList.innerHTML = '';
    return;
  }

  suggestionsList.innerHTML = filtered
    .map(
      (record) => `
        <li data-ptw="${record.ptwNumber}">${record.ptwNumber} — ${record.location}</li>
      `
    )
    .join('');

  suggestionsList.classList.add('visible');

  suggestionsList.querySelectorAll('li').forEach((item) => {
    item.addEventListener('click', () => {
      const selected = item.dataset.ptw;
      searchInput.value = selected;
      suggestionsList.classList.remove('visible');
      const found = records.find((record) => record.ptwNumber === selected);
      if (found) {
        highlightDetail(found);
      }
    });
  });
}

searchInput.addEventListener('input', (event) => {
  updateSuggestions(event.target.value);
});

searchInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    const selected = records.find((record) => record.ptwNumber === searchInput.value.trim());
    if (selected) {
      highlightDetail(selected);
      suggestionsList.classList.remove('visible');
      return;
    }

    const firstMatch = records.find((record) =>
      record.ptwNumber.toLowerCase().includes(searchInput.value.trim().toLowerCase())
    );

    if (firstMatch) {
      highlightDetail(firstMatch);
      searchInput.value = firstMatch.ptwNumber;
      suggestionsList.classList.remove('visible');
    }
  }
});

toggleAdvancedButton.addEventListener('click', () => {
  const isCollapsed = advancedPanel.classList.toggle('collapsed');
  advancedPanel.setAttribute('aria-expanded', String(!isCollapsed));
});

renderRows(records);
highlightDetail(records[0]);
