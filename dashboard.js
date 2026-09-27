// ═══════════════════════════════════════════════════════════════
//  PLOT TWISTERS — Dashboard (solo localStorage, niente Firebase)
// ═══════════════════════════════════════════════════════════════

// ─── AUTENTICAZIONE ───────────────────────────────────────────
if (localStorage.getItem('pt-auth') !== '1') {
    window.location.replace('login.html');
}

const currentUser = localStorage.getItem('pt-user-name') || 'Membro';
const isAdmin = localStorage.getItem('pt-user-admin') === '1';

// ─── GLOBALS ──────────────────────────────────────────────────
let editingEntry = null;
let selectedMood = '✨';
let currentRating = 5;
let currentDiaryCategory = 'all';

// ─── TEMA ─────────────────────────────────────────────────────
(function applyTheme() {
    const saved = localStorage.getItem('pt-theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeButton(saved);
})();

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

// ─── INIT ─────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('page-loader');
    if (loader) setTimeout(() => loader.classList.add('hidden'), 500);

    // Sidebar utente
    document.getElementById('dash-user-name').textContent = currentUser;
    document.getElementById('dash-user-role').textContent = isAdmin ? 'Admin ✦' : 'Membro';
    document.getElementById('dash-avatar').textContent = currentUser.charAt(0).toUpperCase();

    // Mostra/Nascondi admin
    if (isAdmin) {
        const navAdmin = document.getElementById('nav-admin');
        const meetingAdminBar = document.getElementById('meeting-admin-bar');
        const pdfAdminBar = document.getElementById('pdf-admin-bar');
        if (navAdmin) navAdmin.classList.remove('hidden');
        if (meetingAdminBar) meetingAdminBar.classList.remove('hidden');
        if (pdfAdminBar) pdfAdminBar.classList.remove('hidden');
    }

    loadDiary();
    loadReviews();
    loadWishlist();
    loadMeetings();
    loadBookCrush();
    loadLeaderboard();
    loadPdfs();
    
    if (isAdmin) {
        loadNewsMediaAdmin();
        loadNewsNoticesAdmin();
        loadCurrentBookAdmin();
    }
    
    // Inizializza stelle
    setRating(5);
});

// ─── LOGOUT ───────────────────────────────────────────────────
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('pt-auth');
        window.location.href = 'login.html';
    });
}

