// ═══════════════════════════════════════════════════════════════
//  PLOT TWISTERS — Main Script (pagine pubbliche, senza server)
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initParticles();
    initNavbar();
    initSidebar();

    // Inizializzazioni specifiche per pagina
    if (document.getElementById('calendar-grid')) initCalendar();
    if (document.getElementById('dynamic-events-grid')) loadEventsArchive();
    if (document.getElementById('review-book-title')) loadSingleReview();
    if (document.getElementById('dynamic-reviews-container')) loadDynamicReviews();
    if (document.getElementById('event-title')) loadSingleEvent();

    // Inizializzazioni per la Homepage
    if (document.getElementById('lettura-mese') || document.querySelector('.current-book-title')) loadDynamicCurrentBook();
    if (document.getElementById('upcoming-meetings') || document.getElementById('novita-upcoming-events')) loadUpcomingMeetings();
    if (document.getElementById('bookcrush-highlight')) loadBookCrushHighlight();
    if (document.getElementById('home-leaderboard')) loadLeaderboardHome();
    
    // Inizializzazione archivio libri
    if (document.getElementById('dynamic-books-archive')) loadBooksArchive();

    // Inizializzazione pagina Novità (media + avvisi dinamici)
    if (document.getElementById('news-yt-container') || document.getElementById('news-notices-container')) {
        loadNewsToPage();
    }
});

// ─── THEME TOGGLE ─────────────────────────────────────────────
function initTheme() {
    const saved = localStorage.getItem('pt-theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeIcon(saved);

    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
        const curr = document.documentElement.getAttribute('data-theme');
        const next = curr === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('pt-theme', next);
        updateThemeIcon(next);
    });
}
function updateThemeIcon(theme) {
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// ─── NAVBAR SCROLL ────────────────────────────────────────────
function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 20);
    });
}

// ─── SIDEBAR ──────────────────────────────────────────────────
function initSidebar() {
    const btns = document.querySelectorAll('.menu-pill-btn');
    const overlay = document.getElementById('sidebar-overlay');
    btns.forEach(btn => btn.addEventListener('click', () => toggleSidebar(true)));
    if (overlay) overlay.addEventListener('click', () => toggleSidebar(false));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') toggleSidebar(false); });
}
function toggleSidebar(open) {
    const sidebar = document.getElementById('sidebar-drawer');
    const overlay = document.getElementById('sidebar-overlay');
    if (!sidebar || !overlay) return;
    sidebar.classList.toggle('active', open);
    overlay.classList.toggle('active', open);
    document.body.style.overflow = open ? 'hidden' : '';
}

// ─── UTILS ────────────────────────────────────────────────────
function escHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── CARICAMENTO DATI DA LOCALSTORAGE ─────────────────────────

function loadDynamicCurrentBook() {
    try {
        const raw = localStorage.getItem('pt-current-book');
        if (!raw) return; // Lascia i valori di default se non è mai stato settato

        const data = JSON.parse(raw);

        const covers = document.querySelectorAll('.bento-book-cover');
        const titles = document.querySelectorAll('.bento-book-details h3, .current-book-title');
        const authors = document.querySelectorAll('.bento-author, .current-book-author');
        const progressFills = document.querySelectorAll('.progress-fill');
        const progressTexts = document.querySelectorAll('.progress-meta span:last-child');
        const progressWraps = document.querySelectorAll('.progress-meta span:first-child');

        covers.forEach(c => { if (data.cover) c.src = escHtml(data.cover); c.alt = `Copertina di ${escHtml(data.title)}`; });
        titles.forEach(t => { if (data.title) t.textContent = escHtml(data.title); });
        authors.forEach(a => { if (data.author) a.textContent = 'di ' + escHtml(data.author); });

        if (data.progress !== undefined) {
            progressFills.forEach(f => f.style.width = data.progress + '%');
            progressTexts.forEach(pt => pt.textContent = data.progress + '%');
            progressWraps.forEach(pw => pw.textContent = `Avanzamento Gruppo · ${data.progress}%`);
        }

        // Aggiorna anche lo scaffale nella homepage ("I Libri che Abbiamo Amato")
        const shelfCover = document.getElementById('shelf-current-cover');
        const shelfTitle = document.getElementById('shelf-current-title');
        if (shelfCover && data.cover) {
            shelfCover.src = escHtml(data.cover);
            shelfCover.alt = `Copertina di ${escHtml(data.title)}`;
        }
        if (shelfTitle && data.title) {
            shelfTitle.textContent = escHtml(data.title);
        }
    } catch (e) {
        console.warn('Errore lettura libro corrente:', e);
    }
}

function loadUpcomingMeetings() {
    const homeContainer = document.getElementById('upcoming-meetings');
    const novitaContainer = document.getElementById('novita-upcoming-events');
    
    if (!homeContainer && !novitaContainer) return;

    try {
        const raw = localStorage.getItem('pt-meetings');
        if (!raw) return;

        const meetings = JSON.parse(raw);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Filtra solo quelli di oggi o futuri
        const valid = meetings.filter(m => new Date(m.date) >= today);
        valid.sort((a, b) => new Date(a.date) - new Date(b.date));

        if (valid.length === 0) {
            if (homeContainer) {
                homeContainer.innerHTML = '<p style="color:var(--plum-light); font-size:0.9rem;">Nessun incontro in programma al momento.</p>';
            }
            if (novitaContainer) {
                novitaContainer.innerHTML = '<p style="color:var(--plum-light); font-size:0.9rem; grid-column: 1 / -1; text-align: center;">Nessun incontro in arrivo. Controlla presto le novità!</p>';
            }
            return;
        }

        // Home: mostra massimo 2 eventi
        if (homeContainer) {
            const homeShow = valid.slice(0, 2);
            homeContainer.innerHTML = homeShow.map(m => {
                const d = new Date(m.date);
                const day = isNaN(d) ? '✦' : d.getDate();
                const mon = isNaN(d) ? '' : d.toLocaleDateString('it-IT', { month: 'short' });
                const icon = m.icon || '📅';
                const pageUrl = `evento-singolo.html?event=${m.id}`;
                return `
                <a href="${pageUrl}" style="text-decoration:none; color:inherit; display:block; margin-bottom:0.75rem;">
                    <div style="display:flex; gap:1rem; align-items:center; background:var(--ivory-2); padding:1rem; border-radius:var(--r-sm); border:1px solid var(--border); transition:transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
                        <div style="text-align:center; background:var(--lilac-deep); color:white; border-radius:var(--r-sm); padding:0.5rem; min-width:4.5rem; flex-shrink:0;">
                            <div style="font-size:1.5rem; font-weight:700; line-height:1;">${day}</div>
                            <div style="font-size:0.7rem; text-transform:uppercase;">${mon}</div>
                        </div>
                        <div style="flex:1;">
                            <div style="font-size:0.75rem; color:var(--lilac-deep); font-weight:600; margin-bottom:0.15rem;">${icon} Incontro Club</div>
                            <h4 style="font-size:0.95rem; font-weight:600; margin-bottom:0.25rem;">${escHtml(m.title)}</h4>
                            <p style="font-size:0.82rem; color:var(--plum-light); margin:0;"><i class="fas fa-clock"></i> ${escHtml(m.time || '18:00')} • <i class="fas fa-map-marker-alt"></i> ${escHtml(m.location || 'Libreria Cose d\'Interni')}</p>
                        </div>
                        <div style="color:var(--lilac-mid); font-size:0.9rem; padding-right:0.5rem;">→</div>
                    </div>
                </a>`;
            }).join('');
        }

        // Novità: mostra tutti i validi nel layout bento
        if (novitaContainer) {
            novitaContainer.innerHTML = valid.map(m => {
                const d = new Date(m.date);
                const day = isNaN(d) ? '✦' : d.getDate();
                const mon = isNaN(d) ? '' : d.toLocaleDateString('it-IT', { month: 'short' });
                const icon = m.icon || '📅';
                const pageUrl = `evento-singolo.html?event=${m.id}`;
                return `
                <a href="${pageUrl}" style="text-decoration:none; color:inherit; display:block; width:100%; box-sizing:border-box;">
                    <div class="bento-box" style="background: var(--ivory-2); padding: 1.5rem; border: 1px solid var(--border); display: flex; gap: 1.25rem; align-items: center; width: 100%; box-sizing: border-box; transition:transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
                        <div style="background: var(--lilac-deep); color: white; border-radius: var(--r-sm); padding: 0.75rem; text-align: center; min-width: 60px; flex-shrink: 0;">
                            <div style="font-size: 1.6rem; font-weight: 800; line-height: 1;">${day}</div>
                            <div style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px;">${mon}</div>
                        </div>
                        <div style="flex:1;">
                            <div style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; color: var(--lilac-deep); font-weight:700; margin-bottom: 0.2rem;">
                                ${icon} Prossimamente ✦</div>
                            <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.2rem;">${escHtml(m.title)}</h4>
                            <p style="font-size: 0.82rem; color: var(--plum-light); margin: 0;">ore ${escHtml(m.time || '18:00')} · ${escHtml(m.location || 'Libreria Cose d\'Interni')}</p>
                        </div>
                        <div style="color:var(--lilac-mid); font-size:1.1rem;">→</div>
                    </div>
                </a>`;
            }).join('');
        }

    } catch (e) {
        console.warn('Errore lettura incontri:', e);
    }
}

