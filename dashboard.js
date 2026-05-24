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
    if (targetNav) targetNav.classList.add('active');
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

    // Filtra incontri futuri/odierni
    const today = new Date();
    today.setHours(0,0,0,0);
    const validMeetings = meetings.filter(m => new Date(m.date) >= today);
    validMeetings.sort((a,b) => new Date(a.date) - new Date(b.date));

    if(!validMeetings.length) {
        list.innerHTML = '';
        if(empty) empty.classList.remove('hidden');
        return;
    }
    if(empty) empty.classList.add('hidden');

    list.innerHTML = validMeetings.map(m => {
        const d = new Date(m.date);
        const day = d.getDate();
        const mon = d.toLocaleDateString('it-IT', {month: 'short'});
        const deleteBtn = isAdmin ? `<button onclick="deleteMeeting('${m.id}')" style="background:none;border:none;color:#e05b5b;cursor:pointer;margin-left:auto;"><i class="fas fa-trash"></i></button>` : '';
        
        return `
        <div class="meeting-item">
            <div class="meeting-date-box">
                <div class="meet-day">${day}</div>
                <div class="meet-mon">${mon}</div>
            </div>
            <div class="meeting-info" style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h4>${escHtml(m.title)}</h4>
                    <p><i class="fas fa-clock"></i> ${escHtml(m.time)} • <i class="fas fa-map-marker-alt"></i> ${escHtml(m.location)}</p>
                </div>
                ${deleteBtn}
            </div>
        </div>
        `;
    }).join('');
}

window.addMeeting = function() {
    const date = document.getElementById('meet-date').value;
    const time = document.getElementById('meet-time').value;
    const title = document.getElementById('meet-title').value.trim();
    const location = document.getElementById('meet-location').value.trim();
    
    if(!date || !title) { alert('Data e titolo sono obbligatori!'); return; }
    
    const m = getMeetings();
    m.push({ id: 'meet-' + Date.now(), date, time, title, location });
    saveMeetings(m);
    
    document.getElementById('meet-title').value = '';
    loadMeetings();
};

window.deleteMeeting = function(id) {
    if(!confirm('Eliminare questo incontro?')) return;
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

window.updateCurrentBook = function() {
    const title = document.getElementById('admin-book-title').value.trim();
    const author = document.getElementById('admin-book-author').value.trim();
    const cover = document.getElementById('admin-book-cover').value.trim();
    const progress = parseInt(document.getElementById('admin-book-progress').value, 10) || 0;
    if (!title) { alert('Inserisci almeno il titolo!'); return; }
    localStorage.setItem('pt-current-book', JSON.stringify({ title, author, cover, progress }));
    alert('Libro aggiornato! ✦ Ricarica la home per vedere le modifiche.');
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

// ─── UTILS ────────────────────────────────────────────────────
function escHtml(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
