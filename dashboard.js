// ═══════════════════════════════════════════════════════════════
//  PLOT TWISTERS — Dashboard Logic (Non-Module UMD)
// ═══════════════════════════════════════════════════════════════

// ─── GLOBALS ──────────────────────────────────────────────────
let currentUser   = null;
let isAdmin       = false;
let editingEntry  = null; // entry ID being edited
let selectedMood  = '✨';
let diaryUnsub    = null; // Firestore listener unsubscribe

// ─── THEME ────────────────────────────────────────────────────
const savedTheme = localStorage.getItem('pt-theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
updateThemeButton(savedTheme);

const themeToggleBtn = document.getElementById('theme-toggle-dash');
if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        const curr = document.documentElement.getAttribute('data-theme');
        const next = curr === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('pt-theme', next);
        updateThemeButton(next);
    });
}

function updateThemeButton(theme) {
    const btn   = document.getElementById('theme-toggle-dash');
    const label = document.getElementById('theme-label');
    if (!btn) return;
    const icon = btn.querySelector('i');
    if (icon) icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    if (label) label.textContent = theme === 'dark' ? 'Tema chiaro' : 'Tema scuro';
}

// ─── AUTH GUARD & INIT ────────────────────────────────────────
const loader = document.getElementById('page-loader');

function initDashboard() {
    if (!window.auth || !window.db) {
        console.warn("Firebase non caricato correttamente.");
        if (loader) loader.classList.add('hidden');
        return;
    }

    window.auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        currentUser = user;
        await initUser(user);
        if (loader) loader.classList.add('hidden');
    });
}

// Execute when ready
setTimeout(initDashboard, 500);

async function initUser(user) {
    const userRef  = window.db.collection('users').doc(user.uid);
    let profile = { displayName: user.email.split('@')[0], role: 'member' };

    try {
        const userSnap = await userRef.get();
        if (userSnap.exists) {
            profile = { ...profile, ...userSnap.data() };
        } else {
            // First login: create profile in firestore
            const newProfile = {
                email:       user.email,
                displayName: user.displayName || user.email.split('@')[0],
                role:        'member',
                createdAt:   firebase.firestore.FieldValue.serverTimestamp()
            };
            await userRef.set(newProfile);
            profile = newProfile;
        }
    } catch (e) {
        console.warn("Impossibile caricare profilo da Firestore (modalità offline/permessi):", e);
    }

    isAdmin = profile.role === 'admin';

    // Update sidebar UI
    const name = profile.displayName || user.email.split('@')[0];
    document.getElementById('dash-user-name').textContent = name;
    document.getElementById('dash-user-role').textContent = isAdmin ? 'Admin ✦' : 'Membro';
    document.getElementById('dash-avatar').textContent = name.charAt(0).toUpperCase();

    // Show admin sections if admin
    if (isAdmin) {
        const navAdmin = document.getElementById('nav-admin');
        const adminBar = document.getElementById('pdf-admin-bar');
        if (navAdmin) navAdmin.classList.remove('hidden');
        if (adminBar) adminBar.classList.remove('hidden');
    }

    // Load diary & PDFs
    loadDiary(user.uid);
    loadPdfs();
    loadAdminConfig();
}

// ─── LOGOUT ────────────────────────────────────────────────────
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        if (diaryUnsub) diaryUnsub();
        if (window.auth) {
            await window.auth.signOut();
        }
        window.location.href = 'login.html';
    });
}

// ─── TAB SWITCHING ─────────────────────────────────────────────
window.switchTab = function(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.dash-nav-btn').forEach(b => b.classList.remove('active'));
    
    const targetTab = document.getElementById(`tab-${tabName}`);
    const targetNav = document.getElementById(`nav-${tabName}`);
    if (targetTab) targetTab.classList.add('active');
    if (targetNav) targetNav.classList.add('active');
};

// ═══════════════════════════════════════════════════════════════
//  DIARIO DI BORDO
// ═══════════════════════════════════════════════════════════════

