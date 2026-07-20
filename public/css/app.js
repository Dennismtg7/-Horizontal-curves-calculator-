/* ═══════════════════════════════════════════════════════
   SurveyPro — Main App JS
   Handles: auth flows, modals, dashboard, tool routing,
            downloads, counter animation, navbar scroll
   ═══════════════════════════════════════════════════════ */

'use strict';

/* ── NAVBAR SCROLL ─────────────────────────────────────── */
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20);
});

/* ── MOBILE MENU ───────────────────────────────────────── */
function toggleMenu() {
  document.getElementById('navLinks').classList.toggle('open');
}
document.addEventListener('click', (e) => {
  const links = document.getElementById('navLinks');
  if (!links.contains(e.target) && !document.getElementById('hamburger').contains(e.target)) {
    links.classList.remove('open');
  }
});

/* ── COUNTER ANIMATION ─────────────────────────────────── */
function animateCounters() {
  document.querySelectorAll('.stat-n').forEach(el => {
    const target = parseInt(el.dataset.target, 10);
    const suffix = el.dataset.suffix || (target >= 100 ? '+' : '');
    let current = 0;
    const step = Math.max(1, Math.floor(target / 40));
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current + (current === target ? suffix : '');
      if (current >= target) clearInterval(timer);
    }, 30);
  });
}
const heroObs = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) { animateCounters(); heroObs.disconnect(); }
}, { threshold: .3 });
const heroEl = document.querySelector('.hero-stats');
if (heroEl) heroObs.observe(heroEl);

/* ── TOAST ─────────────────────────────────────────────── */
let toastTimer;
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (type ? ' ' + type : '');
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), 3200);
}

/* ── MODALS ─────────────────────────────────────────────── */
function showModal(type) {
  const backdrop = document.getElementById('authBackdrop');
  backdrop.classList.remove('hidden');
  ['loginModal','registerModal','resetModal'].forEach(id => {
    document.getElementById(id).classList.add('hidden');
  });
  const map = { login: 'loginModal', register: 'registerModal', reset: 'resetModal' };
  document.getElementById(map[type]).classList.remove('hidden');
  // Clear errors
  ['loginError','registerError','resetError','resetMsg'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.classList.add('hidden'); el.textContent = ''; }
  });
}
function closeModal(e) {
  if (e && e.target !== document.getElementById('authBackdrop')) return;
  document.getElementById('authBackdrop').classList.add('hidden');
}
// Override so the ✕ button always closes
document.querySelectorAll('.modal-close').forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById('authBackdrop').classList.add('hidden');
  });
});

/* ── AUTH HELPERS ──────────────────────────────────────── */
function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = loading ? '...' : btn.dataset.label || btn.textContent;
}
function showFormError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
}

function friendlyError(code) {
  const map = {
    'auth/email-already-in-use':   'An account with this email already exists.',
    'auth/invalid-email':           'Please enter a valid email address.',
    'auth/weak-password':           'Password must be at least 6 characters.',
    'auth/user-not-found':          'No account found with this email.',
    'auth/wrong-password':          'Incorrect password. Please try again.',
    'auth/too-many-requests':       'Too many attempts. Please try again later.',
    'auth/popup-closed-by-user':    'Sign-in popup was closed.',
    'auth/network-request-failed':  'Network error. Check your connection.'
  };
  return map[code] || 'Something went wrong. Please try again.';
}

/* ── REGISTER ──────────────────────────────────────────── */
async function doRegister() {
  const name     = document.getElementById('regName').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  if (!name)     return showFormError('registerError', 'Please enter your name.');
  if (!email)    return showFormError('registerError', 'Please enter your email.');
  if (!password) return showFormError('registerError', 'Please enter a password.');

  const { createUserWithEmailAndPassword, updateProfile, doc, setDoc, serverTimestamp } = window._fbModules;
  const btn = document.getElementById('registerBtn');
  btn.disabled = true; btn.textContent = 'Creating account...';

  try {
    const cred = await createUserWithEmailAndPassword(window._auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await setDoc(doc(window._db, 'users', cred.user.uid), {
      displayName: name, email,
      createdAt: serverTimestamp(), toolsUsed: 0, downloads: 0
    });
    document.getElementById('authBackdrop').classList.add('hidden');
    showToast('Welcome to SurveyPro, ' + name + '! 🎉', 'success');
  } catch (err) {
    showFormError('registerError', friendlyError(err.code));
  } finally {
    btn.disabled = false; btn.textContent = 'Create Account';
  }
}

/* ── LOGIN ─────────────────────────────────────────────── */
async function doLogin() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  if (!email)    return showFormError('loginError', 'Please enter your email.');
  if (!password) return showFormError('loginError', 'Please enter your password.');

  const { signInWithEmailAndPassword } = window._fbModules;
  const btn = document.getElementById('loginBtn');
  btn.disabled = true; btn.textContent = 'Signing in...';

  try {
    await signInWithEmailAndPassword(window._auth, email, password);
    document.getElementById('authBackdrop').classList.add('hidden');
    showToast('Welcome back!', 'success');
  } catch (err) {
    showFormError('loginError', friendlyError(err.code));
  } finally {
    btn.disabled = false; btn.textContent = 'Sign In';
  }
}

