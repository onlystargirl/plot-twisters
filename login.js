// ═══════════════════════════════════════════════════════════════
//  PLOT TWISTERS — Login / Register Logic (UMD Compat)
// ═══════════════════════════════════════════════════════════════

let authMode = 'login'; // 'login' or 'register'

// ─── THEME ────────────────────────────────────────────────────
const saved = localStorage.getItem('pt-theme') || 'light';
document.documentElement.setAttribute('data-theme', saved);

const themeBtn = document.getElementById('theme-toggle-login');
if (themeBtn) {
    themeBtn.textContent = saved === 'dark' ? '☀️' : '🌙';
    themeBtn.addEventListener('click', () => {
        const curr = document.documentElement.getAttribute('data-theme');
        const next = curr === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('pt-theme', next);
        themeBtn.textContent = next === 'dark' ? '☀️' : '🌙';
    });
}

// ─── DECO PARTICLES ───────────────────────────────────────────
(function spawnDecoParticles() {
    const c = document.getElementById('login-particles');
    if (!c) return;
    const shapes = ['✦', '✧', '·', '⋆', '✶'];
    for (let i = 0; i < 14; i++) {
        const el = document.createElement('span');
        el.textContent = shapes[Math.floor(Math.random() * shapes.length)];
        const sz = Math.random() * 12 + 8;
        el.style.cssText = `
            position:absolute;
            font-size:${sz}px;
            left:${Math.random()*100}%;
            top:${Math.random()*100}%;
            color:rgba(255,255,255,${Math.random()*0.25+0.05});
            pointer-events:none;
            animation:floatParticle ${Math.random()*25+20}s ${Math.random()*-20}s infinite linear;
        `;
        c.appendChild(el);
    }
})();

// ─── SWITCH MODE ──────────────────────────────────────────────
window.setMode = function(mode) {
    authMode = mode;
    clearError();

    const titleEl    = document.getElementById('auth-title');
    const subtitleEl = document.getElementById('auth-subtitle');
    const nameField  = document.getElementById('field-name');
    const nameInput  = document.getElementById('login-name');
    const submitBtn  = document.getElementById('login-submit-btn');

    // Toggle active buttons
    document.getElementById('mode-login-btn').classList.toggle('active', mode === 'login');
    document.getElementById('mode-register-btn').classList.toggle('active', mode === 'register');

    if (mode === 'register') {
        titleEl.innerHTML = 'Crea <em>il tuo Account</em>';
        subtitleEl.textContent = 'Unisciti al club e scrivi sul tuo diario di bordo 📓';
        nameField.classList.remove('hidden-field');
        nameInput.setAttribute('required', 'true');
        submitBtn.innerHTML = 'Registrati <i class="fas fa-user-plus"></i>';
    } else {
        titleEl.innerHTML = 'Benvenuta <em>di nuovo</em>';
        subtitleEl.textContent = 'Accedi alla tua area personale ☕';
        nameField.classList.add('hidden-field');
        nameInput.removeAttribute('required');
        submitBtn.innerHTML = 'Accedi <i class="fas fa-arrow-right"></i>';
    }
};

// ─── AUTH STATE CHECK ─────────────────────────────────────────
const loader = document.getElementById('page-loader');

function checkAuthState() {
    if (window.auth) {
        window.auth.onAuthStateChanged((user) => {
            if (user) {
                window.location.href = 'dashboard.html';
            } else {
                if (loader) loader.classList.add('hidden');
            }
        });
    } else {
        if (loader) loader.classList.add('hidden');
    }
}

// Check on load
setTimeout(checkAuthState, 600);

// ─── FORM SUBMISSION ──────────────────────────────────────────
const form      = document.getElementById('login-form');
const nameEl    = document.getElementById('login-name');
const emailEl   = document.getElementById('login-email');
const passEl    = document.getElementById('login-password');
const errorBox  = document.getElementById('login-error');
const errorMsg  = document.getElementById('login-error-msg');
const submitBtn = document.getElementById('login-submit-btn');

function showError(msg) {
    errorMsg.textContent = msg;
    errorBox.classList.remove('hidden');
    emailEl.classList.add('error');
    passEl.classList.add('error');
}

function clearError() {
    errorBox.classList.add('hidden');
    emailEl.classList.remove('error');
    passEl.classList.remove('error');
}

const FIREBASE_ERRORS = {
    'auth/user-not-found':      'Nessun account trovato con questa email. Clicca su Crea Account!',
    'auth/wrong-password':      'Password errata. Riprova!',
    'auth/invalid-email':       'Formato email non valido.',
    'auth/weak-password':       'La password deve contenere almeno 6 caratteri.',
    'auth/email-already-in-use': 'Questa email è già associata ad un account esistente.',
    'auth/too-many-requests':   'Troppi tentativi. Attendi qualche minuto.',
    'auth/invalid-credential':  'Email o password errata. Riprova!',
    'auth/network-request-failed': 'Errore di rete. Controlla la connessione internet.',
};

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearError();

        const email = emailEl.value.trim();
        const pass  = passEl.value;
        const name  = nameEl.value.trim();

        if (!email || !pass) {
            showError('Inserisci email e password.');
            return;
        }

        if (authMode === 'register' && !name) {
            showError('Per favore, inserisci il tuo nome.');
            nameEl.focus();
            return;
        }

        if (!window.auth) {
            showError('Errore: connessione a Firebase fallita. Riprova tra poco.');
            return;
        }

        // Loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner"></span> Attendere…';

        try {
            if (authMode === 'register') {
                // ─── REGISTER FLOW ───
                const cred = await window.auth.createUserWithEmailAndPassword(email, pass);
                const user = cred.user;
                
                // Update profile display name
                await user.updateProfile({ displayName: name });

                // Save user details to Firestore
                if (window.db) {
                    await window.db.collection('users').doc(user.uid).set({
                        email:       email,
                        displayName: name,
                        role:        'member', // members by default
                        createdAt:   firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            } else {
                // ─── LOGIN FLOW ───
                await window.auth.signInWithEmailAndPassword(email, pass);
            }
        } catch (err) {
            console.error(err);
            const msg = FIREBASE_ERRORS[err.code] || err.message || 'Errore di autenticazione. Riprova!';
            showError(msg);
            
            // Restore button text
            if (authMode === 'register') {
                submitBtn.innerHTML = 'Registrati <i class="fas fa-user-plus"></i>';
            } else {
                submitBtn.innerHTML = 'Accedi <i class="fas fa-arrow-right"></i>';
            }
            submitBtn.disabled = false;
        }
    });

    [emailEl, passEl, nameEl].forEach(el => el.addEventListener('input', clearError));
}
