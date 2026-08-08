'use strict';

/* ── NAVBAR SCROLL ──────────────────────────────────────── */
window.addEventListener('scroll', () => {
  document.getElementById('navbar')
    .classList.toggle('scrolled', window.scrollY > 20);
});

/* ── MOBILE MENU ────────────────────────────────────────── */
function toggleMenu() {
  document.getElementById('navLinks').classList.toggle('open');
}
document.addEventListener('click', e => {
  const links = document.getElementById('navLinks');
  const ham   = document.getElementById('hamburger');
  if (links && !links.contains(e.target) && !ham.contains(e.target))
    links.classList.remove('open');
});

/* ── COUNTER ANIMATION ──────────────────────────────────── */
(function () {
  const obs = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) return;
    document.querySelectorAll('.stat-n').forEach(el => {
      const target = +el.dataset.target;
      const suffix = el.dataset.suffix || '';
      let cur = 0;
      const step = Math.max(1, Math.ceil(target / 50));
      const t = setInterval(() => {
        cur = Math.min(cur + step, target);
        el.textContent = cur + (cur === target ? suffix : '');
        if (cur >= target) clearInterval(t);
      }, 28);
    });
    obs.disconnect();
  }, { threshold: 0.3 });
  const el = document.querySelector('.hero-stats');
  if (el) obs.observe(el);
})();

/* ── TOAST ──────────────────────────────────────────────── */
let _toastTimer;
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className   = 'toast' + (type ? ' ' + type : '');
  t.classList.remove('hidden');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.add('hidden'), 3400);
}

/* ── MODALS ─────────────────────────────────────────────── */
function showModal(type) {
  document.getElementById('authBackdrop').classList.remove('hidden');
  ['loginModal','registerModal','resetModal'].forEach(id =>
    document.getElementById(id).classList.add('hidden'));
  const map = { login:'loginModal', register:'registerModal', reset:'resetModal' };
  document.getElementById(map[type]).classList.remove('hidden');
  ['loginError','registerError','resetError','resetMsg'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.classList.add('hidden'); el.textContent = ''; }
  });
}

function closeModal() {
  document.getElementById('authBackdrop').classList.add('hidden');
}
// Close when clicking outside modal box
document.getElementById('authBackdrop').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

/* ── FRIENDLY ERROR MESSAGES ────────────────────────────── */
function friendlyError(code) {
  return {
    'auth/email-already-in-use':  'An account with this email already exists.',
    'auth/invalid-email':          'Please enter a valid email address.',
    'auth/weak-password':          'Password must be at least 6 characters.',
    'auth/user-not-found':         'No account found with this email.',
    'auth/wrong-password':         'Incorrect password. Please try again.',
    'auth/invalid-credential':     'Incorrect email or password.',
    'auth/too-many-requests':      'Too many attempts. Please try again later.',
    'auth/popup-closed-by-user':   'Sign-in popup was closed.',
    'auth/network-request-failed': 'Network error. Check your connection.'
  }[code] || 'Something went wrong. Please try again.';
}

function showFormError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
}

/* ── REGISTER ───────────────────────────────────────────── */
async function doRegister() {
  const name  = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const pass  = document.getElementById('regPassword').value;
  if (!name)  return showFormError('registerError', 'Please enter your name.');
  if (!email) return showFormError('registerError', 'Please enter your email.');
  if (!pass)  return showFormError('registerError', 'Please enter a password.');

  const btn = document.getElementById('registerBtn');
  btn.disabled = true; btn.textContent = 'Creating account…';
  try {
    const { createUserWithEmailAndPassword, updateProfile, doc, setDoc, serverTimestamp } = window._fb;
    const cred = await createUserWithEmailAndPassword(window._auth, email, pass);
    await updateProfile(cred.user, { displayName: name });
    await setDoc(doc(window._db, 'users', cred.user.uid), {
      displayName: name, email,
      createdAt: serverTimestamp(), toolsUsed: 0, downloads: 0
    });
    closeModal();
    showToast('Welcome to SurveyPro, ' + name + '! 🎉', 'success');
  } catch (e) {
    showFormError('registerError', friendlyError(e.code));
  } finally {
    btn.disabled = false; btn.textContent = 'Create Account';
  }
}

