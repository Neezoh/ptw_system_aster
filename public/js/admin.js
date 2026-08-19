const form = document.getElementById('ptwForm');
const toast = document.getElementById('toast');
const sessionBadge = document.getElementById('sessionBadge');
const recordsBody = document.getElementById('recordsBody');
const saveButton = document.getElementById('saveButton');
const refreshRecordsButton = document.getElementById('refreshRecordsBtn');
let editingRecordId = null;

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

const setToast = (message) => {
  toast.textContent = message;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 3000);
};

const clearErrors = () => {
  document.querySelectorAll('.inline-error').forEach((el) => {
    el.textContent = '';
  });
};

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const setFormValue = (name, value) => {
  const field = form.elements[name];
  if (field) field.value = value ?? '';
};

const resetFormState = () => {
  editingRecordId = null;
  form.reset();
  clearErrors();
  saveButton.textContent = 'Save PTW';
};

const editRecord = (record) => {
  editingRecordId = record.id;
  Object.entries(record).forEach(([name, value]) => setFormValue(name, value));
  saveButton.textContent = 'Update PTW';
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const getCsrfToken = async () => {
  const csrfRes = await fetch('/api/csrf-token');
  const csrfData = await csrfRes.json();
  return csrfData.data.csrfToken;
};

const deleteRecord = async (id, ptwNumber) => {
  if (!window.confirm(`Delete ${ptwNumber}? This cannot be undone.`)) return;

  try {
    const csrfToken = await getCsrfToken();
    const response = await fetch(`/api/ptw/${id}`, {
      method: 'DELETE',
      headers: { 'CSRF-Token': csrfToken }
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || 'Unable to delete PTW');

    if (editingRecordId === id) resetFormState();
    setToast(`PTW deleted: ${ptwNumber}`);
    await loadRecords();
  } catch (error) {
    setToast(error.message || 'Unable to delete PTW');
  }
};

const renderRecords = (records) => {
  if (!records.length) {
    recordsBody.innerHTML = '<tr><td class="empty-records" colspan="5">No PTW records found.</td></tr>';
    return;
  }

  recordsBody.innerHTML = records.map((record) => `
    <tr>
      <td><strong>${escapeHtml(record.ptw_number)}</strong></td>
      <td>${escapeHtml(record.location)}</td>
      <td>${escapeHtml(record.permit_applicant_name)}</td>
      <td>${escapeHtml(record.status)}</td>
      <td>
        <div class="record-actions">
          <button class="edit-button" type="button" data-edit-id="${record.id}">Edit</button>
          <button class="delete-button" type="button" data-delete-id="${record.id}" data-delete-number="${escapeHtml(record.ptw_number)}">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');

  recordsBody.querySelectorAll('[data-edit-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const record = records.find((item) => item.id === Number(button.dataset.editId));
      if (record) editRecord(record);
    });
  });

  recordsBody.querySelectorAll('[data-delete-id]').forEach((button) => {
    button.addEventListener('click', () => deleteRecord(Number(button.dataset.deleteId), button.dataset.deleteNumber));
  });
};

const loadRecords = async () => {
  try {
    const response = await fetch('/api/ptw?limit=50');
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload.error || 'Unable to load PTW records');
    renderRecords(payload.data || []);
  } catch (error) {
    recordsBody.innerHTML = `<tr><td class="empty-records" colspan="5">${escapeHtml(error.message || 'Unable to load PTW records')}</td></tr>`;
  }
};

const populateLookups = async () => {
  const response = await fetch('/api/lookups');
  const payload = await response.json();
  const { locations = [], personnel = [] } = payload.data || {};

  const locationSelect = document.getElementById('location');
  const leaderSelect = document.getElementById('work_leader');
  const authoritySelect = document.getElementById('authorised_authority');
  const aarSelect = document.getElementById('authorised_authority_rep');

  locationSelect.value = '';
  document.getElementById('locationOptions').innerHTML = locations.map((loc) => `<option value="${escapeHtml(loc)}"></option>`).join('');

  const names = personnel.map((p) => p.name);
  const uniqueNames = [...new Set(names)].sort();
  document.getElementById('personnelOptions').innerHTML = uniqueNames.map((name) => `<option value="${escapeHtml(name)}"></option>`).join('');
  leaderSelect.value = '';
  authoritySelect.value = '';
  aarSelect.value = '';
};

const handleSubmit = async (event) => {
  event.preventDefault();
  clearErrors();

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  try {
    const csrfToken = await getCsrfToken();
    const endpoint = editingRecordId ? `/api/ptw/${editingRecordId}` : '/api/ptw';
    const method = editingRecordId ? 'PUT' : 'POST';

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'CSRF-Token': csrfToken
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!response.ok) {
      if (result.data && result.data.fieldErrors) {
        Object.entries(result.data.fieldErrors).forEach(([field, message]) => {
          const el = document.querySelector(`[data-error-for="${field}"]`);
          if (el) el.textContent = message;
        });
      }
      setToast(result.error || 'Validation failed');
      return;
    }

    setToast(`${editingRecordId ? 'PTW updated' : 'PTW created'}: ${result.data.ptw_number}`);
    resetFormState();
    await loadRecords();
  } catch (error) {
    setToast('Unable to save PTW');
  }
};

form.addEventListener('submit', handleSubmit);
document.getElementById('resetBtn').addEventListener('click', resetFormState);
refreshRecordsButton.addEventListener('click', loadRecords);
updateSessionBadge();
populateLookups();
loadRecords();