function loadDiary(uid) {
    if (!window.db) return;
    const entriesRef = window.db.collection('diaries').doc(uid).collection('entries');
    
    // Real-time listener
    diaryUnsub = entriesRef.orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
        const entries = [];
        snapshot.forEach(d => entries.push({ id: d.id, ...d.data() }));
        renderEntries(entries);
    }, (err) => {
        console.error('Errore caricamento diario:', err);
    });
}

function renderEntries(entries) {
    const grid  = document.getElementById('diary-entries-grid');
    const empty = document.getElementById('diary-empty');
    const count = document.getElementById('entries-count');
    if (!grid) return;

    if (!entries.length) {
        grid.innerHTML  = '';
        if (empty) empty.classList.remove('hidden');
        if (count) count.textContent = '';
        return;
    }
    if (empty) empty.classList.add('hidden');
    if (count) count.textContent = `${entries.length} appunt${entries.length === 1 ? 'o' : 'i'}`;

    grid.innerHTML = entries.map(e => {
        const date = e.createdAt
            ? new Date(e.createdAt.seconds * 1000).toLocaleDateString('it-IT', { day:'2-digit', month:'long', year:'numeric' })
            : '';
        const preview = (e.content || '').replace(/<[^>]*>/g, '').substring(0, 160);
        return `
        <div class="diary-entry-card" onclick="openEntry('${e.id}')">
            <div class="entry-header">
                <span class="entry-mood">${e.mood || '✨'}</span>
                <div class="entry-meta">
                    <span class="entry-date">${date}</span>
                    <div class="entry-title">${escHtml(e.title || 'Senza titolo')}</div>
                </div>
            </div>
            <p class="entry-preview">${escHtml(preview)}${preview.length >= 160 ? '…' : ''}</p>
            <div class="entry-footer">
                <span></span>
                <div class="entry-actions" onclick="event.stopPropagation()">
                    <button class="entry-action-btn" onclick="editEntry('${e.id}')" title="Modifica">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button class="entry-action-btn delete" onclick="deleteEntry('${e.id}')" title="Elimina">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>`;
    }).join('');
}

window.openEntry = function(id) {
    window.editEntry(id);
};

// ─── EDITOR ────────────────────────────────────────────────────
window.openEditor = function() {
    editingEntry = null;
    document.getElementById('entry-title-input').value   = '';
    document.getElementById('entry-content-input').value = '';
    selectMoodByValue('✨');
    document.getElementById('diary-editor').classList.remove('hidden');
    document.getElementById('new-entry-btn').classList.add('hidden');
    document.getElementById('entry-title-input').focus();
};

window.cancelEditor = function() {
    document.getElementById('diary-editor').classList.add('hidden');
    document.getElementById('new-entry-btn').classList.remove('hidden');
    editingEntry = null;
};

