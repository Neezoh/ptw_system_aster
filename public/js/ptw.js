const pathParts = window.location.pathname.split('/');
const ptwNumber = decodeURIComponent(pathParts[pathParts.length - 1] || '');

const fields = {
  title: document.getElementById('detailTitle'),
  status: document.getElementById('detailStatus'),
  type: document.getElementById('detailType'),
  validityBanner: document.getElementById('validityBanner'),
  ptwNumber: document.getElementById('ptwNumber'),
  jhaNumber: document.getElementById('jhaNumber'),
  permitType: document.getElementById('permitType'),
  location: document.getElementById('location'),
  specificLocation: document.getElementById('specificLocation'),
  workDescription: document.getElementById('workDescription'),
  applicantName: document.getElementById('applicantName'),
  workLeader: document.getElementById('workLeader'),
  authority: document.getElementById('authority'),
  authorityRep: document.getElementById('authorityRep'),
  hseOfficerAssessor: document.getElementById('hseOfficerAssessor'),
  dateIssued: document.getElementById('dateIssued'),
  dateClosed: document.getElementById('dateClosed'),
  statusValue: document.getElementById('statusValue'),
  remark: document.getElementById('remark'),
  dataStamp: document.getElementById('dataStamp')
};

const statusClass = (status) => ({
  Open: 'status-open',
  Extended: 'status-extended',
  Suspended: 'status-suspended',
  Returned: 'status-extended',
  Closed: 'status-closed'
}[status] || 'status-closed');

const typeClass = (type) => (type === 'Hot' ? 'type-hot' : 'type-cold');

const applyBanner = (status, remark) => {
  const map = {
    Open: { className: 'success', text: 'VALID — Work may proceed' },
    Extended: { className: 'success', text: `VALID — Extension approved (${remark || 'No remark'})` },
    Suspended: { className: 'warning', text: 'SUSPENDED — Do not proceed' },
    Closed: { className: 'muted', text: 'CLOSED — Permit no longer valid' }
  };

  const selected = map[status] || map.Closed;
  fields.validityBanner.className = `validity-banner ${selected.className}`;
  fields.validityBanner.innerHTML = `<strong>${selected.text}</strong>`;
};

const renderRecord = (record) => {
  fields.title.textContent = record.ptw_number;
  fields.ptwNumber.textContent = record.ptw_number;
  fields.jhaNumber.textContent = record.jha_number;
  fields.permitType.textContent = record.permit_type;
  fields.location.textContent = record.location;
  fields.specificLocation.textContent = record.specific_location || '—';
  fields.workDescription.textContent = record.work_description;
  fields.applicantName.textContent = record.permit_applicant_name;
  fields.workLeader.textContent = record.work_leader;
  fields.authority.textContent = record.authorised_authority;
  fields.authorityRep.textContent = record.authorised_authority_rep || '—';
  fields.hseOfficerAssessor.textContent = record.hse_officer_assessor || '—';
  fields.dateIssued.textContent = record.date_issued;
  fields.dateClosed.textContent = record.date_closed || '—';
  fields.statusValue.textContent = record.status;
  fields.remark.textContent = record.remark || '—';

  fields.status.textContent = record.status;
  fields.status.className = `status-badge ${statusClass(record.status)}`;
  fields.type.textContent = record.permit_type;
  fields.type.className = `type-badge ${typeClass(record.permit_type)}`;

  applyBanner(record.status, record.remark);
  fields.dataStamp.textContent = `Data as of ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`;
};

const loadRecord = async () => {
  if (!ptwNumber) {
    fields.title.textContent = 'PTW not found';
    return;
  }

  try {
    const response = await fetch(`/api/ptw/${encodeURIComponent(ptwNumber)}`);
    const data = await response.json();
    if (!response.ok || !data.success) {
      fields.title.textContent = 'PTW record not found';
      return;
    }

    renderRecord(data.data);
  } catch (error) {
    fields.title.textContent = 'PTW record not found';
  }
};

loadRecord();