function loadBookCrushHighlight() {
    const container = document.getElementById('bookcrush-highlight');
    if (!container) return;

    try {
        const raw = localStorage.getItem('pt-bookcrush');
        if (!raw) return;

        const crushes = JSON.parse(raw);
        if (crushes.length === 0) return;

        // Scegli una bookcrush casuale
        const c = crushes[Math.floor(Math.random() * crushes.length)];

        container.innerHTML = `
        <div style="background:var(--ivory-2); padding:1.25rem; border-radius:var(--r-md); border:1px solid var(--border);">
            <div style="font-size:2rem; margin-bottom:0.5rem;">💖</div>
            <h3 style="font-family:'Playfair Display',serif; color:var(--lilac-deep); margin-bottom:0.2rem;">${escHtml(c.character)}</h3>
            <p style="font-size:0.85rem; color:var(--plum-light); margin-bottom:0.75rem;">da <em>${escHtml(c.book)}</em></p>
            <p style="font-size:0.9rem; font-style:italic; color:var(--plum-dark);">"${escHtml(c.reason)}"</p>
            <p style="font-size:0.8rem; color:var(--plum-light); text-align:right; margin-top:0.75rem;">— Scelto da ${escHtml(c.user)}</p>
        </div>`;
    } catch (e) {
        console.warn('Errore lettura bookcrush:', e);
    }
}

// ─── DECO PARTICLES ───────────────────────────────────────────
function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    const count = window.innerWidth > 768 ? 16 : 7;
    const shapes = ['✦', '✧', '·', '⋆', '✶'];
    for (let i = 0; i < count; i++) {
        const p = document.createElement('span');
        p.textContent = shapes[Math.floor(Math.random() * shapes.length)];
        const sz = Math.random() * 10 + 7;
        p.style.cssText = `
            position:absolute;
            font-size:${sz}px;
            left:${Math.random() * 100}vw;
            top:${Math.random() * 100}vh;
            color:${Math.random() > 0.5 ? 'rgba(181,160,221,0.28)' : 'rgba(150,129,203,0.22)'};
            pointer-events:none;
            animation:floatParticle ${Math.random() * 22 + 18}s ${Math.random() * -20}s infinite linear;
        `;
        container.appendChild(p);
    }
    const style = document.createElement('style');
    style.textContent = `
        @keyframes floatParticle {
            0%   { transform:translateY(0) rotate(0deg); opacity:0; }
            10%  { opacity:1; }
            90%  { opacity:0.7; }
            100% { transform:translateY(-100vh) rotate(360deg); opacity:0; }
        }
    `;
    document.head.appendChild(style);
}

// ─── NEWSLETTER ───────────────────────────────────────────────
window.submitNewsletter = function (e) {
    e.preventDefault();
    const input = document.getElementById('newsletter-email');
    const btn = document.getElementById('newsletter-btn');
    const feedback = document.getElementById('newsletter-feedback');
    if (!input) return;

    const email = input.value.trim();
    if (!email) return;

    const origHTML = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span>';
    btn.disabled = true;
    if (feedback) { feedback.style.display = 'none'; feedback.className = 'newsletter-feedback'; }

    setTimeout(() => {
        let emails = JSON.parse(localStorage.getItem('newsletter_emails') || '[]');
        if (!emails.includes(email)) {
            emails.push(email);
            localStorage.setItem('newsletter_emails', JSON.stringify(emails));
        }

        if (feedback) {
            feedback.textContent = '✦ Benvenuta nella cerchia! Ti terremo aggiornata.';
            feedback.className = 'newsletter-feedback success';
            feedback.style.display = 'block';
        }
        input.value = '';

        btn.innerHTML = origHTML;
        btn.disabled = false;

        if (feedback) setTimeout(() => { feedback.style.display = 'none'; }, 5000);
    }, 600);
};

// ─── CALENDAR (Eventi Pagina Pubblica) ────────────────────────
const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

function initCalendar() {
    if (!localStorage.getItem('pt-meetings')) {
        populateDefaultMeetings();
    }
    renderCalendar(currentYear, currentMonth);
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentMonth--;
            if (currentMonth < 0) { currentMonth = 11; currentYear--; }
            renderCalendar(currentYear, currentMonth);
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentMonth++;
            if (currentMonth > 11) { currentMonth = 0; currentYear++; }
            renderCalendar(currentYear, currentMonth);
        });
    }
}

function renderCalendar(year, month) {
    const grid = document.getElementById('calendar-grid');
    const label = document.getElementById('calendar-month-label');
    if (!grid || !label) return;

    label.textContent = `${monthNames[month]} ${year}`;
    grid.innerHTML = '';

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;

    // Carica eventi da localStorage
    let meetings = [];
    try {
        meetings = JSON.parse(localStorage.getItem('pt-meetings') || '[]');
    } catch (e) { }

    // Celle vuote prima del 1° del mese
    for (let i = 0; i < startOffset; i++) {
        const cell = document.createElement('div');
        cell.className = 'cal-cell empty';
        grid.appendChild(cell);
    }

    // Giorni del mese
    for (let d = 1; d <= daysInMonth; d++) {
        const cell = document.createElement('div');
        cell.className = 'cal-cell';

        const today = new Date();
        if (d === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            cell.classList.add('today');
            cell.style.border = '2px solid var(--lilac-deep)';
            cell.style.background = 'var(--ivory-1)';
        }

        cell.innerHTML = `<span class="cal-date">${d}</span>`;

        // Check se c'è un evento per questo giorno
        const eventsForDay = meetings.filter(m => {
            const ed = new Date(m.date);
            return ed.getFullYear() === year && ed.getMonth() === month && ed.getDate() === d;
        });

        if (eventsForDay.length > 0) {
            cell.classList.add('has-event');
            cell.dataset.id = eventsForDay[0].id;

            // click cell to navigate to single event page
            cell.addEventListener('click', (e) => {
                if (e.target.classList.contains('edit-event-btn')) return;
                const eventMap = {
                    'meet-shoah': 'evento-shoah.html',
                    'meet-legal-talent': 'evento-legaltalent.html',
                    'meet-placito-capua': 'evento-placito.html',
                    'meet-notte-artisti': 'evento-afterbook.html',
                    'meet-after-book': 'evento-afterbook.html'
                };
                const targetPage = eventMap[eventsForDay[0].id] || `evento-singolo.html?event=${eventsForDay[0].id}`;
                window.location.href = targetPage;
            });

            eventsForDay.forEach(ev => {
                const badge = document.createElement('div');
                badge.className = `cal-event-badge type-live`;
                badge.innerHTML = `<strong>${escHtml(ev.time)}</strong> ${escHtml(ev.title)}`;
                cell.appendChild(badge);
            });
        }
        grid.appendChild(cell);
    }

    // Inietta controlli admin se necessario
    renderAdminControls();
}

function renderAdminControls() {
    if (localStorage.getItem('pt-user-admin') !== '1') return;
    const grid = document.getElementById('calendar-grid');
    if (!grid) return;
    const cells = grid.querySelectorAll('.cal-cell.has-event');
    cells.forEach(cell => {
        if (cell.querySelector('.edit-event-btn')) return; // Evita duplicati

        const editBtn = document.createElement('button');
        editBtn.textContent = '✎ Modifica';
        editBtn.className = 'edit-event-btn';
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Evita l'apertura del dettaglio evento al click del bottone edit
            const id = cell.dataset.id;
            editMeeting(id);
        });
        cell.appendChild(editBtn);
    });
}