/* ── GOOGLE LOGIN ──────────────────────────────────────── */
async function doGoogleLogin() {
  const { signInWithPopup } = window._fbModules;
  try {
    await signInWithPopup(window._auth, window._googleProvider);
    document.getElementById('authBackdrop').classList.add('hidden');
    showToast('Signed in with Google ✓', 'success');
  } catch (err) {
    showToast(friendlyError(err.code), 'error');
  }
}

/* ── PASSWORD RESET ────────────────────────────────────── */
async function doReset() {
  const email = document.getElementById('resetEmail').value.trim();
  if (!email) return showFormError('resetError', 'Please enter your email.');
  const { sendPasswordResetEmail } = window._fbModules;
  try {
    await sendPasswordResetEmail(window._auth, email);
    document.getElementById('resetMsg').textContent = 'Reset link sent! Check your inbox.';
    document.getElementById('resetMsg').classList.remove('hidden');
    document.getElementById('resetError').classList.add('hidden');
  } catch (err) {
    showFormError('resetError', friendlyError(err.code));
  }
}

/* ── SIGN OUT ──────────────────────────────────────────── */
async function signOut() {
  const { fbSignOut } = window._fbModules;
  await fbSignOut(window._auth);
  closeDashboard();
  showToast('Signed out.');
}

/* ── REQUIRE AUTH ──────────────────────────────────────── */
function requireAuth(action, payload) {
  if (!window._auth?.currentUser) {
    showToast('Please sign in to access this feature.');
    showModal('login');
    return false;
  }
  if (action === 'curve')       openTool('curve');
  if (action === 'traverse')    openTool('traverse');
  if (action === 'setting-out') openTool('setting-out');
  if (action === 'download')    downloadResource(payload);
  return true;
}

/* ── DASHBOARD ─────────────────────────────────────────── */
function openDashboard() {
  document.getElementById('dashboardOverlay').classList.remove('hidden');
}
function closeDashboard(e) {
  if (e && e.target !== document.getElementById('dashboardOverlay')) return;
  document.getElementById('dashboardOverlay').classList.add('hidden');
}

/* ── TOOL ROUTING ──────────────────────────────────────── */
const toolFiles = {
  'curve':       'pages/curve-calculator.html',
  'traverse':    'pages/traverse-calculator.html',
  'setting-out': 'pages/setting-out.html'
};

async function openTool(name) {
  if (!window._auth?.currentUser) { requireAuth(name); return; }
  closeDashboard();

  // Track usage in Firestore
  try {
    const { doc, updateDoc, increment } = window._fbModules;
    await updateDoc(doc(window._db, 'users', window._auth.currentUser.uid), {
      toolsUsed: increment(1)
    });
  } catch (_) {}

  // Log activity
  addActivity(name);

  const file = toolFiles[name];
  if (file) window.open(file, '_blank');
  else showToast('This tool is coming soon!');
}

function addActivity(tool) {
  const names = { curve: 'Horizontal Curve', traverse: 'Traverse', 'setting-out': 'Setting Out' };
  const icons = { curve: '⌒', traverse: '⬡', 'setting-out': '⊞' };
  const list = document.getElementById('dashActivity');
  const item = document.createElement('div');
  item.className = 'activity-item';
  item.innerHTML = `<span class="ai-icon">${icons[tool] || '🔧'}</span>
    <span class="ai-text">Opened ${names[tool] || tool} Calculator</span>
    <span class="ai-time">Just now</span>`;
  list.prepend(item);
}

/* ── DOWNLOADS ──────────────────────────────────────────── */
async function downloadResource(filename) {
  if (!window._auth?.currentUser) {
    showModal('login');
    showToast('Sign in to download resources.');
    return;
  }
  showToast('Preparing download...');
  try {
    // Try Firebase Storage first
    const { ref, getDownloadURL } = window._fbModules;
    const storageRef = ref(window._storage, `resources/${filename}`);
    const url = await getDownloadURL(storageRef);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    showToast('Download started ✓', 'success');

    // Track downloads
    const { doc, updateDoc, increment } = window._fbModules;
    await updateDoc(doc(window._db, 'users', window._auth.currentUser.uid), {
      downloads: increment(1)
    });
  } catch (err) {
    // File not yet uploaded — guide user
    showToast('File not yet uploaded. Add it to Firebase Storage → resources/' + filename, 'error');
    console.warn('Storage error:', err.code, filename);
  }
}

/* ── YOUTUBE ─────────────────────────────────────────────── */
function openVideo(url) {
  window.open(url, '_blank');
}
function goToYouTube() {
  window.open('https://www.youtube.com/@DnsMTG7-uc7nf', '_blank');
}

/* ── EXPOSE GLOBALS ─────────────────────────────────────── */
Object.assign(window, {
  showModal, closeModal, doLogin, doRegister, doGoogleLogin,
  doReset, signOut, requireAuth, openDashboard, closeDashboard,
  openTool, downloadResource, openVideo, goToYouTube, toggleMenu
});