window.editEntry = async function(id) {
    if (!window.db || !currentUser) return;
    const ref  = window.db.collection('diaries').doc(currentUser.uid).collection('entries').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return;
    const data = snap.data();
    editingEntry = id;
    document.getElementById('entry-title-input').value   = data.title   || '';
    document.getElementById('entry-content-input').value = data.content || '';
    selectMoodByValue(data.mood || '✨');
    document.getElementById('diary-editor').classList.remove('hidden');
    document.getElementById('new-entry-btn').classList.add('hidden');
    document.getElementById('entry-title-input').focus();
    
    document.getElementById('diary-editor').scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.saveEntry = async function() {
    if (!window.db || !currentUser) return;
    const title   = document.getElementById('entry-title-input').value.trim();
    const content = document.getElementById('entry-content-input').value.trim();

    if (!content) {
        document.getElementById('entry-content-input').focus();
        return;
    }

    const btn = document.getElementById('save-entry-btn');
    btn.innerHTML = '<span class="spinner"></span>';
    btn.disabled = true;

    try {
        const uid         = currentUser.uid;
        const entriesRef  = window.db.collection('diaries').doc(uid).collection('entries');
        const payload     = {
            title:     title || 'Senza titolo',
            content,
            mood:      selectedMood,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (editingEntry) {
            await entriesRef.doc(editingEntry).update(payload);
        } else {
            await entriesRef.add({ ...payload, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
        }

        cancelEditor();
    } catch (err) {
        console.error('Save error:', err);
        alert('Errore nel salvare. Riprova!');
    } finally {
        btn.innerHTML = '<i class="fas fa-save"></i> Salva';
        btn.disabled  = false;
    }
};

window.deleteEntry = async function(id) {
    if (!confirm('Eliminare questo appunto?')) return;
    try {
        await window.db.collection('diaries').doc(currentUser.uid).collection('entries').doc(id).delete();
    } catch (err) {
        console.error('Delete error:', err);
    }
};

window.selectMood = function(btn) {
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedMood = btn.dataset.mood;
};

function selectMoodByValue(mood) {
    selectedMood = mood;
    document.querySelectorAll('.mood-btn').forEach(b => {
        b.classList.toggle('selected', b.dataset.mood === mood);
    });
}

// ═══════════════════════════════════════════════════════════════
//  LIBRERIA PDF
// ═══════════════════════════════════════════════════════════════

async function loadPdfs() {
    if (!window.db) return;
    const grid  = document.getElementById('pdf-grid');
    const empty = document.getElementById('pdf-empty');
    if (!grid) return;

    try {
        const snap = await window.db.collection('pdfs').orderBy('createdAt', 'desc').get();
        const pdfs = [];
        snap.forEach(d => pdfs.push({ id: d.id, ...d.data() }));

        if (!pdfs.length) {
            grid.innerHTML = '';
            if (empty) empty.classList.remove('hidden');
            return;
        }
        if (empty) empty.classList.add('hidden');
        grid.innerHTML = pdfs.map(pdf => renderPdfCard(pdf)).join('');
    } catch (err) {
        console.error('PDF load error:', err);
    }
}

function renderPdfCard(pdf) {
    const coverInner = pdf.coverUrl
        ? `<img src="${escHtml(pdf.coverUrl)}" alt="${escHtml(pdf.title)}" onerror="this.parentElement.innerHTML='<span class=pdf-icon>📄</span>'">`
        : `<span class="pdf-icon">📄</span>`;
    const deleteBtn = isAdmin
        ? `<button onclick="deletePdf('${pdf.id}')" style="font-size:0.72rem;color:#e05b5b;background:none;border:none;cursor:pointer;display:flex;align-items:center;gap:0.3rem;"><i class='fas fa-trash'></i></button>`
        : '';
    return `
    <div class="pdf-card">
        <div class="pdf-card-cover">
            ${coverInner}
            <div class="pdf-cover-overlay">
                <a href="${escHtml(pdf.url)}" target="_blank" rel="noopener" class="pdf-open-btn">
                    <i class="fas fa-eye"></i> Apri
                </a>
            </div>
        </div>
        <div class="pdf-card-body">
            <div class="pdf-card-title">${escHtml(pdf.title)}</div>
            <div class="pdf-card-author">${escHtml(pdf.author || '')}</div>
            <div style="display:flex;align-items:center;justify-content:space-between;">
                <span class="pdf-card-tag">${escHtml(pdf.category || 'PDF')}</span>
                ${deleteBtn}
            </div>
        </div>
    </div>`;
}

window.togglePdfForm = function() {
    const form = document.getElementById('pdf-add-form');
    if (form) form.classList.toggle('hidden');
};

window.addPdf = async function() {
    if (!window.db) return;
    const title    = document.getElementById('pdf-title').value.trim();
    const author   = document.getElementById('pdf-author').value.trim();
    const url      = document.getElementById('pdf-url').value.trim();
    const coverUrl = document.getElementById('pdf-cover').value.trim();
    const category = document.getElementById('pdf-category').value.trim();

    if (!title || !url) { alert('Titolo e link sono obbligatori!'); return; }

    try {
        await window.db.collection('pdfs').add({
            title, author, url, coverUrl, category,
            addedBy: currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        ['pdf-title','pdf-author','pdf-url','pdf-cover','pdf-category'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        togglePdfForm();
        loadPdfs();
    } catch (err) {
        console.error('Add PDF error:', err);
        alert('Errore nel salvare il PDF. Riprova!');
    }
};

window.deletePdf = async function(id) {
    if (!confirm('Eliminare questo PDF dalla libreria?')) return;
    try {
        await window.db.collection('pdfs').doc(id).delete();
        loadPdfs();
    } catch (err) {
        console.error('Delete PDF error:', err);
    }
};

// ═══════════════════════════════════════════════════════════════
//  ADMIN SECTIONS
// ═══════════════════════════════════════════════════════════════

async function loadAdminConfig() {
    if (!window.db) return;
    try {
        const bookDoc = await window.db.collection('config').doc('currentBook').get();
        if (bookDoc.exists) {
            const data = bookDoc.data();
            const titleEl = document.getElementById('admin-book-title');
            const authorEl = document.getElementById('admin-book-author');
            const coverEl = document.getElementById('admin-book-cover');
            const progEl = document.getElementById('admin-book-progress');
            
            if (titleEl) titleEl.value = data.title || '';
            if (authorEl) authorEl.value = data.author || '';
            if (coverEl) coverEl.value = data.cover || '';
            if (progEl) progEl.value = data.progress || 0;
        }
    } catch(e) {
        console.warn("Impossibile caricare config del libro (normale se non admin o prima inizializzazione)", e);
    }
}

window.createMember = async function() {
    if (!window.auth || !window.db) return;
    const email   = document.getElementById('admin-new-email').value.trim();
    const pass    = document.getElementById('admin-new-password').value;
    const name    = document.getElementById('admin-new-name').value.trim();
    const isAdm   = document.getElementById('admin-new-is-admin').checked;
    const msgEl   = document.getElementById('admin-create-msg');

    if (!email || !pass || pass.length < 6) {
        msgEl.style.color = '#e05b5b';
        msgEl.textContent = 'Email e password (min. 6 caratteri) obbligatori.';
        return;
    }

    msgEl.style.color = 'var(--plum-light)';
    msgEl.textContent = 'Creazione in corso…';

    try {
        // Warning: Creating user on client changes active login session. 
        // We will create it via an auxiliary app instance if needed, to avoid logging out the admin.
        // Let's create a secondary app to create users without kicking out the current admin!
        const secondaryApp = firebase.initializeApp(firebaseConfig, "SecondaryApp");
        const cred = await secondaryApp.auth().createUserWithEmailAndPassword(email, pass);
        const newUid = cred.user.uid;

        if (name) {
            await cred.user.updateProfile({ displayName: name });
        }

        // Save profile using secondary user auth context or primary database context (with rules permitting)
        await window.db.collection('users').doc(newUid).set({
            email,
            displayName: name || email.split('@')[0],
            role: isAdm ? 'admin' : 'member',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Sign out secondary app
        await secondaryApp.auth().signOut();
        await secondaryApp.delete();

        msgEl.style.color = 'var(--lilac-deep)';
        msgEl.textContent = `✦ Account creato per ${name || email}!`;

        ['admin-new-email','admin-new-password','admin-new-name'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        document.getElementById('admin-new-is-admin').checked = false;
    } catch (err) {
        msgEl.style.color = '#e05b5b';
        msgEl.textContent = `Errore: ${err.message}`;
    }
};

window.updateCurrentBook = async function() {
    if (!window.db) return;
    const title    = document.getElementById('admin-book-title').value.trim();
    const author   = document.getElementById('admin-book-author').value.trim();
    const cover    = document.getElementById('admin-book-cover').value.trim();
    const progress = parseInt(document.getElementById('admin-book-progress').value, 10) || 0;

    if (!title) { alert('Inserisci almeno il titolo!'); return; }

    try {
        await window.db.collection('config').doc('currentBook').set({
            title, author, cover, progress,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert('Libro aggiornato! ✦ Le modifiche saranno visibili sul sito.');
    } catch (err) {
        alert('Errore: ' + err.message);
    }
};

window.downloadNewsletter = function() {
    const emails = JSON.parse(localStorage.getItem('newsletter_emails') || '[]');
    if (!emails.length) { alert('Nessuna iscrizione ancora ☕'); return; }
    const csv  = 'data:text/csv;charset=utf-8,Email\n' + emails.map(e => `"${e}"`).join('\n');
    const link = document.createElement('a');
    link.href  = encodeURI(csv);
    link.download = 'iscritte_plot_twisters.csv';
    link.click();
};

// ─── UTILS ────────────────────────────────────────────────────
function escHtml(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