function showEventDetails(ev) {
    let modal = document.getElementById('details-modal');
    if (!modal) {
        modal = document.createElement('dialog');
        modal.id = 'details-modal';
        modal.style.cssText = 'border:none; border-radius:var(--r-md); padding:2rem; max-width:500px; box-shadow:var(--shadow-lg); background:var(--surface-1); color:var(--plum-dark);';
        document.body.appendChild(modal);
    }
    modal.innerHTML = `
        <div style="font-family:var(--font-sans);">
            <h3 style="font-family:var(--font-display); color:var(--lilac-deep); margin-bottom:0.75rem; font-size:1.5rem;">${escHtml(ev.title)}</h3>
            <p style="font-size:0.9rem; color:var(--plum-light); margin-bottom:1rem; display:flex; gap:1rem;">
                <span><i class="fas fa-calendar-alt" style="color:var(--lilac-mid);"></i> ${escHtml(ev.date)}</span>
                <span><i class="fas fa-clock" style="color:var(--lilac-mid);"></i> ${escHtml(ev.time)}</span>
            </p>
            <p style="font-size:0.95rem; margin-bottom:1rem;">
                <strong>📍 Luogo:</strong> ${escHtml(ev.location)}
            </p>
            <div style="font-size:0.95rem; line-height:1.6; border-top:1px solid var(--border); padding-top:1rem; margin-top:1rem;">
                ${escHtml(ev.description || 'Nessuna descrizione disponibile.')}
            </div>
            <button id="close-details-btn" class="btn-primary" style="margin-top:1.5rem; width:100%; justify-content:center; padding:0.6rem; cursor:pointer;">Chiudi</button>
        </div>
    `;
    modal.showModal();
    document.getElementById('close-details-btn').onclick = () => modal.close();
}

function editMeeting(id) {
    let meetings = [];
    try {
        meetings = JSON.parse(localStorage.getItem('pt-meetings') || '[]');
    } catch (e) { }
    const meeting = meetings.find(m => m.id === id);
    if (!meeting) return;

    let modal = document.getElementById('edit-modal');
    if (!modal) {
        modal = document.createElement('dialog');
        modal.id = 'edit-modal';
        modal.style.cssText = 'border:none; border-radius:var(--r-md); padding:2rem; max-width:450px; box-shadow:var(--shadow-lg); background:var(--surface-1); color:var(--plum-dark);';
        document.body.appendChild(modal);
    }
    modal.innerHTML = `
        <form id="edit-form" style="font-family:var(--font-sans); display:flex; flex-direction:column; gap:1rem;">
            <h3 style="font-family:var(--font-display); color:var(--lilac-deep); margin-bottom:0.5rem; font-size:1.4rem;">Modifica Evento</h3>
            
            <div style="display:flex; flex-direction:column; gap:0.3rem;">
                <label style="font-size:0.85rem; font-weight:600; color:var(--plum-light);">Titolo</label>
                <input type="text" name="title" value="${escHtml(meeting.title)}" required style="padding:0.5rem; border:1px solid var(--border); border-radius:var(--r-sm); background:var(--surface-2); color:var(--plum-dark);">
            </div>
            
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                <div style="display:flex; flex-direction:column; gap:0.3rem;">
                    <label style="font-size:0.85rem; font-weight:600; color:var(--plum-light);">Data</label>
                    <input type="date" name="date" value="${meeting.date}" required style="padding:0.5rem; border:1px solid var(--border); border-radius:var(--r-sm); background:var(--surface-2); color:var(--plum-dark);">
                </div>
                <div style="display:flex; flex-direction:column; gap:0.3rem;">
                    <label style="font-size:0.85rem; font-weight:600; color:var(--plum-light);">Ora</label>
                    <input type="time" name="time" value="${meeting.time}" required style="padding:0.5rem; border:1px solid var(--border); border-radius:var(--r-sm); background:var(--surface-2); color:var(--plum-dark);">
                </div>
            </div>
            
            <div style="display:flex; flex-direction:column; gap:0.3rem;">
                <label style="font-size:0.85rem; font-weight:600; color:var(--plum-light);">Luogo</label>
                <input type="text" name="location" value="${escHtml(meeting.location)}" required style="padding:0.5rem; border:1px solid var(--border); border-radius:var(--r-sm); background:var(--surface-2); color:var(--plum-dark);">
            </div>

            <div style="display:flex; flex-direction:column; gap:0.3rem;">
                <label style="font-size:0.85rem; font-weight:600; color:var(--plum-light);">Descrizione</label>
                <textarea name="description" rows="3" style="padding:0.5rem; border:1px solid var(--border); border-radius:var(--r-sm); background:var(--surface-2); color:var(--plum-dark); resize:vertical;">${escHtml(meeting.description || '')}</textarea>
            </div>
            
            <div style="margin-top:1rem; display:flex; justify-content:flex-end; gap:0.75rem;">
                <button type="button" id="cancel-btn" class="btn-ghost" style="padding:0.5rem 1rem; border:1px solid var(--border); border-radius:var(--r-sm); cursor:pointer;">Annulla</button>
                <button type="submit" class="btn-primary" style="padding:0.5rem 1.25rem; border-radius:var(--r-sm); cursor:pointer;">Salva</button>
            </div>
        </form>
    `;
    modal.showModal();
    document.getElementById('cancel-btn').onclick = () => modal.close();
    document.getElementById('edit-form').onsubmit = e => {
        e.preventDefault();
        const data = new FormData(e.target);
        meeting.title = data.get('title');
        meeting.date = data.get('date');
        meeting.time = data.get('time');
        meeting.location = data.get('location');
        meeting.description = data.get('description');

        localStorage.setItem('pt-meetings', JSON.stringify(meetings));
        modal.close();
        renderCalendar(currentYear, currentMonth);
    };
}


// ─── CLASSIFICA HOMEPAGE ──────────────────────────────────────
function loadLeaderboardHome() {
    const container = document.getElementById('home-leaderboard');
    if (!container) return;

    try {
        const raw = localStorage.getItem('pt-reviews');
        if (!raw) return;

        const reviews = JSON.parse(raw);
        if (reviews.length === 0) return;

        const counts = {};
        reviews.forEach(r => {
            counts[r.user] = (counts[r.user] || 0) + 1;
        });

        const lbData = Object.keys(counts).map(user => ({ user, count: counts[user] }));
        lbData.sort((a, b) => b.count - a.count);

        // Mostra le prime 3 lettrici
        const topData = lbData.slice(0, 3);

        container.innerHTML = topData.map((data, idx) => {
            let badge = '';
            if (idx === 0) badge = '👑';
            else if (idx === 1) badge = '🥈';
            else if (idx === 2) badge = '🥉';

            return `
            <div class="lb-row">
                <div class="lb-rank">${idx + 1}°</div>
                <div class="lb-avatar">${escHtml(data.user.charAt(0).toUpperCase())}</div>
                <div class="lb-name">${escHtml(data.user)}</div>
                <div class="lb-badge">${badge}</div>
                <div class="lb-count"><strong>${data.count}</strong> ${data.count === 1 ? 'libro' : 'libri'}</div>
            </div>`;
        }).join('');
    } catch (e) {
        console.warn('Errore lettura classifica:', e);
    }
}