// ─── TAB SWITCHING ────────────────────────────────────────────
window.switchTab = function(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.dash-nav-btn').forEach(b => b.classList.remove('active'));
    const targetTab = document.getElementById(`tab-${tabName}`);
    const targetNav = document.getElementById(`nav-${tabName}`);
    if (targetTab) targetTab.classList.add('active');
    if (targetNav) {
        targetNav.classList.add('active');
        
        // Aggiorna il testo del pulsante toggle mobile
        const toggleText = document.getElementById('dash-menu-toggle-text');
        if (toggleText) {
            toggleText.textContent = targetNav.textContent.trim();
        }
    }

    // Chiudi il menu mobile se aperto
    const navMenu = document.getElementById('dash-nav-menu');
    if (navMenu) navMenu.classList.remove('open');

    // Su mobile (schermo <= 768px), scorri automaticamente fino al contenuto della scheda
    if (window.innerWidth <= 768) {
        const mainContent = document.querySelector('.dash-main');
        if (mainContent) {
            mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
};

window.toggleMobileMenu = function() {
    const nav = document.getElementById('dash-nav-menu');
    if (nav) nav.classList.toggle('open');
};

// ═══════════════════════════════════════════════════════════════
//  DIARIO DI BORDO (Personale)
// ═══════════════════════════════════════════════════════════════

function getDiaryKey() { return `pt-diary-${currentUser}`; }

function getDiaryEntries() {
    try { return JSON.parse(localStorage.getItem(getDiaryKey()) || '[]'); } 
    catch { return []; }
}
function saveDiaryEntries(entries) { localStorage.setItem(getDiaryKey(), JSON.stringify(entries)); }

function loadDiary() {
    renderDiaryFilters();
    renderEntries(getDiaryEntries());
}

window.filterDiary = function(category, btnEl) {
    currentDiaryCategory = category;
    document.querySelectorAll('#diary-category-filters .cat-btn').forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');
    renderEntries(getDiaryEntries());
};

function renderDiaryFilters() {
    const entries = getDiaryEntries();
    const categories = new Set();
    entries.forEach(e => { if (e.category) categories.add(e.category); });
    
    const container = document.getElementById('diary-category-filters');
    if (!container) return;
    
    let html = `<button class="cat-btn ${currentDiaryCategory === 'all' ? 'active' : ''}" onclick="filterDiary('all', this)">📂 Tutti</button>`;
    categories.forEach(cat => {
        html += `<button class="cat-btn ${currentDiaryCategory === cat ? 'active' : ''}" onclick="filterDiary('${escHtml(cat)}', this)">${escHtml(cat)}</button>`;
    });
    container.innerHTML = html;
}

function renderEntries(entries) {
    const grid  = document.getElementById('diary-entries-grid');
    const empty = document.getElementById('diary-empty');
    const count = document.getElementById('entries-count');
    if (!grid) return;

    let filtered = entries;
    if (currentDiaryCategory !== 'all') {
        filtered = entries.filter(e => e.category === currentDiaryCategory);
    }

    if (!filtered.length) {
        grid.innerHTML = '';
        if (empty) empty.classList.remove('hidden');
        if (count) count.textContent = '';
        return;
    }
    if (empty) empty.classList.add('hidden');
    if (count) count.textContent = `${filtered.length} appunt${filtered.length === 1 ? 'o' : 'i'}`;

    const sorted = [...filtered].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    grid.innerHTML = sorted.map(e => {
        const date = e.createdAt ? new Date(e.createdAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' }) : '';
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
                <span style="font-size:0.75rem;color:var(--plum-light);background:var(--ivory-2);padding:0.2rem 0.6rem;border-radius:1rem;">${escHtml(e.category || 'Note Generali')}</span>
                <div class="entry-actions" onclick="event.stopPropagation()">
                    <button class="entry-action-btn" onclick="editEntry('${e.id}')" title="Modifica"><i class="fas fa-pen"></i></button>
                    <button class="entry-action-btn delete" onclick="deleteEntry('${e.id}')" title="Elimina"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        </div>`;
    }).join('');
}

window.openEditor = function() {
    editingEntry = null;
    document.getElementById('entry-title-input').value = '';
    document.getElementById('entry-content-input').value = '';
    document.getElementById('entry-category-custom').value = '';
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

window.editEntry = function(id) {
    const entries = getDiaryEntries();
    const entry = entries.find(e => e.id === id);
    if (!entry) return;
    editingEntry = id;
    document.getElementById('entry-title-input').value = entry.title || '';
    document.getElementById('entry-content-input').value = entry.content || '';
    
    const catSelect = document.getElementById('entry-category-input');
    const catCustom = document.getElementById('entry-category-custom');
    
    let found = false;
    for(let i=0; i<catSelect.options.length; i++) {
        if(catSelect.options[i].value === entry.category) { found = true; break; }
    }
    if(found) {
        catSelect.value = entry.category || 'Note Generali';
        catCustom.value = '';
    } else {
        catSelect.value = 'Note Generali';
        catCustom.value = entry.category || '';
    }
    
    selectMoodByValue(entry.mood || '✨');
    document.getElementById('diary-editor').classList.remove('hidden');
    document.getElementById('new-entry-btn').classList.add('hidden');
    document.getElementById('diary-editor').scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.saveEntry = function() {
    const title = document.getElementById('entry-title-input').value.trim();
    const content = document.getElementById('entry-content-input').value.trim();
    const catSelect = document.getElementById('entry-category-input').value;
    const catCustom = document.getElementById('entry-category-custom').value.trim();
    
    const category = catCustom || catSelect || 'Note Generali';

    if (!content) { document.getElementById('entry-content-input').focus(); return; }

    const entries = getDiaryEntries();
    const now = Date.now();

    if (editingEntry) {
        const idx = entries.findIndex(e => e.id === editingEntry);
        if (idx !== -1) {
            entries[idx] = { ...entries[idx], title: title || 'Senza titolo', content, category, mood: selectedMood, updatedAt: now };
        }
    } else {
        entries.push({ id: 'entry-' + now, title: title || 'Senza titolo', content, category, mood: selectedMood, createdAt: now, updatedAt: now });
    }

    saveDiaryEntries(entries);
    cancelEditor();
    loadDiary();
};

window.deleteEntry = function(id) {
    if (!confirm('Eliminare questo appunto?')) return;
    saveDiaryEntries(getDiaryEntries().filter(e => e.id !== id));
    loadDiary();
};

window.selectMood = function(btn) {
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedMood = btn.dataset.mood;
};

function selectMoodByValue(mood) {
    selectedMood = mood;
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.toggle('selected', b.dataset.mood === mood));
}

// ═══════════════════════════════════════════════════════════════
//  RECENSIONI (Globale per il club)
// ═══════════════════════════════════════════════════════════════

function getReviews() { try { return JSON.parse(localStorage.getItem('pt-reviews') || '[]'); } catch { return []; } }
function saveReviews(reviews) { localStorage.setItem('pt-reviews', JSON.stringify(reviews)); }

window.setRating = function(val) {
    currentRating = val;
    document.querySelectorAll('.star-btn').forEach(btn => {
        btn.classList.toggle('lit', parseInt(btn.dataset.val) <= val);
    });
};

function loadReviews() {
    const reviews = getReviews();
    const list = document.getElementById('reviews-list');
    const empty = document.getElementById('reviews-empty');
    if (!list) return;

    if (!reviews.length) {
        list.innerHTML = '';
        if (empty) empty.classList.remove('hidden');
        return;
    }
    if (empty) empty.classList.add('hidden');
    
    // Ordina per data decrescente
    const sorted = [...reviews].sort((a,b) => b.createdAt - a.createdAt);

    list.innerHTML = sorted.map(r => {
        let stars = '';
        for(let i=0; i<5; i++) stars += i < r.rating ? '★' : '☆';
        
        const isMine = r.user === currentUser;
        const deleteBtn = isMine ? `<button onclick="deleteReview('${r.id}')" style="background:none;border:none;color:#e05b5b;cursor:pointer;"><i class="fas fa-trash"></i></button>` : '';

        return `
        <div class="review-card-personal">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <div class="review-stars">${stars}</div>
                    <div class="review-book-title">${escHtml(r.title)}</div>
                    <div class="review-book-author">di ${escHtml(r.author)}</div>
                </div>
                ${deleteBtn}
            </div>
            <p class="review-text-personal">"${escHtml(r.text)}"</p>
            <div style="margin-top:0.75rem; font-size:0.8rem; color:var(--plum-light); display:flex; align-items:center; gap:0.5rem;">
                <span class="lb-avatar" style="width:1.5rem;height:1.5rem;font-size:0.6rem;">${r.user.charAt(0)}</span>
                <strong>${escHtml(r.user)}</strong> • ${new Date(r.createdAt).toLocaleDateString('it-IT')}
            </div>
        </div>
        `;
    }).join('');
    
    loadLeaderboard(); // Aggiorna classifica quando cambiano le recensioni
}

window.saveReview = function() {
    const title = document.getElementById('rev-book-title').value.trim();
    const author = document.getElementById('rev-book-author').value.trim();
    const text = document.getElementById('rev-text').value.trim();

    if (!title || !text) { alert('Titolo e testo sono obbligatori!'); return; }

    const reviews = getReviews();
    reviews.push({ id: 'rev-' + Date.now(), user: currentUser, title, author, text, rating: currentRating, createdAt: Date.now() });
    saveReviews(reviews);

    document.getElementById('rev-book-title').value = '';
    document.getElementById('rev-book-author').value = '';
    document.getElementById('rev-text').value = '';
    setRating(5);
    
    loadReviews();
};

window.deleteReview = function(id) {
    if(!confirm('Eliminare la recensione?')) return;
    saveReviews(getReviews().filter(r => r.id !== id));
    loadReviews();
};

// ═══════════════════════════════════════════════════════════════
//  LISTA DESIDERI (Personale)
// ═══════════════════════════════════════════════════════════════

function getWishlistKey() { return `pt-wishlist-${currentUser}`; }
function getWishlist() { try { return JSON.parse(localStorage.getItem(getWishlistKey()) || '[]'); } catch { return []; } }
function saveWishlist(list) { localStorage.setItem(getWishlistKey(), JSON.stringify(list)); }

function loadWishlist() {
    const list = getWishlist();
    const container = document.getElementById('wish-list');
    const empty = document.getElementById('wish-empty');
    if (!container) return;

    if (!list.length) {
        container.innerHTML = '';
        if(empty) empty.classList.remove('hidden');
        return;
    }
    if(empty) empty.classList.add('hidden');

    container.innerHTML = list.map(w => `
        <div class="wish-item">
            <div class="wish-cover">📖</div>
            <div class="wish-info">
                <div class="wish-title">${escHtml(w.title)}</div>
                <div class="wish-author">${escHtml(w.author)} ${w.notes ? `<span style="opacity:0.7">— ${escHtml(w.notes)}</span>` : ''}</div>
            </div>
            <button class="wish-delete" onclick="deleteWish('${w.id}')"><i class="fas fa-times"></i></button>
        </div>
    `).join('');
}

window.addWish = function() {
    const title = document.getElementById('wish-title').value.trim();
    const author = document.getElementById('wish-author').value.trim();
    const notes = document.getElementById('wish-notes').value.trim();
    if(!title) { alert('Inserisci il titolo!'); return; }
    
    const list = getWishlist();
    list.push({ id: 'wish-' + Date.now(), title, author, notes });
    saveWishlist(list);
    
    document.getElementById('wish-title').value = '';
    document.getElementById('wish-author').value = '';
    document.getElementById('wish-notes').value = '';
    loadWishlist();
};

window.deleteWish = function(id) {
    saveWishlist(getWishlist().filter(w => w.id !== id));
    loadWishlist();
};

// ═══════════════════════════════════════════════════════════════
//  CALENDARIO INCONTRI (Globale, gestito da admin)
// ═══════════════════════════════════════════════════════════════

function getMeetings() { try { return JSON.parse(localStorage.getItem('pt-meetings') || '[]'); } catch { return []; } }
function saveMeetings(m) { localStorage.setItem('pt-meetings', JSON.stringify(m)); }

function loadMeetings() {
    const meetings = getMeetings();
    const list = document.getElementById('meeting-list');
    const empty = document.getElementById('meeting-empty');
    if(!list) return;

    if(!meetings.length) {
        list.innerHTML = '';
        if(empty) empty.classList.remove('hidden');
        return;
    }
    if(empty) empty.classList.add('hidden');

    // Ordina per data (più recenti / futuri)
    const sorted = [...meetings].sort((a,b) => new Date(a.date) - new Date(b.date));

    list.innerHTML = sorted.map(m => {
        const d = new Date(m.date);
        const day = isNaN(d) ? '✦' : d.getDate();
        const mon = isNaN(d) ? '' : d.toLocaleDateString('it-IT', {month: 'short'});
        const icon = m.icon || '📅';
        const pageUrl = `evento-singolo.html?event=${m.id}`;
        
        const adminActions = isAdmin ? `
            <div style="display:flex; gap:0.5rem; align-items:center; margin-top:0.75rem;">
                <a href="${pageUrl}" target="_blank" class="btn-outline" style="font-size:0.78rem; padding:0.35rem 0.75rem; text-decoration:none; display:inline-flex; align-items:center; gap:0.3rem;">
                    <i class="fas fa-external-link-alt"></i> Pagina Evento
                </a>
                <button onclick="editMeetingAdmin('${m.id}')" class="btn-ghost" style="font-size:0.78rem; padding:0.35rem 0.75rem; border:1px solid var(--border); border-radius:var(--r-sm); cursor:pointer;">
                    <i class="fas fa-edit"></i> Modifica
                </button>
                <button onclick="deleteMeeting('${m.id}')" class="btn-ghost" style="font-size:0.78rem; padding:0.35rem 0.75rem; color:#e05b5b; border:1px solid #e05b5b44; border-radius:var(--r-sm); cursor:pointer;">
                    <i class="fas fa-trash"></i> Elimina
                </button>
            </div>
        ` : `
            <div style="margin-top:0.5rem;">
                <a href="${pageUrl}" class="btn-outline" style="font-size:0.78rem; padding:0.35rem 0.75rem; text-decoration:none; display:inline-flex; align-items:center; gap:0.3rem;">
                    <i class="fas fa-external-link-alt"></i> Visualizza Dettagli Pagina
                </a>
            </div>
        `;
        
        return `
        <div class="meeting-item" style="display:flex; gap:1.25rem; align-items:flex-start; padding:1.25rem; background:var(--surface-1); border-radius:var(--r-md); border:1px solid var(--border); margin-bottom:1rem;">
            <div class="meeting-date-box" style="flex-shrink:0; text-align:center; min-width:65px; background:var(--lilac-deep); color:white; padding:0.75rem 0.5rem; border-radius:var(--r-sm);">
                <div style="font-size:1.1rem; margin-bottom:0.2rem;">${icon}</div>
                <div class="meet-day" style="font-size:1.3rem; font-weight:700; line-height:1;">${day}</div>
                <div class="meet-mon" style="font-size:0.65rem; text-transform:uppercase;">${mon}</div>
            </div>
            <div class="meeting-info" style="flex:1;">
                <h4 style="font-size:1.05rem; font-weight:700; color:var(--plum-dark); margin-bottom:0.3rem;">${escHtml(m.title)}</h4>
                <p style="font-size:0.85rem; color:var(--plum-light); margin:0 0 0.4rem 0;">
                    <i class="fas fa-clock" style="color:var(--lilac-mid);"></i> ore ${escHtml(m.time || '18:00')} • <i class="fas fa-map-marker-alt" style="color:var(--lilac-mid);"></i> ${escHtml(m.location || 'Libreria Cose d\'Interni')}
                </p>
                ${m.description ? `<p style="font-size:0.83rem; color:var(--plum-dark); margin:0.3rem 0 0 0; line-height:1.5; display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${escHtml(m.description)}</p>` : ''}
                ${adminActions}
            </div>
        </div>
        `;
    }).join('');
}

window.addMeeting = function() {
    const title = document.getElementById('meet-title').value.trim();
    const icon = document.getElementById('meet-icon') ? document.getElementById('meet-icon').value.trim() || '📅' : '📅';
    const date = document.getElementById('meet-date').value;
    const time = document.getElementById('meet-time').value || '18:00';
    const location = document.getElementById('meet-location').value.trim() || 'Libreria Cose d\'Interni, Capua';
    const cover = document.getElementById('meet-cover') ? document.getElementById('meet-cover').value.trim() : '';
    const description = document.getElementById('meet-desc') ? document.getElementById('meet-desc').value.trim() : '';
    
    if(!title || !date) { 
        alert('Compila almeno il titolo e la data dell\'evento!'); 
        return; 
    }
    
    const m = getMeetings();
    const newId = 'meet-' + Date.now();
    m.push({ 
        id: newId, 
        title, 
        icon, 
        date, 
        time, 
        location, 
        cover, 
        description 
    });
    
    saveMeetings(m);
    
    // Pulisci i campi
    document.getElementById('meet-title').value = '';
    document.getElementById('meet-date').value = '';
    if(document.getElementById('meet-cover')) document.getElementById('meet-cover').value = '';
    if(document.getElementById('meet-desc')) document.getElementById('meet-desc').value = '';
    
    loadMeetings();
    alert('✦ Evento creato con successo! La pagina dedicata è pronta.');
};

window.editMeetingAdmin = function(id) {
    const meetings = getMeetings();
    const m = meetings.find(x => x.id === id);
    if (!m) return;

    let modal = document.getElementById('dash-edit-event-modal');
    if (!modal) {
        modal = document.createElement('dialog');
        modal.id = 'dash-edit-event-modal';
        modal.style.cssText = 'border:none; border-radius:var(--r-md); padding:2rem; max-width:550px; width:90%; box-shadow:var(--shadow-lg); background:var(--surface-1); color:var(--plum-dark);';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <form id="dash-edit-event-form" style="font-family:var(--font-sans); display:flex; flex-direction:column; gap:1rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border); padding-bottom:0.75rem;">
                <h3 style="font-family:var(--font-display); color:var(--lilac-deep); margin:0; font-size:1.3rem;">Modifica Evento e Pagina</h3>
                <button type="button" onclick="document.getElementById('dash-edit-event-modal').close()" style="background:none; border:none; font-size:1.5rem; cursor:pointer;">&times;</button>
            </div>
            
            <div class="input-group">
                <label style="font-size:0.85rem; font-weight:600;">Titolo Incontro *</label>
                <input type="text" name="title" value="${escHtml(m.title)}" required style="padding:0.5rem; border:1px solid var(--border); border-radius:var(--r-sm); background:var(--surface-2); color:var(--plum-dark); width:100%; box-sizing:border-box;">
            </div>
            
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
                <div class="input-group">
                    <label style="font-size:0.85rem; font-weight:600;">Data *</label>
                    <input type="date" name="date" value="${m.date}" required style="padding:0.5rem; border:1px solid var(--border); border-radius:var(--r-sm); background:var(--surface-2); color:var(--plum-dark); width:100%; box-sizing:border-box;">
                </div>
                <div class="input-group">
                    <label style="font-size:0.85rem; font-weight:600;">Ora</label>
                    <input type="time" name="time" value="${m.time || '18:00'}" required style="padding:0.5rem; border:1px solid var(--border); border-radius:var(--r-sm); background:var(--surface-2); color:var(--plum-dark); width:100%; box-sizing:border-box;">
                </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 2fr; gap:0.75rem;">
                <div class="input-group">
                    <label style="font-size:0.85rem; font-weight:600;">Emoji Icona</label>
                    <input type="text" name="icon" value="${escHtml(m.icon || '📅')}" style="padding:0.5rem; border:1px solid var(--border); border-radius:var(--r-sm); background:var(--surface-2); color:var(--plum-dark); width:100%; box-sizing:border-box;">
                </div>
                <div class="input-group">
                    <label style="font-size:0.85rem; font-weight:600;">Luogo</label>
                    <input type="text" name="location" value="${escHtml(m.location || 'Libreria Cose d\'Interni, Capua')}" required style="padding:0.5rem; border:1px solid var(--border); border-radius:var(--r-sm); background:var(--surface-2); color:var(--plum-dark); width:100%; box-sizing:border-box;">
                </div>
            </div>

            <div class="input-group">
                <label style="font-size:0.85rem; font-weight:600;">URL Locandina / Immagine Copertina (Opzionale)</label>
                <input type="url" name="cover" value="${escHtml(m.cover || '')}" placeholder="https://..." style="padding:0.5rem; border:1px solid var(--border); border-radius:var(--r-sm); background:var(--surface-2); color:var(--plum-dark); width:100%; box-sizing:border-box;">
            </div>

            <div class="input-group">
                <label style="font-size:0.85rem; font-weight:600;">Descrizione & Contenuto Pagina Evento</label>
                <textarea name="description" rows="4" style="padding:0.5rem; border:1px solid var(--border); border-radius:var(--r-sm); background:var(--surface-2); color:var(--plum-dark); width:100%; box-sizing:border-box; resize:vertical;">${escHtml(m.description || '')}</textarea>
            </div>
            
            <div style="margin-top:0.5rem; display:flex; justify-content:flex-end; gap:0.75rem;">
                <button type="button" onclick="document.getElementById('dash-edit-event-modal').close()" class="btn-ghost" style="padding:0.5rem 1rem; border:1px solid var(--border); border-radius:var(--r-sm); cursor:pointer;">Annulla</button>
                <button type="submit" class="btn-primary" style="padding:0.5rem 1.25rem; border-radius:var(--r-sm); cursor:pointer;">Salva Modifiche</button>
            </div>
        </form>
    `;

    modal.showModal();

    document.getElementById('dash-edit-event-form').onsubmit = function(e) {
        e.preventDefault();
        const data = new FormData(e.target);
        m.title = data.get('title').trim();
        m.date = data.get('date');
        m.time = data.get('time');
        m.icon = data.get('icon').trim() || '📅';
        m.location = data.get('location').trim();
        m.cover = data.get('cover').trim();
        m.description = data.get('description').trim();

        saveMeetings(meetings);
        modal.close();
        loadMeetings();
        alert('✦ Evento e pagina aggiornati!');
    };
};

window.deleteMeeting = function(id) {
    if(!confirm('Sei sicura di voler eliminare questo evento e la sua pagina?')) return;
    saveMeetings(getMeetings().filter(m => m.id !== id));
    loadMeetings();
};

// ═══════════════════════════════════════════════════════════════
//  CLASSIFICA LETTURE (Calcolata sulle recensioni)
// ═══════════════════════════════════════════════════════════════

function loadLeaderboard() {
    const reviews = getReviews();
    const list = document.getElementById('leaderboard-list');
    if(!list) return;

    // Conta le recensioni per utente
    const counts = {};
    reviews.forEach(r => { counts[r.user] = (counts[r.user] || 0) + 1; });

    const lbData = Object.keys(counts).map(user => ({ user, count: counts[user] }));
    lbData.sort((a,b) => b.count - a.count);

    if(!lbData.length) {
        list.innerHTML = `<div class="diary-empty"><span class="diary-empty-icon">🏆</span><p>Ancora nessun libro letto. Inizia a scrivere recensioni!</p></div>`;
        return;
    }

    list.innerHTML = lbData.map((data, idx) => {
        const isMine = data.user === currentUser;
        let badge = '';
        if(idx === 0) badge = '👑';
        else if(idx === 1) badge = '🥈';
        else if(idx === 2) badge = '🥉';
        
        return `
        <div class="lb-row ${isMine ? 'mine' : ''}">
            <div class="lb-rank">${idx + 1}°</div>
            <div class="lb-avatar">${data.user.charAt(0)}</div>
            <div class="lb-name">${escHtml(data.user)} ${isMine ? '(Tu)' : ''}</div>
            <div class="lb-badge">${badge}</div>
            <div class="lb-count"><strong>${data.count}</strong> ${data.count === 1 ? 'libro' : 'libri'}</div>
        </div>
        `;
    }).join('');
}

// ═══════════════════════════════════════════════════════════════
//  BOOKCRUSH (Globale per il club)
// ═══════════════════════════════════════════════════════════════

function getBookCrush() { try { return JSON.parse(localStorage.getItem('pt-bookcrush') || '[]'); } catch { return []; } }
function saveBookCrush(list) { localStorage.setItem('pt-bookcrush', JSON.stringify(list)); }

function loadBookCrush() {
    const crushes = getBookCrush();
    const list = document.getElementById('bookcrush-list');
    const empty = document.getElementById('bookcrush-empty');
    if (!list) return;

    if (!crushes.length) {
        list.innerHTML = '';
        if (empty) empty.classList.remove('hidden');
        return;
    }
    if (empty) empty.classList.add('hidden');
    
    list.innerHTML = crushes.map(c => {
        const deleteBtn = (c.user === currentUser || isAdmin) ? `<button onclick="deleteBookCrush('${c.id}')" style="background:none;border:none;color:#e05b5b;cursor:pointer;"><i class="fas fa-trash"></i></button>` : '';
        return `
        <div class="admin-form-card" style="margin-bottom:0; display:flex; flex-direction:column;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <h3 style="font-family:'Playfair Display',serif; color:var(--lilac-deep); margin-bottom:0.2rem;">${escHtml(c.character)}</h3>
                    <p style="font-size:0.85rem; color:var(--plum-light); margin-bottom:0.5rem;">da <em>${escHtml(c.book)}</em></p>
                </div>
                ${deleteBtn}
            </div>
            <div style="background:var(--white); padding:0.75rem; border-radius:var(--r-sm); border:1px solid var(--border); font-size:0.9rem; flex:1;">
                "${escHtml(c.reason)}"
            </div>
            <div style="margin-top:0.75rem; font-size:0.8rem; color:var(--plum-light); text-align:right;">
                Scelto da <strong>${escHtml(c.user)}</strong> 💖
            </div>
        </div>
        `;
    }).join('');
}

window.addBookCrush = function() {
    const character = document.getElementById('crush-name').value.trim();
    const book = document.getElementById('crush-book').value.trim();
    const reason = document.getElementById('crush-reason').value.trim();
    
    if(!character || !book) { alert('Nome del personaggio e libro sono obbligatori!'); return; }
    
    const crushes = getBookCrush();
    crushes.unshift({ id: 'crush-' + Date.now(), user: currentUser, character, book, reason });
    saveBookCrush(crushes);
    
    document.getElementById('crush-name').value = '';
    document.getElementById('crush-book').value = '';
    document.getElementById('crush-reason').value = '';
    loadBookCrush();
};

window.deleteBookCrush = function(id) {
    if(!confirm('Spezzare questo cuore ed eliminare la BookCrush?')) return;
    saveBookCrush(getBookCrush().filter(c => c.id !== id));
    loadBookCrush();
};

// ═══════════════════════════════════════════════════════════════
//  LIBRERIA PDF (Globale)
// ═══════════════════════════════════════════════════════════════

function getPdfs() { try { return JSON.parse(localStorage.getItem('pt-pdfs') || '[]'); } catch { return []; } }
function savePdfs(pdfs) { localStorage.setItem('pt-pdfs', JSON.stringify(pdfs)); }

function loadPdfs() {
    const pdfs = getPdfs();
    const grid = document.getElementById('pdf-grid');
    const empty = document.getElementById('pdf-empty');
    if (!grid) return;

    if (!pdfs.length) {
        grid.innerHTML = '';
        if (empty) empty.classList.remove('hidden');
        return;
    }
    if (empty) empty.classList.add('hidden');
    
    grid.innerHTML = pdfs.map(pdf => {
        const coverInner = pdf.coverUrl ? `<img src="${escHtml(pdf.coverUrl)}" alt="${escHtml(pdf.title)}" onerror="this.parentElement.innerHTML='<span class=pdf-icon>📄</span>'">` : `<span class="pdf-icon">📄</span>`;
        const deleteBtn = isAdmin ? `<button onclick="deletePdf('${pdf.id}')" style="font-size:0.72rem;color:#e05b5b;background:none;border:none;cursor:pointer;display:flex;align-items:center;gap:0.3rem;"><i class='fas fa-trash'></i></button>` : '';
        return `
        <div class="pdf-card">
            <div class="pdf-card-cover">
                ${coverInner}
                <div class="pdf-cover-overlay">
                    <a href="${escHtml(pdf.url)}" target="_blank" rel="noopener" class="pdf-open-btn"><i class="fas fa-eye"></i> Apri</a>
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
    }).join('');
}

window.togglePdfForm = function() {
    const form = document.getElementById('pdf-add-form');
    if (form) form.classList.toggle('hidden');
};

window.addPdf = function() {
    const title = document.getElementById('pdf-title').value.trim();
    const author = document.getElementById('pdf-author').value.trim();
    const url = document.getElementById('pdf-url').value.trim();
    const coverUrl = document.getElementById('pdf-cover').value.trim();
    const category = document.getElementById('pdf-category').value.trim();

    if (!title || !url) { alert('Titolo e link sono obbligatori!'); return; }

    const pdfs = getPdfs();
    pdfs.unshift({ id: 'pdf-' + Date.now(), title, author, url, coverUrl, category });
    savePdfs(pdfs);

    ['pdf-title','pdf-author','pdf-url','pdf-cover','pdf-category'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    togglePdfForm();
    loadPdfs();
};

window.deletePdf = function(id) {
    if (!confirm('Eliminare questo PDF dalla libreria?')) return;
    savePdfs(getPdfs().filter(p => p.id !== id));
    loadPdfs();
};

// ═══════════════════════════════════════════════════════════════
//  ADMIN SECTIONS
// ═══════════════════════════════════════════════════════════════

window.loadCurrentBookAdmin = function() {
    const raw = localStorage.getItem('pt-current-book');
    if (!raw) return;
    try {
        const data = JSON.parse(raw);
        const titleEl = document.getElementById('admin-book-title');
        const authorEl = document.getElementById('admin-book-author');
        const coverEl = document.getElementById('admin-book-cover');
        const progressEl = document.getElementById('admin-book-progress');
        if (titleEl && data.title) titleEl.value = data.title;
        if (authorEl && data.author) authorEl.value = data.author;
        if (coverEl && data.cover) coverEl.value = data.cover;
        if (progressEl && data.progress !== undefined) progressEl.value = data.progress;
    } catch(e) {}
};

window.updateCurrentBook = function() {
    const title = document.getElementById('admin-book-title').value.trim();
    const author = document.getElementById('admin-book-author').value.trim();
    const cover = document.getElementById('admin-book-cover').value.trim();
    const progress = parseInt(document.getElementById('admin-book-progress').value, 10) || 0;
    if (!title) { alert('Inserisci almeno il titolo!'); return; }
    localStorage.setItem('pt-current-book', JSON.stringify({ title, author, cover, progress }));
    alert(`Libro aggiornato: "${title}" ✦\nRicarica la home per vedere le modifiche.`);
};


window.downloadNewsletter = function() {
    const emails = JSON.parse(localStorage.getItem('newsletter_emails') || '[]');
    if (!emails.length) { alert('Nessuna iscrizione ancora ☕'); return; }
    const csv = 'data:text/csv;charset=utf-8,Email\n' + emails.map(e => `"${e}"`).join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = 'iscritte_plot_twisters.csv';
    link.click();
};

window.addBookToArchive = function() {
    const id = document.getElementById('admin-archive-id').value.trim();
    const title = document.getElementById('admin-archive-title').value.trim();
    const author = document.getElementById('admin-archive-author').value.trim();
    const cover = document.getElementById('admin-archive-cover').value.trim();
    const stars = document.getElementById('admin-archive-stars').value.trim() || '★★★★★';
    const rating = document.getElementById('admin-archive-rating').value.trim() || '5.0';
    const desc = document.getElementById('admin-archive-desc').value.trim();

    if (!id || !title || !author) {
        alert('ID, Titolo e Autore sono obbligatori!');
        return;
    }

    let books = [];
    try {
        books = JSON.parse(localStorage.getItem('pt-books') || '[]');
    } catch (e) { }

    // Controlla se esiste già
    const existingIndex = books.findIndex(b => b.id === id);
    const newBook = { id, title, author, cover, stars, rating, desc };

    if (existingIndex >= 0) {
        if (confirm('Esiste già un libro con questo ID. Vuoi sovrascriverlo?')) {
            books[existingIndex] = newBook;
        } else {
            return;
        }
    } else {
        books.push(newBook);
    }

    localStorage.setItem('pt-books', JSON.stringify(books));
    alert("Libro aggiunto all'archivio! ✦");
    
    // Pulisci i campi
    ['admin-archive-id', 'admin-archive-title', 'admin-archive-author', 'admin-archive-cover', 'admin-archive-stars', 'admin-archive-rating', 'admin-archive-desc'].forEach(fieldId => {
        document.getElementById(fieldId).value = '';
    });
};

// ─── GESTIONE DINAMICA NEWS & AVVISI (ADMIN) ───
window.loadNewsMediaAdmin = function() {
    const raw = localStorage.getItem('pt-news-media');
    let media = {
        ytCaption: '🎬 Guarda l\'After-Book in Cucina #1 dei Plot Twisters!',
        ytCover: 'pt.jpeg',
        ytLink: 'https://www.youtube.com/watch?v=DqMhcxTwcLA',
        igVideo: 'reel.mp4',
        igCover: 'pt.jpeg',
        igLink: 'https://www.instagram.com/reel/DYoqs3MiRTX/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA=='
    };
    if (raw) {
        try { Object.assign(media, JSON.parse(raw)); } catch(e) {}
    } else {
        localStorage.setItem('pt-news-media', JSON.stringify(media));
    }

    const captionEl = document.getElementById('admin-yt-caption');
    const linkEl = document.getElementById('admin-yt-link');
    const coverEl = document.getElementById('admin-yt-cover');
    const videoEl = document.getElementById('admin-ig-video');
    const igLinkEl = document.getElementById('admin-ig-link');

    if (captionEl) captionEl.value = media.ytCaption || '';
    if (linkEl) linkEl.value = media.ytLink || '';
    if (coverEl) coverEl.value = media.ytCover || '';
    if (videoEl) videoEl.value = media.igVideo || '';
    if (igLinkEl) igLinkEl.value = media.igLink || '';
};

window.updateNewsMedia = function() {
    const media = {
        ytCaption: document.getElementById('admin-yt-caption').value.trim(),
        ytLink: document.getElementById('admin-yt-link').value.trim(),
        ytCover: document.getElementById('admin-yt-cover').value.trim(),
        igVideo: document.getElementById('admin-ig-video').value.trim(),
        igLink: document.getElementById('admin-ig-link').value.trim()
    };

    localStorage.setItem('pt-news-media', JSON.stringify(media));
    alert('Media bacheca news aggiornati con successo! ✦');
};

window.loadNewsNoticesAdmin = function() {
    const container = document.getElementById('admin-notices-list');
    if (!container) return;

    let notices = [];
    const raw = localStorage.getItem('pt-news-notices');
    if (raw) {
        try { notices = JSON.parse(raw); } catch(e) {}
    } else {
        // Popola di default
        notices = [
            {
                id: 'notice-1',
                icon: '📖',
                tag: 'Lettura del Mese',
                title: 'Stiamo leggendo <em>"Get to You"</em> di Sara Rampado',
                desc: 'Prepara il tuo diario di lettura! Parleremo del libro al prossimo incontro. Tieniti pronta con i tuoi pensieri e le deine teorie preferite 💜'
            },
            {
                id: 'notice-2',
                icon: '🎨',
                tag: 'Evento Speciale · 30-31 Maggio',
                title: 'After Book al Museo Campano — Ingresso Libero!',
                desc: 'Porta con te un amico, un pennello o semplicemente la tua curiosità. La libreria apre le porte all\'arte in tutte le sei forme per due serate indimenticabili.'
            },
            {
                id: 'notice-3',
                icon: '🎵',
                tag: 'Playlist Aggiornata',
                title: 'La playlist da lettura è stata aggiornata!',
                desc: 'Nuovi brani aggiunti per le sessioni di lettura di questo mese. Perfetta per leggere "Get to You" in atmosfera! <a href="https://open.spotify.com/playlist/6fl1qtLXPhmt9OuxHhkpZP?si=1fb8b8e379eb4c6a" target="_blank" rel="noopener" style="color:var(--lilac-deep); font-weight:600;">Ascolta su Spotify →</a>'
            }
        ];
        localStorage.setItem('pt-news-notices', JSON.stringify(notices));
    }

    if (notices.length === 0) {
        container.innerHTML = '<p style="font-size:0.85rem; color:var(--plum-light); text-align:center;">Nessun avviso in bacheca.</p>';
        return;
    }

    container.innerHTML = notices.map(n => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:var(--ivory-2); border:1px solid var(--border); padding:0.75rem; border-radius:var(--r-sm); gap:1rem;">
            <div style="font-size:0.82rem; min-width:0; color:var(--plum-dark);">
                <strong>${n.icon || '📌'} [${escHtml(n.tag)}]</strong> ${escHtml(n.title.replace(/<[^>]*>/g, ''))}
            </div>
            <button class="wish-delete" onclick="deleteNewsNotice('${n.id}')" title="Rimuovi avviso">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `).join('');
};

window.addNewsNotice = function() {
    const icon = document.getElementById('admin-notice-icon').value.trim() || '📌';
    const tag = document.getElementById('admin-notice-tag').value.trim() || 'Bacheca';
    const title = document.getElementById('admin-notice-title').value.trim();
    const desc = document.getElementById('admin-notice-desc').value.trim();

    if (!title || !desc) {
        alert('Titolo e testo dell\'avviso sono obbligatori!');
        return;
    }

    let notices = [];
    try {
        notices = JSON.parse(localStorage.getItem('pt-news-notices') || '[]');
    } catch(e) {}

    const newNotice = {
        id: 'notice-' + Date.now(),
        icon,
        tag,
        title,
        desc
    };

    notices.push(newNotice);
    localStorage.setItem('pt-news-notices', JSON.stringify(notices));
    alert('Avviso aggiunto in bacheca! ✦');

    // Pulisci campi
    ['admin-notice-icon', 'admin-notice-tag', 'admin-notice-title', 'admin-notice-desc'].forEach(id => {
        document.getElementById(id).value = '';
    });

    loadNewsNoticesAdmin();
};

window.deleteNewsNotice = function(id) {
    if (!confirm('Sei sicura di voler eliminare questo avviso?')) return;

    let notices = [];
    try {
        notices = JSON.parse(localStorage.getItem('pt-news-notices') || '[]');
    } catch(e) {}

    notices = notices.filter(n => n.id !== id);
    localStorage.setItem('pt-news-notices', JSON.stringify(notices));

    loadNewsNoticesAdmin();
};

// ─── UTILS ────────────────────────────────────────────────────
function escHtml(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── ESPOSIZIONE GLOBALE PER REALTIME FIREBASE SYNC ───
window.loadDiary = loadDiary;
window.loadReviews = loadReviews;
window.loadWishlist = loadWishlist;
window.loadMeetings = loadMeetings;
window.loadBookCrush = loadBookCrush;
window.loadLeaderboard = loadLeaderboard;
window.loadPdfs = loadPdfs;
window.loadNewsMediaAdmin = loadNewsMediaAdmin;
window.loadNewsNoticesAdmin = loadNewsNoticesAdmin;
window.loadCurrentBookAdmin = loadCurrentBookAdmin;
