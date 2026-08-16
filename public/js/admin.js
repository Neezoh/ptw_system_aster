const form = document.getElementById('ptwForm');
const toast = document.getElementById('toast');
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

const populateLookups = async () => {
  const response = await fetch('/api/lookups');
  const payload = await response.json();
  const { locations = [], personnel = [] } = payload.data || {};

  const locationSelect = document.getElementById('location');
  const leaderSelect = document.getElementById('work_leader');
  const authoritySelect = document.getElementById('authorised_authority');
  const aarSelect = document.getElementById('authorised_authority_rep');

  locationSelect.innerHTML = '<option value="">-- Select --</option>' + locations.map((loc) => `<option value="${loc}">${loc}</option>`).join('');

  const names = personnel.map((p) => p.name);
  const uniqueNames = [...new Set(names)].sort();
  leaderSelect.innerHTML = '<option value="">-- Select --</option>' + uniqueNames.map((name) => `<option value="${name}">${name}</option>`).join('');
  authoritySelect.innerHTML = '<option value="">-- Select --</option>' + uniqueNames.map((name) => `<option value="${name}">${name}</option>`).join('');
  aarSelect.innerHTML = '<option value="">-- None --</option>' + uniqueNames.map((name) => `<option value="${name}">${name}</option>`).join('');
};

const handleSubmit = async (event) => {
  event.preventDefault();
  clearErrors();

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  try {
    const csrfRes = await fetch('/api/csrf-token');
    const csrfData = await csrfRes.json();
    const csrfToken = csrfData.data.csrfToken;

    const response = await fetch('/api/ptw', {
      method: 'POST',
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

    setToast(`PTW created: ${result.data.ptw_number}`);
    form.reset();
    setTimeout(() => {
      window.location.href = `/ptw/${encodeURIComponent(result.data.ptw_number)}`;
    }, 800);
  } catch (error) {
    setToast('Unable to save PTW');
  }
};

form.addEventListener('submit', handleSubmit);
document.getElementById('resetBtn').addEventListener('click', () => form.reset());
updateSessionBadge();
populateLookups();