// ─── RECENSIONE SINGOLA DINAMICA ──────────────────────────────
function loadSingleReview() {
    const titleEl = document.getElementById('review-book-title');
    const authorEl = document.getElementById('review-book-author');
    const authorHeroEl = document.getElementById('review-book-author-hero');
    const coverEl = document.getElementById('review-book-cover');
    const starsEl = document.getElementById('review-book-stars');
    const ratingBadgeEl = document.getElementById('review-rating-badge');
    const descEl = document.getElementById('review-book-desc');
    const userReviewsContainer = document.getElementById('user-reviews-list');
    const pageTitleEl = document.getElementById('review-page-title');

    if (!titleEl) return; // Non siamo nella pagina di recensione singola

    // Ottieni parametro URL
    const params = new URLSearchParams(window.location.search);
    const bookKey = params.get('book') || 'shatter-me';

    let booksData = [];
    try {
        const rawBooks = localStorage.getItem('pt-books');
        if (rawBooks) {
            booksData = JSON.parse(rawBooks);
        }
    } catch (e) {
        console.warn('Errore lettura pt-books:', e);
    }

    const data = booksData.find(b => b.id === bookKey);
    if (!data) {
        if (titleEl) titleEl.textContent = "Libro non trovato";
        return;
    }

    // Aggiorna elementi HTML
    if (pageTitleEl) pageTitleEl.innerHTML = `Recensione: <em>${escHtml(data.title)}</em>`;
    if (authorHeroEl) authorHeroEl.textContent = `di ${data.author}`;
    if (titleEl) titleEl.textContent = data.title;
    if (authorEl) authorEl.textContent = data.author;
    if (coverEl) coverEl.src = data.cover;
    if (starsEl) starsEl.textContent = data.stars;
    if (ratingBadgeEl) ratingBadgeEl.innerHTML = `${data.rating}<span style="font-size:1rem; color:var(--plum-light);">/5</span>`;
    if (descEl) descEl.innerHTML = data.desc;

    // Carica recensioni reali dal localStorage
    if (userReviewsContainer) {
        try {
            const raw = localStorage.getItem('pt-reviews');
            const reviews = raw ? JSON.parse(raw) : [];

            // Filtra recensioni scritte dall'area riservata che corrispondono al titolo di questo libro
            const matched = reviews.filter(r => r.title.toLowerCase().trim() === data.title.toLowerCase().trim());

            if (matched.length > 0) {
                userReviewsContainer.innerHTML = matched.map(r => {
                    let rStars = '';
                    for (let i = 0; i < 5; i++) rStars += i < r.rating ? '★' : '☆';
                    return `
                    <div style="background:var(--ivory-2); padding:1.5rem; border-radius:var(--r-sm); border:1px solid var(--border);">
                        <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                            <div style="display:flex; gap:0.5rem; align-items:center;">
                                <div style="width:30px; height:30px; background:var(--lilac-deep); color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:0.8rem;">
                                    ${escHtml(r.user.charAt(0).toUpperCase())}
                                </div>
                                <strong>${escHtml(r.user)}</strong>
                            </div>
                            <div style="color:#f5a623;">${rStars}</div>
                        </div>
                        <p style="font-size:0.95rem; color:var(--plum-dark);">"${escHtml(r.text)}"</p>
                    </div>`;
                }).join('');
            } else {
                // Se non ci sono recensioni reali scritte, mostra quelle simulate per ciascun libro
                if (bookKey === 'shatter-me') {
                    userReviewsContainer.innerHTML = `
                    <div style="background:var(--ivory-2); padding:1.5rem; border-radius:var(--r-sm); border:1px solid var(--border);">
                        <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                            <div style="display:flex; gap:0.5rem; align-items:center;">
                                <div style="width:30px; height:30px; background:var(--lilac-deep); color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:0.8rem;">G</div>
                                <strong>Giulia</strong>
                            </div>
                            <div style="color:#f5a623;">★★★★★</div>
                        </div>
                        <p style="font-size:0.95rem; color:var(--plum-dark);">Assolutamente ossessionata. Warner ha tutto il mio cuore. Lo stile di scrittura all'inizio è strano, ma poi ti entra sottopelle e non ne puoi fare a meno.</p>
                    </div>
                    <div style="background:var(--ivory-2); padding:1.5rem; border-radius:var(--r-sm); border:1px solid var(--border);">
                        <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                            <div style="display:flex; gap:0.5rem; align-items:center;">
                                <div style="width:30px; height:30px; background:var(--lilac-deep); color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:0.8rem;">V</div>
                                <strong>Valentina</strong>
                            </div>
                            <div style="color:#f5a623;">★★★☆☆</div>
                        </div>
                        <p style="font-size:0.95rem; color:var(--plum-dark);">La storia ci sta, ma Juliette l'ho trovata un po' noiosa in questo primo volume. Troppi lamenti. Continuo la serie solo perché mi avete detto che migliora!</p>
                    </div>`;
                } else if (bookKey === 'brave-ragazze') {
                    userReviewsContainer.innerHTML = `
                    <div style="background:var(--ivory-2); padding:1.5rem; border-radius:var(--r-sm); border:1px solid var(--border);">
                        <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                            <div style="display:flex; gap:0.5rem; align-items:center;">
                                <div style="width:30px; height:30px; background:var(--lilac-deep); color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:0.8rem;">G</div>
                                <strong>Giulia</strong>
                            </div>
                            <div style="color:#f5a623;">★★★★★</div>
                        </div>
                        <p style="font-size:0.95rem; color:var(--plum-dark);">Un thriller pazzesco, Pip è diventata uno dei miei personaggi preferiti di sempre! Fino all'ultimo non avevo idea di chi fosse l'assassino.</p>
                    </div>
                    <div style="background:var(--ivory-2); padding:1.5rem; border-radius:var(--r-sm); border:1px solid var(--border);">
                        <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                            <div style="display:flex; gap:0.5rem; align-items:center;">
                                <div style="width:30px; height:30px; background:var(--lilac-deep); color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:0.8rem;">A</div>
                                <strong>Angela</strong>
                            </div>
                            <div style="color:#f5a623;">★★★★☆</div>
                        </div>
                        <p style="font-size:0.95rem; color:var(--plum-dark);">Molto avvincente e scorrevole. La trama ti tiene incollata alle pagine. Il finale mi ha lasciata a bocca aperta!</p>
                    </div>`;
                } else if (bookKey === 'e-poi-ci-sono-io') {
                    userReviewsContainer.innerHTML = `
                    <div style="background:var(--ivory-2); padding:1.5rem; border-radius:var(--r-sm); border:1px solid var(--border);">
                        <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                            <div style="display:flex; gap:0.5rem; align-items:center;">
                                <div style="width:30px; height:30px; background:var(--lilac-deep); color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:0.8rem;">V</div>
                                <strong>Valentina</strong>
                            </div>
                            <div style="color:#f5a623;">★★★★☆</div>
                        </div>
                        <p style="font-size:0.95rem; color:var(--plum-dark);">Una storia cruda, dolorosa ma incredibilmente reale e necessaria. Charlie Davis merita tutta la felicità del mondo.</p>
                    </div>
                    <div style="background:var(--ivory-2); padding:1.5rem; border-radius:var(--r-sm); border:1px solid var(--border);">
                        <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                            <div style="display:flex; gap:0.5rem; align-items:center;">
                                <div style="width:30px; height:30px; background:var(--lilac-deep); color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:0.8rem;">G</div>
                                <strong>Giorgia</strong>
                            </div>
                            <div style="color:#f5a623;">★★★★★</div>
                        </div>
                        <p style="font-size:0.95rem; color:var(--plum-dark);">Ho pianto tantissimo. È un libro profondo e commovente, che affronta temi delicatissimi con una sensibilità straordinaria. Bellissimo.</p>
                    </div>`;
                } else if (bookKey === 'but-santa-i-love-him') {
                    userReviewsContainer.innerHTML = `
                    <div style="background:var(--ivory-2); padding:1.5rem; border-radius:var(--r-sm); border:1px solid var(--border);">
                        <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                            <div style="display:flex; gap:0.5rem; align-items:center;">
                                <div style="width:30px; height:30px; background:var(--lilac-deep); color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:0.8rem;">S</div>
                                <strong>Samia</strong>
                            </div>
                            <div style="color:#f5a623;">★★★★☆</div>
                        </div>
                        <p style="font-size:0.95rem; color:var(--plum-dark);">Il nostro primo libro del club! Atmosfera natalizia perfetta, accogliente e soffice come una tazza di cioccolata calda.</p>
                    </div>
                    <div style="background:var(--ivory-2); padding:1.5rem; border-radius:var(--r-sm); border:1px solid var(--border);">
                        <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                            <div style="display:flex; gap:0.5rem; align-items:center;">
                                <div style="width:30px; height:30px; background:var(--lilac-deep); color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:0.8rem;">I</div>
                                <strong>Ilaria</strong>
                            </div>
                            <div style="color:#f5a623;">★★★★☆</div>
                        </div>
                        <p style="font-size:0.95rem; color:var(--plum-dark);">Un romance dolcissimo e divertente, perfetto per il periodo delle feste. Mi ha scaldato il cuore!</p>
                    </div>`;
                } else {
                    userReviewsContainer.innerHTML = `
                    <div style="text-align:center; background:var(--ivory-2); padding:2rem; border-radius:var(--r-sm); border:1px solid var(--border);">
                        <p style="color:var(--plum-light); font-size:0.9rem; margin:0;">Nessun parere ancora scritto per questo libro. Accedi all'Area Privata per scrivere la tua recensione!</p>
                    </div>`;
                }
            }
        } catch (e) {
            console.warn('Errore caricamento recensioni del club:', e);
        }
    }
}

