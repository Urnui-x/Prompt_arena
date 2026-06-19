/* ===========================================================
   IDEANAX — Contact Page JS
   =========================================================== */

(function () {
  'use strict';

  /* ── Theme toggle ─────────────────────────────────────── */
  const themeBtn = document.querySelector('.icon-btn[aria-label="Toggle theme"]');
  const root = document.documentElement;

  let isDark = true; // page defaults to dark

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      isDark = !isDark;
      if (isDark) {
        root.style.setProperty('--bg-body',    '#0a0a0f');
        root.style.setProperty('--bg-page',    '#0c0c12');
        root.style.setProperty('--bg-card',    '#14141c');
        root.style.setProperty('--bg-card-alt','#16161f');
        root.style.setProperty('--bg-elevated','#1a1a24');
        root.style.setProperty('--border-subtle','#232330');
        root.style.setProperty('--border-card', '#26262f');
        root.style.setProperty('--text-primary',   '#f5f5f7');
        root.style.setProperty('--text-secondary',  '#a8a8b8');
        root.style.setProperty('--text-muted',      '#71717f');
        root.style.setProperty('--text-faint',      '#54545f');
      } else {
        root.style.setProperty('--bg-body',    '#f0f0f5');
        root.style.setProperty('--bg-page',    '#e8e8f0');
        root.style.setProperty('--bg-card',    '#ffffff');
        root.style.setProperty('--bg-card-alt','#f8f8fc');
        root.style.setProperty('--bg-elevated','#f0f0f8');
        root.style.setProperty('--border-subtle','#dcdce8');
        root.style.setProperty('--border-card', '#d4d4e0');
        root.style.setProperty('--text-primary',   '#0f0f18');
        root.style.setProperty('--text-secondary',  '#4a4a5a');
        root.style.setProperty('--text-muted',      '#7a7a8a');
        root.style.setProperty('--text-faint',      '#9a9aaa');
      }
    });
  }

  /* ── Active nav link ──────────────────────────────────── */
  const navLinks = document.querySelectorAll('.nav-link');
  const currentPage = location.pathname.split('/').pop() || 'home.html';

  navLinks.forEach(link => {
    const href = link.getAttribute('href') || '';
    if (href === currentPage || (currentPage === '' && href === 'home.html')) {
      link.classList.add('active');
    }
  });

  /* ── Search button placeholder ────────────────────────── */
  const searchBtn = document.querySelector('.icon-btn[aria-label="Search"]');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      const q = prompt('Search IDEANAX…');
      if (q && q.trim()) {
        alert(`Searching for: "${q.trim()}"\n(Connect your search backend here.)`);
      }
    });
  }

  /* ── Contact form ─────────────────────────────────────── */
  const sendBtn   = document.querySelector('.btn-send');
  const nameInput = document.querySelector('.form-input[placeholder="Full Name"]');
  const emailInput= document.querySelector('.form-input[placeholder="Email Address"]');
  const subjectInput = document.querySelector('.form-input[placeholder="Subject"]');
  const msgTextarea  = document.querySelector('.form-textarea');

  function showToast(message, type = 'success') {
    const existing = document.querySelector('.ideanax-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'ideanax-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.textContent = message;

    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '28px',
      right: '28px',
      zIndex: '9999',
      background: type === 'success' ? 'var(--purple-600)' : '#c0392b',
      color: '#fff',
      fontSize: '0.9rem',
      fontWeight: '600',
      padding: '14px 22px',
      borderRadius: '12px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
      transform: 'translateY(16px)',
      opacity: '0',
      transition: 'transform 0.3s ease, opacity 0.3s ease',
      maxWidth: '320px',
      lineHeight: '1.4',
    });

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity   = '1';
      });
    });

    setTimeout(() => {
      toast.style.transform = 'translateY(16px)';
      toast.style.opacity   = '0';
      setTimeout(() => toast.remove(), 350);
    }, 3500);
  }

  function validateEmail(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  }

  function setFieldError(field, hasError) {
    if (!field) return;
    if (hasError) {
      field.style.borderColor = '#e74c3c';
      field.style.boxShadow   = '0 0 0 3px rgba(231,76,60,0.15)';
    } else {
      field.style.borderColor = '';
      field.style.boxShadow   = '';
    }
  }

  function clearErrors() {
    [nameInput, emailInput, subjectInput, msgTextarea].forEach(f => setFieldError(f, false));
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      clearErrors();

      const name    = nameInput    ? nameInput.value.trim()    : '';
      const email   = emailInput   ? emailInput.value.trim()   : '';
      const subject = subjectInput ? subjectInput.value.trim() : '';
      const msg     = msgTextarea  ? msgTextarea.value.trim()  : '';

      let valid = true;

      if (!name)              { setFieldError(nameInput, true);    valid = false; }
      if (!validateEmail(email)) { setFieldError(emailInput, true);  valid = false; }
      if (!subject)           { setFieldError(subjectInput, true); valid = false; }
      if (!msg)               { setFieldError(msgTextarea, true);  valid = false; }

      if (!valid) {
        showToast('Please fill in all fields correctly.', 'error');
        return;
      }

      /* ── Simulate send ── */
      sendBtn.disabled = true;
      const originalHTML = sendBtn.innerHTML;
      sendBtn.innerHTML = `
        <svg class="spin-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="23 4 23 10 17 10"></polyline>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
        </svg>
        Sending…`;

      // Add spin animation if not already added
      if (!document.getElementById('spin-style')) {
        const style = document.createElement('style');
        style.id = 'spin-style';
        style.textContent = `
          @keyframes ideanax-spin { to { transform: rotate(360deg); } }
          .spin-icon { animation: ideanax-spin 0.8s linear infinite; }
        `;
        document.head.appendChild(style);
      }

      setTimeout(() => {
        sendBtn.disabled = false;
        sendBtn.innerHTML = originalHTML;

        if (nameInput)    nameInput.value    = '';
        if (emailInput)   emailInput.value   = '';
        if (subjectInput) subjectInput.value = '';
        if (msgTextarea)  msgTextarea.value  = '';

        showToast('✓ Message sent! We\'ll respond within 24 hours.', 'success');
      }, 1600);
    });

    /* Clear individual field errors on input */
    [nameInput, emailInput, subjectInput, msgTextarea].forEach(field => {
      if (!field) return;
      field.addEventListener('input', () => setFieldError(field, false));
    });
  }

  /* ── Sign In button ───────────────────────────────────── */
  const signinBtn = document.querySelector('.btn-signin');
  if (signinBtn) {
    signinBtn.addEventListener('click', () => {
      showToast('Sign in coming soon!', 'success');
    });
  }

  /* ── Navbar scroll shadow ─────────────────────────────── */
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 10) {
        navbar.style.boxShadow = '0 2px 20px rgba(0,0,0,0.4)';
      } else {
        navbar.style.boxShadow = 'none';
      }
    }, { passive: true });
  }

  /* ── Channel item ripple / hover feedback ─────────────── */
  document.querySelectorAll('.channel-item').forEach(item => {
    item.addEventListener('click', function () {
      const href = this.getAttribute('href');
      if (href && href !== '#') return; // let the <a> handle real links naturally
    });
  });

  /* ── CTA & contact-support buttons ───────────────────── */
  // These are real mailto/anchor links — no extra JS needed, they work natively.

})();
