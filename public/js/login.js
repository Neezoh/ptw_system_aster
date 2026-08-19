const form = document.getElementById('loginForm');
const errorBox = document.getElementById('errorBox');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorBox.textContent = '';

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  try {
    const response = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Login failed');
    }

    await fetch('/api/session', { cache: 'no-store' });
    window.location.href = '/admin';
  } catch (error) {
    errorBox.textContent = error.message || 'Login failed';
  }
});