// ─── AUTO-INIZIALIZZAZIONE EVENTI DI DEFAULT ───────────────────
function populateDefaultMeetings() {
    const defaults = [
        {
            id: 'meet-shoah',
            date: '2024-01-27',
            time: '18:30',
            title: 'Commemorazione Shoah 🕯️',
            location: 'Libreria Cose d\'Interni, Capua',
            description: `Il 27 gennaio 2024 abbiamo partecipato alla Giornata della Memoria con un incontro speciale presso la Libreria Cose d'Interni di Capua. Abbiamo letto insieme brani tratti da diari, lettere e testimonianze di sopravvissuti all'Olocausto, riflettendo sull'importanza di non dimenticare. Un momento toccante e profondo, che ci ha ricordate perché la letteratura è anche custode di memoria storica. Non dimenticheremo mai.`
        },
        {
            id: 'meet-legal-talent',
            date: '2026-02-15',
            time: '17:00',
            title: 'Legal Talent ⚖️',
            location: 'Libreria Cose d\'Interni, Capua',
            description: `Un format innovativo e appassionante dedicato al mondo del diritto e della letteratura giuridica. Le nostre Plot Twisters si sono confrontate su casi letterari, testi normativi raccontati con voce narrativa e dibattiti su grandi processi della storia. Un pomeriggio intenso che ha unito la passione per la lettura con la cultura giuridica, dimostrando che anche il diritto può essere un'avventura da leggere.`
        },
        {
            id: 'meet-placito-capua',
            date: '2026-03-10',
            time: '19:00',
            title: 'Placito Capua 📜',
            location: 'Libreria Cose d\'Interni, Capua',
            description: `Un tuffo alle origini della lingua italiana! Il Placito Capuano del 960 d.C. è uno dei primi documenti scritti in volgare italiano, e nasce proprio nella nostra Capua. Abbiamo celebrato questa pietra miliare con letture, spiegazioni storiche e un piccolo laboratorio sulla bellezza dell'evoluzione linguistica. Essere capuane e orgogliosamente parte di questa storia ci riempie il cuore!`
        },
        {
            id: 'meet-notte-artisti',
            date: '2026-05-30',
            time: '19:30',
            title: 'Notte degli Artisti 🎨',
            location: 'Libreria Cose d\'Interni, Capua',
            description: `Un evento speciale a cavallo di due giorni, il 30 e 31 maggio 2026, dedicato all'arte in tutte le sue forme: dalla letteratura alla pittura, dalla musica alla fotografia. Le Plot Twisters incontrano gli artisti locali di Capua per un dialogo creativo e ispirazionale. Letture ad alta voce, musica dal vivo e un'installazione fotografica apriranno la serata. L'ingresso è libero e aperto a tutta la comunità.`
        }
    ];
    localStorage.setItem('pt-meetings', JSON.stringify(defaults));
}

// ─── AUTO-INIZIALIZZAZIONE RECENSIONI DI DEFAULT ─────────────────
function populateDefaultReviews() {
    const defaultReviews = [

    ];
    localStorage.setItem('pt-reviews', JSON.stringify(defaultReviews));
}

// ─── CARICAMENTO ARCHIVIO EVENTI (PAGINA EVENTI) ───────────────
function loadEventsArchive() {
    const grid = document.getElementById('dynamic-events-grid');
    if (!grid) return;

    let meetings = [];
    try {
        meetings = JSON.parse(localStorage.getItem('pt-meetings') || '[]');
    } catch (e) { }

    if (meetings.length === 0) {
        grid.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:var(--plum-light); padding:2rem;">Nessun evento presente al momento.</p>';
        return;
    }

    // Ordina eventi per data
    const sorted = [...meetings].sort((a, b) => new Date(a.date) - new Date(b.date));

    grid.innerHTML = sorted.map(ev => {
        const d = new Date(ev.date);
        const formattedDate = isNaN(d) ? ev.date : d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
        const icon = ev.icon || '📅';
        const pageUrl = `evento-singolo.html?event=${ev.id}`;
        
        const coverHtml = ev.cover ? `
            <div style="height:170px; border-radius:var(--r-sm) var(--r-sm) 0 0; overflow:hidden; margin:-1.5rem -1.5rem 1rem -1.5rem; background:var(--ivory-1);">
                <img src="${escHtml(ev.cover)}" alt="${escHtml(ev.title)}" style="width:100%; height:100%; object-fit:cover; display:block;">
            </div>
        ` : '';

        const descSnippet = ev.description 
            ? (ev.description.replace(/<[^>]+>/g, '').length > 130 ? ev.description.replace(/<[^>]+>/g, '').substring(0, 130) + '...' : ev.description.replace(/<[^>]+>/g, ''))
            : `Incontro del club alle ore ${escHtml(ev.time || '18:00')} presso ${escHtml(ev.location || "Libreria Cose d'Interni")}.`;

        return `
        <div class="bento-box" style="background:var(--ivory-2); padding:1.5rem; display:flex; flex-direction:column; justify-content:space-between; border:1px solid var(--border); gap:1.25rem;">
            <div>
                ${coverHtml}
                <span class="bento-tag" style="background:var(--lilac-pale); color:var(--lilac-deep); margin-bottom:0.6rem; display:inline-block;">
                    ${icon} ${formattedDate}
                </span>
                <h3 style="margin:0.4rem 0 0.5rem 0; font-family:var(--font-display); font-size:1.25rem; color:var(--plum-dark);">${escHtml(ev.title)}</h3>
                <p style="font-size:0.88rem; color:var(--plum-dark); line-height:1.6; margin:0 0 0.5rem 0;">${escHtml(descSnippet)}</p>
                <p style="font-size:0.8rem; color:var(--plum-light); margin:0;">
                    <i class="fas fa-clock"></i> ore ${escHtml(ev.time || '18:00')} • <i class="fas fa-map-marker-alt"></i> ${escHtml(ev.location || "Libreria Cose d'Interni")}
                </p>
            </div>
            <a href="${pageUrl}" class="btn-outline" style="justify-content:center; padding:0.6rem; font-size:0.85rem; text-decoration:none; text-align:center; font-weight:600;">
                Visualizza Dettagli Pagina →
            </a>
        </div>
        `;
    }).join('');
}