/* ── LOGIN ──────────────────────────────────────────────── */
async function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass  = document.getElementById('loginPassword').value;
  if (!email) return showFormError('loginError', 'Please enter your email.');
  if (!pass)  return showFormError('loginError', 'Please enter your password.');

  const btn = document.getElementById('loginBtn');
  btn.disabled = true; btn.textContent = 'Signing in…';
  try {
    const { signInWithEmailAndPassword } = window._fb;
    await signInWithEmailAndPassword(window._auth, email, pass);
    closeModal();
    showToast('Welcome back! ✓', 'success');
  } catch (e) {
    showFormError('loginError', friendlyError(e.code));
  } finally {
    btn.disabled = false; btn.textContent = 'Sign In';
  }
}

/* ── GOOGLE LOGIN ───────────────────────────────────────── */
async function doGoogleLogin() {
  try {
    const { signInWithPopup } = window._fb;
    await signInWithPopup(window._auth, window._gProvider);
    closeModal();
    showToast('Signed in with Google ✓', 'success');
  } catch (e) {
    showToast(friendlyError(e.code), 'error');
  }
}

/* ── RESET PASSWORD ─────────────────────────────────────── */
async function doReset() {
  const email = document.getElementById('resetEmail').value.trim();
  if (!email) return showFormError('resetError', 'Please enter your email.');
  try {
    const { sendPasswordResetEmail } = window._fb;
    await sendPasswordResetEmail(window._auth, email);
    document.getElementById('resetMsg').textContent = 'Reset link sent — check your inbox.';
    document.getElementById('resetMsg').classList.remove('hidden');
    document.getElementById('resetError').classList.add('hidden');
  } catch (e) {
    showFormError('resetError', friendlyError(e.code));
  }
}

/* ── SIGN OUT ───────────────────────────────────────────── */
async function doSignOut() {
  const { signOut } = window._fb;
  await signOut(window._auth);
  closeDashboard();
  showToast('Signed out.');
}

/* ── REQUIRE AUTH ───────────────────────────────────────── */
function requireAuth(action, payload) {
  if (!window._auth?.currentUser) {
    showToast('Please sign in to access this feature.');
    showModal('login');
    return;
  }
  if (action === 'download') { downloadResource(payload); return; }
  openTool(action);
}

/* ── DASHBOARD ──────────────────────────────────────────── */
function openDashboard() {
  document.getElementById('dashboardOverlay').classList.remove('hidden');
}
function closeDashboard(e) {
  if (e && e.target !== document.getElementById('dashboardOverlay')) return;
  document.getElementById('dashboardOverlay').classList.add('hidden');
}

/* ── TOOL ROUTING ───────────────────────────────────────── */
async function openTool(name) {
  if (!window._auth?.currentUser) { showModal('login'); return; }
  closeDashboard();

  // Increment toolsUsed counter in Firestore
  try {
    const { doc, updateDoc, increment } = window._fb;
    await updateDoc(doc(window._db, 'users', window._auth.currentUser.uid),
      { toolsUsed: increment(1) });
    const el = document.getElementById('dashToolsUsed');
    if (el) el.textContent = (parseInt(el.textContent) || 0) + 1;
  } catch (_) {}

  const urls = {
    'curve':       'pages/curve-calculator.html',
    'traverse':    'pages/traverse-calculator.html',
    'setting-out': 'pages/setting-out.html'
  };
  if (urls[name]) window.open(urls[name], '_blank');
  else showToast('This tool is coming soon!');
}

/* ── DOWNLOADS ──────────────────────────────────────────── */
async function downloadResource(filename) {
  if (!window._auth?.currentUser) { showModal('login'); return; }
  showToast('Preparing download…');
  try {
    const { ref, getDownloadURL, doc, updateDoc, increment } = window._fb;
    const url = await getDownloadURL(ref(window._storage, `resources/${filename}`));
    const a = Object.assign(document.createElement('a'), { href: url, download: filename });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showToast('Download started ✓', 'success');
    await updateDoc(doc(window._db, 'users', window._auth.currentUser.uid),
      { downloads: increment(1) });
  } catch (e) {
    // File not yet uploaded to Storage — show helpful message
    showToast('File not uploaded yet. Upload it to Firebase Storage → resources/', 'error');
  }
}

/* ── EXPOSE GLOBALS ─────────────────────────────────────── */
Object.assign(window, {
  toggleMenu, showModal, closeModal,
  doLogin, doRegister, doGoogleLogin, doReset, doSignOut,
  requireAuth, openDashboard, closeDashboard,
  openTool, downloadResource
});
