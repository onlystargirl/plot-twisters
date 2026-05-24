// ═══════════════════════════════════════════════════════════════
//  PLOT TWISTERS — Login multi-utente (solo localStorage)
// ═══════════════════════════════════════════════════════════════

// ─── LISTA UTENTI DEL CLUB ────────────────────────────────────
// Aggiungi o rimuovi membri qui. admin:true mostra il pannello admin.
const CLUB_USERS = [

    { name: 'Samia', password: 'admin!plot', admin: true },
    { name: 'Giorgia', password: 'amosamia2705' },
    { name: 'Elisabetta', password: 'mispososamiaenonandrea' },
    { name: 'Angela', password: 'odiogliobesicomegiacomo' },
    { name: 'Jacopo', password: 'sonounapecora' },
    { name: 'Giacomo', password: 'sonoungayritardatostupido' },
    { name: 'Imma', password: 'lastellinadisami' },
    { name: 'Claudia', password: 'claudiatiamobysami' },
    { name: 'Ilaria', password: 'ilariadevieditareivideogay' },
    { name: 'Salvatore', password: 'sonolamantedisamia' },
    { name: 'Emiliana', password: 'seisette69' },
    { name: 'Jordan', password: 'prodottokinderpreferito?' },
    { name: 'Martina', password: 'chièlamigliore?' },
    { name: 'Maddalena', password: 'nonsochepasswordmettere' },
    { name: 'Samuel', password: 'ilmigliorsegretariodelmondo' },
    { name: 'Angelo', password: 'odiogiacomo6769' },
];

// ─── TEMA ─────────────────────────────────────────────────────
(function applyTheme() {
    const saved = localStorage.getItem('pt-theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    const btn = document.getElementById('theme-toggle-login');
    if (btn) {
        btn.textContent = saved === 'dark' ? '☀️' : '🌙';
        btn.addEventListener('click', () => {
            const curr = document.documentElement.getAttribute('data-theme');
            const next = curr === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('pt-theme', next);
            btn.textContent = next === 'dark' ? '☀️' : '🌙';
        });
    }
})();

// ─── SE GIÀ LOGGATA ───────────────────────────────────────────
if (localStorage.getItem('pt-auth') === '1') {
    window.location.replace('dashboard.html');
}

// ─── UTILI INIZIALIZZAZIONI ───────────────────────────────────

// ─── PARTICELLE DECORATIVE ────────────────────────────────────
(function spawnParticles() {
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
            left:${Math.random() * 100}%;
            top:${Math.random() * 100}%;
            color:rgba(255,255,255,${Math.random() * 0.25 + 0.05});
            pointer-events:none;
            animation:floatParticle ${Math.random() * 25 + 20}s ${Math.random() * -20}s infinite linear;
        `;
        c.appendChild(el);
    }
})();

// ─── USER PILLS ───────────────────────────────────────────────
let selectedUser = null;

// ─── USER SELECTION ───────────────────────────────────────
function buildUserScroll() {
    const container = document.getElementById('user-scroll');
    if (!container) return;
    // clear any existing pills
    container.innerHTML = '';
    CLUB_USERS.forEach(u => {
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.className = 'user-pill';
        pill.dataset.name = u.name;
        pill.innerHTML = `<span class="avatar-sm">${u.name.charAt(0)}</span>${u.name}`;
        pill.addEventListener('click', () => {
            selectedUser = u.name;
            // highlight selected pill
            document.querySelectorAll('.user-pill').forEach(p => p.classList.remove('selected'));
            pill.classList.add('selected');
            clearError();
        });
        container.appendChild(pill);
    });
}

// On DOMContentLoaded, populate the scrollable user pills
window.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('page-loader');
    if (loader) setTimeout(() => loader.classList.add('hidden'), 400);
    buildUserScroll();
});

// ─── FORM ─────────────────────────────────────────────────────
const form = document.getElementById('login-form');
const passEl = document.getElementById('login-password');
const errorBox = document.getElementById('login-error');
const errorMsg = document.getElementById('login-error-msg');
const submitBtn = document.getElementById('login-submit-btn');

function showError(msg) {
    errorMsg.textContent = msg;
    errorBox.classList.remove('hidden');
    passEl.classList.add('error');
}
function clearError() {
    errorBox.classList.add('hidden');
    passEl.classList.remove('error');
}

if (passEl) passEl.addEventListener('input', clearError);

if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        clearError();

        if (!selectedUser) {
            showError('Seleziona prima il tuo nome! 👆');
            return;
        }
        const entered = passEl.value;
        if (!entered) {
            showError('Inserisci la tua password.');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner"></span> Attendere…';

        setTimeout(() => {
            const user = CLUB_USERS.find(u => u.name === selectedUser);
            if (user && entered === user.password) {
                localStorage.setItem('pt-auth', '1');
                localStorage.setItem('pt-user-name', user.name);
                localStorage.setItem('pt-user-admin', user.admin ? '1' : '0');
                window.location.href = 'dashboard.html';
            } else {
                showError('Password errata. Riprova! 🔑');
                submitBtn.innerHTML = 'Accedi <i class="fas fa-arrow-right"></i>';
                submitBtn.disabled = false;
                passEl.value = '';
                passEl.focus();
            }
        }, 600);
    });
}