// ─── CARICAMENTO EVENTO SINGOLO ─────────────────────────────────
function loadSingleEvent() {
    const titleEl = document.getElementById('event-title');
    const dateEl = document.getElementById('event-date');
    const timeEl = document.getElementById('event-time');
    const locationEl = document.getElementById('event-location');
    const descEl = document.getElementById('event-desc');
    const pageTitleEl = document.getElementById('event-page-title');
    const dateHeroEl = document.getElementById('event-date-hero');
    const iconBadgeEl = document.getElementById('event-icon-badge');
    const coverContainer = document.getElementById('event-cover-container');
    const coverImg = document.getElementById('event-cover-img');
    const adminContainer = document.getElementById('event-admin-controls');

    if (!titleEl) return;

    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('event');

    let meetings = [];
    try {
        meetings = JSON.parse(localStorage.getItem('pt-meetings') || '[]');
    } catch (e) { }

    const ev = meetings.find(m => m.id === eventId) || meetings[0];
    if (!ev) {
        titleEl.textContent = "Evento non trovato";
        return;
    }

    // Imposta icona badge
    const icon = ev.icon || (ev.id.includes('shoah') ? "🕯️" : ev.id.includes('legal') ? "⚖️" : ev.id.includes('placito') ? "📜" : ev.id.includes('artisti') ? "🎨" : "📅");
    if (iconBadgeEl) iconBadgeEl.textContent = icon;

    // Formatta la data
    const dateObj = new Date(ev.date);
    const formattedDate = isNaN(dateObj) ? ev.date : dateObj.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

    // Copertina
    if (coverContainer && coverImg) {
        if (ev.cover) {
            coverImg.src = ev.cover;
            coverContainer.style.display = 'block';
        } else {
            coverContainer.style.display = 'none';
        }
    }

    // Aggiorna elementi HTML
    if (pageTitleEl) pageTitleEl.innerHTML = `Evento: <em>${escHtml(ev.title)}</em>`;
    if (dateHeroEl) dateHeroEl.textContent = `Incontro del ${formattedDate} alle ore ${escHtml(ev.time || '18:00')}`;
    if (titleEl) titleEl.textContent = ev.title;
    if (dateEl) dateEl.textContent = formattedDate;
    if (timeEl) timeEl.textContent = ev.time || '18:00';
    if (locationEl) locationEl.textContent = ev.location || "Libreria Cose d'Interni, Capua";
    
    // Descrizione formattata in paragrafi
    if (descEl) {
        if (ev.description) {
            if (ev.description.includes('<p>') || ev.description.includes('<div>')) {
                descEl.innerHTML = ev.description;
            } else {
                const paragraphs = ev.description.split(/\n+/).filter(Boolean);
                descEl.innerHTML = paragraphs.map(p => `<p style="margin-bottom:1.25rem;">${escHtml(p)}</p>`).join('');
            }
        } else {
            descEl.innerHTML = `<p style="color:var(--plum-light); font-style:italic;">Nessuna descrizione o programma dettagliato inserito per questo evento.</p>`;
        }
    }

    // Controlli admin
    if (adminContainer && localStorage.getItem('pt-user-admin') === '1') {
        adminContainer.innerHTML = `
            <div style="text-align:center; margin-top:3rem; padding:2rem; background:linear-gradient(135deg, var(--lilac-pale), var(--ivory-2)); border-radius:var(--r-md); border:1px solid var(--border);">
                <span style="font-size:1.5rem; display:block; margin-bottom:0.75rem;">⚙️ Pannello Amministratore Evento</span>
                <h4 style="font-family:var(--font-display); margin-bottom:0.5rem;">Gestisci questa pagina evento</h4>
                <p style="font-size:0.9rem; color:var(--plum-light); margin-bottom:1.25rem;">Puoi modificare il titolo, la data, l'orario, l'icona, la locandina e il programma completo di questo appuntamento.</p>
                <div style="display:flex; justify-content:center; gap:1rem; flex-wrap:wrap;">
                    <button id="edit-event-page-btn" class="btn-primary" style="display:inline-flex; align-items:center; gap:0.5rem; cursor:pointer;">
                        <i class="fas fa-edit"></i> Modifica Pagina Evento
                    </button>
                    <button id="delete-event-page-btn" class="btn-ghost" style="display:inline-flex; align-items:center; gap:0.5rem; color:#e05b5b; border:1px solid #e05b5b44; cursor:pointer;">
                        <i class="fas fa-trash"></i> Elimina Evento
                    </button>
                </div>
            </div>
        `;

        document.getElementById('edit-event-page-btn').addEventListener('click', () => {
            let modal = document.getElementById('edit-modal');
            if (!modal) {
                modal = document.createElement('dialog');
                modal.id = 'edit-modal';
                modal.style.cssText = 'border:none; border-radius:var(--r-md); padding:2rem; max-width:550px; width:90%; box-shadow:var(--shadow-lg); background:var(--surface-1); color:var(--plum-dark);';
                document.body.appendChild(modal);
            }
            modal.innerHTML = `
                <form id="edit-form" style="font-family:var(--font-sans); display:flex; flex-direction:column; gap:1rem;">
                    <h3 style="font-family:var(--font-display); color:var(--lilac-deep); margin-bottom:0.5rem; font-size:1.4rem;">Modifica Evento & Pagina</h3>
                    
                    <div class="input-group">
                        <label style="font-size:0.85rem; font-weight:600; color:var(--plum-light);">Titolo Incontro *</label>
                        <input type="text" name="title" value="${escHtml(ev.title)}" required style="padding:0.5rem; border:1px solid var(--border); border-radius:var(--r-sm); background:var(--surface-2); color:var(--plum-dark); width:100%; box-sizing:border-box;">
                    </div>
                    
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
                        <div class="input-group">
                            <label style="font-size:0.85rem; font-weight:600; color:var(--plum-light);">Data</label>
                            <input type="date" name="date" value="${ev.date}" required style="padding:0.5rem; border:1px solid var(--border); border-radius:var(--r-sm); background:var(--surface-2); color:var(--plum-dark); width:100%; box-sizing:border-box;">
                        </div>
                        <div class="input-group">
                            <label style="font-size:0.85rem; font-weight:600; color:var(--plum-light);">Ora</label>
                            <input type="time" name="time" value="${ev.time || '18:00'}" required style="padding:0.5rem; border:1px solid var(--border); border-radius:var(--r-sm); background:var(--surface-2); color:var(--plum-dark); width:100%; box-sizing:border-box;">
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns:1fr 2fr; gap:0.75rem;">
                        <div class="input-group">
                            <label style="font-size:0.85rem; font-weight:600; color:var(--plum-light);">Icona Emoji</label>
                            <input type="text" name="icon" value="${escHtml(ev.icon || '📅')}" style="padding:0.5rem; border:1px solid var(--border); border-radius:var(--r-sm); background:var(--surface-2); color:var(--plum-dark); width:100%; box-sizing:border-box;">
                        </div>
                        <div class="input-group">
                            <label style="font-size:0.85rem; font-weight:600; color:var(--plum-light);">Luogo</label>
                            <input type="text" name="location" value="${escHtml(ev.location || "Libreria Cose d'Interni, Capua")}" required style="padding:0.5rem; border:1px solid var(--border); border-radius:var(--r-sm); background:var(--surface-2); color:var(--plum-dark); width:100%; box-sizing:border-box;">
                        </div>
                    </div>

                    <div class="input-group">
                        <label style="font-size:0.85rem; font-weight:600; color:var(--plum-light);">URL Locandina / Immagine (Opzionale)</label>
                        <input type="url" name="cover" value="${escHtml(ev.cover || '')}" placeholder="https://..." style="padding:0.5rem; border:1px solid var(--border); border-radius:var(--r-sm); background:var(--surface-2); color:var(--plum-dark); width:100%; box-sizing:border-box;">
                    </div>

                    <div class="input-group">
                        <label style="font-size:0.85rem; font-weight:600; color:var(--plum-light);">Descrizione & Programma</label>
                        <textarea name="description" rows="5" style="padding:0.5rem; border:1px solid var(--border); border-radius:var(--r-sm); background:var(--surface-2); color:var(--plum-dark); width:100%; box-sizing:border-box; resize:vertical;">${escHtml(ev.description || '')}</textarea>
                    </div>
                    
                    <div style="margin-top:0.5rem; display:flex; justify-content:flex-end; gap:0.75rem;">
                        <button type="button" id="cancel-event-edit-btn" class="btn-ghost" style="padding:0.5rem 1rem; border:1px solid var(--border); border-radius:var(--r-sm); cursor:pointer;">Annulla</button>
                        <button type="submit" class="btn-primary" style="padding:0.5rem 1.25rem; border-radius:var(--r-sm); cursor:pointer;">Salva Modifiche</button>
                    </div>
                </form>
            `;
            modal.showModal();
            document.getElementById('cancel-event-edit-btn').onclick = () => modal.close();
            document.getElementById('edit-form').onsubmit = e => {
                e.preventDefault();
                const data = new FormData(e.target);
                ev.title = data.get('title').trim();
                ev.date = data.get('date');
                ev.time = data.get('time');
                ev.icon = data.get('icon').trim() || '📅';
                ev.location = data.get('location').trim();
                ev.cover = data.get('cover').trim();
                ev.description = data.get('description').trim();

                localStorage.setItem('pt-meetings', JSON.stringify(meetings));
                modal.close();
                loadSingleEvent();
                alert('✦ Modifiche salvate con successo!');
            };
        });

        document.getElementById('delete-event-page-btn').addEventListener('click', () => {
            if (!confirm('Sei sicura di voler eliminare definitivamente questo evento?')) return;
            const updated = meetings.filter(m => m.id !== ev.id);
            localStorage.setItem('pt-meetings', JSON.stringify(updated));
            alert('✦ Evento eliminato.');
            window.location.href = 'eventi.html';
        });
    }
}

// ─── GESTIONE ARCHIVIO LIBRI ─────────────────────────────────────
function populateDefaultBooks() {
    const defaultBooks = [
        {
            id: 'but-santa-i-love-him',
            title: 'But Santa, I love him',
            author: 'Hazel Riley & Karim B.',
            cover: 'https://www.sperling.it/content/uploads/2025/11/978882008377HIG.JPG',
            stars: '★★★★★',
            rating: '4.1',
            desc: `<p style="margin-bottom:1.5rem;">La primissima lettura ufficiale del nostro club! Un delizioso calendario dell'avvento romance che ci ha riscaldato il cuore durante le feste natalizie.</p>
            <p style="margin-bottom:1.5rem;">Con le sue atmosfere accoglienti, i segreti sotto il vischio e le dolci storie d'amore, ci ha fatto sognare ed è stato il perfetto punto d'inizio per la nostra magica cerchia letteraria. Discuterlo davanti a tazze di tisana calda e dolcetti natalizi alla Libreria Cose d'Interni ha reso tutto ancora più speciale.</p>
            <p><em>In breve:</em> Un romance natalizio soffice, accattivante ed avvolgente, perfetto per iniziare l'avventura delle Plot Twisters!</p>`
        },
        {
            id: 'e-poi-ci-sono-io',
            title: 'E poi ci sono io',
            author: 'Kathleen Glasgow',
            cover: 'https://m.media-amazon.com/images/I/71oxIHcsUZL.jpg',
            stars: '★★★★★',
            rating: '4.0',
            desc: `<p style="margin-bottom:1.5rem;">Un romanzo profondo, crudo ed estremamente toccante. La storia di Charlie Davis e del suo percorso di guarigione e rinascita ci ha commosse ed emozionate tantissimo. Kathleen Glasgow affronta temi difficili e sensibili con una delicatezza e un'onestà disarmanti.</p>
            <p style="margin-bottom:1.5rem;">È stata una lettura intensa, che ha stimolato riflessioni intime e importanti tra tutte le partecipanti del club. Uno dei libri più significativi e amati del nostro scaffale, che ci ha ricordato il valore del supporto reciproco.</p>
            <p><em>In breve:</em> Una lettura toccante che lascia il segno, un inno alla rinascita ed alla speranza anche nei momenti più bui.</p>`
        },
        {
            id: 'brave-ragazze',
            title: 'Come uccidono le brave ragazze',
            author: 'Holly Jackson',
            cover: 'https://www.letture.org/wp-content/uploads/2022/09/come-uccidono-le-brave-ragazze-holly-jackson-copertina.jpeg',
            stars: '★★★★☆',
            rating: '4.7',
            desc: `<p style="margin-bottom:1.5rem;">Un thriller ad altissima tensione che ci ha tenute incollate alle pagine! Il caso di Andie Bell e Sal Singh a Little Kilton è gestito con un ritmo serratissimo. Abbiamo adorato Pip, la nostra giovane investigatrice tenace, intelligente ed estremamente determinata.</p>
            <p style="margin-bottom:1.5rem;">I colpi di scena finali ci hanno lasciate senza fiato durante l'incontro in libreria! È stata una delle discussioni più animate, in cui ognuna di noi ha cercato di indovinare il colpevole fino all'ultima riga. Consigliatissimo per chi ama i misteri adrenalinici.</p>
            <p><em>In breve:</em> Un ritmo pazzesco, indizi disseminati in modo geniale ed una protagonista indimenticabile. Non riuscirai a smettere di leggere!</p>`
        },
        {
            id: 'shatter-me',
            title: 'Shatter Me',
            author: 'Tahereh Mafi',
            cover: 'https://m.media-amazon.com/images/I/710p8hFwd9L._AC_UF1000,1000_QL80_.jpg',
            stars: '★★★★★',
            rating: '4.2',
            desc: `<p style="margin-bottom:1.5rem;">"Shatter Me" è stato uno dei libri più divisivi del nostro club. Da una parte lo stile di scrittura di Tahereh Mafi, poetico, frammentato, quasi claustrofobico all'inizio, ci ha catturate e costrette a metterci nei panni di Juliette. I suoi pensieri barrati sono stati un colpo di genio per mostrarci la sua salute mentale fragile.</p>
            <p style="margin-bottom:1.5rem;">Ma parliamo di quello che ha animato davvero il gruppo: <strong>Aaron Warner e Adam Kent</strong>. Il dibattito in libreria è stato acceso! Molte di noi non sopportano Adam (troppo protettivo, quasi asfissiante in certi momenti), mentre il fascino letale e i traumi complessi di Warner hanno conquistato una buona metà del club (sì, abbiamo un debole per i villain moralmente grigi!).</p>
            <p style="margin-bottom:1.5rem;">La trama distopica a volte fa da sfondo alle dinamiche romantiche e interiori dei personaggi, e questo può non piacere a tutti, ma per le amanti del character-driven romance, questo libro è una droga.</p>
            <p><em>In breve:</em> Preparati emotivamente. E se non ti convince al primo libro... aspetta di leggere "Ignite Me". La vera magia inizia lì!</p>`
        }
    ];
    localStorage.setItem('pt-books', JSON.stringify(defaultBooks));
}

function loadBooksArchive() {
    const container = document.getElementById('dynamic-books-archive');
    if (!container) return;

    try {
        const raw = localStorage.getItem('pt-books');
        if (!raw) return;

        const books = JSON.parse(raw);
        if (books.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:var(--plum-light); grid-column:1/-1;">Nessun libro in archivio al momento.</p>';
            return;
        }

        container.innerHTML = books.map(book => `
            <div class="bento-box" style="background:var(--ivory-2); padding:1.5rem; text-align:center; border:1px solid var(--border);">
                <div style="display:flex; justify-content:center; align-items:center; margin-bottom:1rem; width:100%; height:220px;">
                    <div class="book-3d-wrap" style="transform: scale(0.75); margin: 0;">
                        <div class="book-3d">
                            <img src="${escHtml(book.cover)}" alt="${escHtml(book.title)}">
                            <div class="book-pages"></div>
                            <div class="book-spine"></div>
                        </div>
                    </div>
                </div>
                <h3 style="font-family:var(--font-display); font-size:1.4rem; margin-bottom:0.2rem;">${escHtml(book.title)}</h3>
                <p style="font-size:0.9rem; color:var(--plum-light); margin-bottom:1rem;">di ${escHtml(book.author)}</p>
                <div style="display:flex; justify-content:center; gap:0.2rem; color:#f5a623; margin-bottom:1rem;">
                    ${escHtml(book.stars)}
                </div>
                <a href="recensione-singola.html?book=${escHtml(book.id)}" class="btn-outline" style="width:100%; justify-content:center; padding:0.4rem;">Leggi Recensioni</a>
            </div>
        `).join('');

    } catch (e) {
        console.warn('Errore caricamento archivio libri:', e);
    }
}

// ─── PAGINA NOVITÀ — MEDIA & AVVISI DINAMICI ──────────────────
function loadNewsToPage() {

    // ── Defaults (usati se l'admin non ha ancora salvato nulla) ──
    const defaultMedia = {
        ytCaption : '🎬 Guarda l\'After-Book in Cucina #1 dei Plot Twisters!',
        ytCover   : 'pt.jpeg',
        ytLink    : 'https://www.youtube.com/watch?v=DqMhcxTwcLA',
        igVideo   : 'reel.mp4',
        igCover   : 'pt.jpeg',
        igLink    : 'https://www.instagram.com/reel/DYoqs3MiRTX/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA=='
    };

    const defaultNotices = [
        {
            id    : 'notice-default-1',
            icon  : '📖',
            tag   : 'Lettura del Mese',
            title : 'Stiamo leggendo <em>"Get to You"</em> di Sara Rampado',
            desc  : 'Prepara il tuo diario di lettura! Parleremo del libro al prossimo incontro. Tieniti pronta con i tuoi pensieri e le tue teorie preferite 💜'
        },
        {
            id    : 'notice-default-2',
            icon  : '🎨',
            tag   : 'Evento Speciale · 30-31 Maggio',
            title : 'After Book al Museo Campano — Ingresso Libero!',
            desc  : 'Porta con te un amico, un pennello o semplicemente la tua curiosità. La libreria apre le porte all\'arte in tutte le sue forme per due serate indimenticabili.'
        },
        {
            id    : 'notice-default-3',
            icon  : '🎵',
            tag   : 'Playlist Aggiornata',
            title : 'La playlist da lettura è stata aggiornata!',
            desc  : 'Nuovi brani aggiunti per le sessioni di lettura di questo mese. Perfetta per leggere "Get to You" in atmosfera! <a href="https://open.spotify.com/playlist/6fl1qtLXPhmt9OuxHhkpZP?si=1fb8b8e379eb4c6a" target="_blank" rel="noopener" style="color:var(--lilac-deep);font-weight:600;">Ascolta su Spotify →</a>'
        }
    ];

    // ── Leggi da localStorage ──
    let media = { ...defaultMedia };
    try {
        const raw = localStorage.getItem('pt-news-media');
        if (raw) Object.assign(media, JSON.parse(raw));
    } catch(e) {}

    let notices = defaultNotices;
    try {
        const raw = localStorage.getItem('pt-news-notices');
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) notices = parsed;
        }
    } catch(e) {}

    // ── Renderizza sezione YouTube ──
    const ytContainer = document.getElementById('news-yt-container');
    if (ytContainer) {
        ytContainer.innerHTML = `
        <p style="margin:5px auto 15px auto;font-family:var(--font-sans,sans-serif);font-size:0.85rem;color:#7f7555;font-style:italic;text-align:center;width:100%;max-width:380px;line-height:1.4;">
            ${media.ytCaption}
        </p>
        <div style="width:100%;max-width:440px;margin:2rem auto;padding:25px 20px;background:#f4edd2;border-radius:12px;border:2px dashed #d1c7a3;box-shadow:inset 0 0 20px rgba(0,0,0,0.05),0 10px 25px rgba(0,0,0,0.1);display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;box-sizing:border-box;">
            <div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);width:20px;height:20px;background:#e74c3c;border-radius:50%;box-shadow:0 4px 5px rgba(0,0,0,0.3);z-index:10;">
                <div style="position:absolute;top:3px;left:3px;width:6px;height:6px;background:rgba(255,255,255,0.6);border-radius:50%;"></div>
            </div>
            <div style="width:100%;max-width:360px;background:#fff;padding:10px;border-radius:4px;box-shadow:0 5px 15px rgba(0,0,0,0.15);transform:rotate(-1deg);transition:transform 0.3s ease;margin:0 auto 15px;box-sizing:border-box;"
                onmouseover="this.style.transform='rotate(0deg) scale(1.02)'"
                onmouseout="this.style.transform='rotate(-1deg)'">
                <div style="width:100%;aspect-ratio:16/9;border-radius:2px;overflow:hidden;background:#1a1a1a;display:flex;align-items:center;justify-content:center;position:relative;">
                    <img src="${escHtml(media.ytCover)}" alt="Copertina video" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.src='pt.jpeg'"/>
                    <div style="position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.15);"></div>
                </div>
            </div>
            <p style="margin:0 auto 18px;font-family:var(--font-sans,sans-serif);font-size:0.85rem;color:#7f7555;font-style:italic;text-align:center;width:100%;max-width:360px;line-height:1.4;display:block;box-sizing:border-box;">
                ${media.ytCaption}
            </p>
            <a href="${escHtml(media.ytLink)}" target="_blank" rel="noopener" style="text-decoration:none;display:inline-block;margin:0 auto;">
                <div style="background-color:var(--plum-dark,#4A154B);color:#fff;padding:0.75rem 1.6rem;border-radius:8px;font-family:var(--font-sans,sans-serif);font-weight:bold;font-size:0.85rem;display:inline-flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 10px rgba(0,0,0,0.15);transition:background-color 0.2s,transform 0.2s;"
                    onmouseover="this.style.backgroundColor='var(--plum-light,#6B206B)';this.style.transform='scale(1.03)'"
                    onmouseout="this.style.backgroundColor='var(--plum-dark,#4A154B)';this.style.transform='scale(1)'">
                    <span>Guarda su YouTube</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                </div>
            </a>
        </div>`;
    }

    // ── Renderizza Reel Instagram ──
    const igContainer = document.getElementById('news-ig-container');
    if (igContainer) {
        igContainer.innerHTML = `
        <div style="width:100%;border-radius:var(--r-md);overflow:hidden;border:1px solid var(--border);box-shadow:var(--shadow-sm);background:var(--ivory-2);">
            <div style="padding:1rem;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:0.75rem;">
                <div style="width:36px;height:36px;background:linear-gradient(135deg,var(--lilac-deep),#E1306C);border-radius:50%;display:flex;align-items:center;justify-content:center;">
                    <i class="fab fa-instagram" style="color:white;font-size:1rem;"></i>
                </div>
                <div>
                    <div style="font-weight:700;font-size:0.85rem;color:var(--plum);">c.plot.twisters</div>
                    <div style="font-size:0.75rem;color:var(--plum-light);">Reel</div>
                </div>
            </div>
            <div style="aspect-ratio:9/16;max-height:500px;overflow:hidden;background:#000;display:flex;align-items:center;justify-content:center;">
                <video src="${escHtml(media.igVideo)}" controls width="100%" height="100%" poster="${escHtml(media.igCover)}" style="object-fit:cover;">
                    Il tuo browser non supporta il tag video.
                </video>
            </div>
            <div style="padding:1rem;text-align:center;">
                <a href="${escHtml(media.igLink)}" target="_blank" rel="noopener"
                    style="display:inline-flex;align-items:center;gap:0.5rem;padding:0.5rem 1.25rem;border-radius:999px;background:linear-gradient(135deg,#f09433,#dc2743,#bc1888);color:white;font-weight:700;text-decoration:none;font-size:0.8rem;">
                    <i class="fab fa-instagram"></i> Guarda su Instagram
                </a>
            </div>
        </div>`;
    }

    // ── Renderizza Avvisi ──
    const noticesContainer = document.getElementById('news-notices-container');
    if (noticesContainer) {
        if (!notices.length) {
            noticesContainer.innerHTML = '<p style="color:var(--plum-light);text-align:center;font-size:0.9rem;">Nessun avviso in bacheca al momento.</p>';
            return;
        }

        // Colori accento ciclici per i bordi laterali
        const accentColors = ['var(--lilac-deep)', '#f5a623', '#1DB954', '#e05b5b', '#3a9bd5'];

        noticesContainer.innerHTML = notices.map((n, i) => {
            const color = accentColors[i % accentColors.length];
            return `
            <div style="display:flex;gap:1.25rem;background:var(--ivory-2);border-radius:var(--r-md);padding:1.5rem;border-left:4px solid ${color};border-top:1px solid var(--border);border-right:1px solid var(--border);border-bottom:1px solid var(--border);">
                <div style="font-size:1.75rem;flex-shrink:0;">${n.icon || '📌'}</div>
                <div>
                    <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;color:${color};font-weight:700;margin-bottom:0.3rem;">${escHtml(n.tag)}</div>
                    <h4 style="font-size:1rem;margin-bottom:0.4rem;">${n.title}</h4>
                    <p style="font-size:0.88rem;color:var(--plum-dark);margin:0;line-height:1.6;">${n.desc}</p>
                </div>
            </div>`;
        }).join('');
    }
}

// ─── ESPOSIZIONE GLOBALE PER REALTIME FIREBASE SYNC ───
window.loadDynamicCurrentBook = loadDynamicCurrentBook;
window.loadUpcomingMeetings = loadUpcomingMeetings;
window.loadBookCrushHighlight = loadBookCrushHighlight;
window.loadLeaderboardHome = loadLeaderboardHome;
window.loadBooksArchive = loadBooksArchive;
window.loadNewsToPage = loadNewsToPage;
window.loadDynamicReviews = loadDynamicReviews;
window.loadSingleReview = loadSingleReview;
window.loadSingleEvent = loadSingleEvent;
window.loadEventsArchive = loadEventsArchive;
window.initCalendar = initCalendar;
