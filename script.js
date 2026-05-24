// ═══════════════════════════════════════════════════════════════
//  PLOT TWISTERS — Main Script (pagine pubbliche, senza server)
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    // Versione dati: se cambia, svuota i dati obsoleti
    const DATA_VERSION = '2.1';
    if (localStorage.getItem('pt-data-version') !== DATA_VERSION) {
        localStorage.removeItem('pt-meetings');
        localStorage.removeItem('pt-reviews');
        localStorage.setItem('pt-data-version', DATA_VERSION);
    }

    // Inizializza recensioni di default se non presenti in localStorage
    if (!localStorage.getItem('pt-reviews')) {
        populateDefaultReviews();
    }

    initTheme();
    initParticles();
    initNavbar();
    initSidebar();

    // Inizializzazioni specifiche per pagina
    if (document.getElementById('calendar-grid')) initCalendar();
    if (document.getElementById('review-book-title')) loadSingleReview();
    if (document.getElementById('dynamic-reviews-container')) loadDynamicReviews();
    if (document.getElementById('event-title')) loadSingleEvent();

    // Inizializzazioni per la Homepage
    if (document.getElementById('lettura-mese')) loadDynamicCurrentBook();
    if (document.getElementById('upcoming-meetings')) loadUpcomingMeetings();
    if (document.getElementById('bookcrush-highlight')) loadBookCrushHighlight();
    if (document.getElementById('home-leaderboard')) loadLeaderboardHome();
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
    } catch (e) {
        console.warn('Errore lettura libro corrente:', e);
    }
}

function loadUpcomingMeetings() {
    const container = document.getElementById('upcoming-meetings');
    if (!container) return;

    try {
        const raw = localStorage.getItem('pt-meetings');
        if (!raw) return;

        const meetings = JSON.parse(raw);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const valid = meetings.filter(m => new Date(m.date) >= today);
        valid.sort((a, b) => new Date(a.date) - new Date(b.date));

        if (valid.length === 0) {
            container.innerHTML = '<p style="color:var(--plum-light); font-size:0.9rem;">Nessun incontro in programma al momento.</p>';
            return;
        }

        // Mostra i prossimi 2 incontri
        const toShow = valid.slice(0, 2);
        container.innerHTML = toShow.map(m => {
            const d = new Date(m.date);
            const day = d.getDate();
            const mon = d.toLocaleDateString('it-IT', { month: 'short' });
            return `
            <div style="display:flex; gap:1rem; align-items:center; background:var(--ivory-2); padding:1rem; border-radius:var(--r-sm); border:1px solid var(--border); margin-bottom:0.75rem;">
                <div style="text-align:center; background:var(--lilac-deep); color:white; border-radius:var(--r-sm); padding:0.5rem; min-width:4.5rem;">
                    <div style="font-size:1.5rem; font-weight:700; line-height:1;">${day}</div>
                    <div style="font-size:0.7rem; text-transform:uppercase;">${mon}</div>
                </div>
                <div>
                    <h4 style="font-size:0.95rem; font-weight:600; margin-bottom:0.25rem;">${escHtml(m.title)}</h4>
                    <p style="font-size:0.82rem; color:var(--plum-light);"><i class="fas fa-clock"></i> ${escHtml(m.time)} • <i class="fas fa-map-marker-alt"></i> ${escHtml(m.location)}</p>
                </div>
            </div>`;
        }).join('');

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

    const booksData = {
        'shatter-me': {
            title: 'Shatter Me',
            author: 'Tahereh Mafi',
            cover: 'https://m.media-amazon.com/images/I/710p8hFwd9L._AC_UF1000,1000_QL80_.jpg',
            stars: '★★★★☆',
            rating: '4.2',
            desc: `<p style="margin-bottom:1.5rem;">"Shatter Me" è stato uno dei libri più divisivi del nostro club. Da una parte lo stile di scrittura di Tahereh Mafi, poetico, frammentato, quasi claustrofobico all'inizio, ci ha catturate e costrette a metterci nei panni di Juliette. I suoi pensieri barrati sono stati un colpo di genio per mostrarci la sua salute mentale fragile.</p>
            <p style="margin-bottom:1.5rem;">Ma parliamo di quello che ha animato davvero il gruppo: <strong>Aaron Warner e Adam Kent</strong>. Il dibattito in libreria è stato acceso! Molte di noi non sopportano Adam (troppo protettivo, quasi asfissiante in certi momenti), mentre il fascino letale e i traumi complessi di Warner hanno conquistato una buona metà del club (sì, abbiamo un debole per i villain moralmente grigi!).</p>
            <p style="margin-bottom:1.5rem;">La trama distopica a volte fa da sfondo alle dinamiche romantiche e interiori dei personaggi, e questo può non piacere a tutti, ma per le amanti del character-driven romance, questo libro è una droga.</p>
            <p><em>In breve:</em> Preparati emotivamente. E se non ti convince al primo libro... aspetta di leggere "Ignite Me". La vera magia inizia lì!</p>`
        },
        'brave-ragazze': {
            title: 'Come uccidono le brave ragazze',
            author: 'Holly Jackson',
            cover: 'https://www.letture.org/wp-content/uploads/2022/09/come-uccidono-le-brave-ragazze-holly-jackson-copertina.jpeg',
            stars: '★★★★★',
            rating: '4.7',
            desc: `<p style="margin-bottom:1.5rem;">Un thriller ad altissima tensione che ci ha tenute incollate alle pagine! Il caso di Andie Bell e Sal Singh a Little Kilton è gestito con un ritmo serratissimo. Abbiamo adorato Pip, la nostra giovane investigatrice tenace, intelligente ed estremamente determinata.</p>
            <p style="margin-bottom:1.5rem;">I colpi di scena finali ci hanno lasciate senza fiato durante l'incontro in libreria! È stata una delle discussioni più animate, in cui ognuna di noi ha cercato di indovinare il colpevole fino all'ultima riga. Consigliatissimo per chi ama i misteri adrenalinici.</p>
            <p><em>In breve:</em> Un ritmo pazzesco, indizi disseminati in modo geniale ed una protagonista indimenticabile. Non riuscirai a smettere di leggere!</p>`
        },
        'e-poi-ci-sono-io': {
            title: 'E poi ci sono io',
            author: 'Kathleen Glasgow',
            cover: 'https://m.media-amazon.com/images/I/71oxIHcsUZL.jpg',
            stars: '★★★☆☆',
            rating: '4.0',
            desc: `<p style="margin-bottom:1.5rem;">Un romanzo profondo, crudo ed estremamente toccante. La storia di Charlie Davis e del suo percorso di guarigione e rinascita ci ha commosse ed emozionate tantissimo. Kathleen Glasgow affronta temi difficili e sensibili con una delicatezza e un'onestà disarmanti.</p>
            <p style="margin-bottom:1.5rem;">È stata una lettura intensa, che ha stimolato riflessioni intime e importanti tra tutte le partecipanti del club. Uno dei libri più significativi e amati del nostro scaffale, che ci ha ricordato il valore del supporto reciproco.</p>
            <p><em>In breve:</em> Una lettura toccante che lascia il segno, un inno alla rinascita ed alla speranza anche nei momenti più bui.</p>`
        },
        'but-santa-i-love-him': {
            title: 'But Santa, I love him',
            author: 'Hazel Riley & Karim B.',
            cover: 'https://www.sperling.it/content/uploads/2025/10/978882008377HIG.JPG',
            stars: '★★★★☆',
            rating: '4.1',
            desc: `<p style="margin-bottom:1.5rem;">La primissima lettura ufficiale del nostro club! Un delizioso calendario dell'avvento romance che ci ha riscaldato il cuore durante le feste natalizie.</p>
            <p style="margin-bottom:1.5rem;">Con le sue atmosfere accoglienti, i segreti sotto il vischio e le dolci storie d'amore, ci ha fatto sognare ed è stato il perfetto punto d'inizio per la nostra magica cerchia letteraria. Discuterlo davanti a tazze di tisana calda e dolcetti natalizi alla Libreria Cose d'Interni ha reso tutto ancora più speciale.</p>
            <p><em>In breve:</em> Un romance natalizio soffice, accattivante ed avvolgente, perfetto per iniziare l'avventura delle Plot Twisters!</p>`
        }
    };

    const data = booksData[bookKey] || booksData['shatter-me'];

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
    const adminContainer = document.getElementById('event-admin-controls');

    if (!titleEl) return;

    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('event') || 'meet-shoah';

    let meetings = [];
    try {
        meetings = JSON.parse(localStorage.getItem('pt-meetings') || '[]');
    } catch (e) { }

    const ev = meetings.find(m => m.id === eventId);
    if (!ev) {
        titleEl.textContent = "Evento non trovato";
        return;
    }

    // Imposta icona badge in base all'evento
    let icon = "📅";
    if (ev.id.includes('shoah')) icon = "🕯️";
    else if (ev.id.includes('legal')) icon = "⚖️";
    else if (ev.id.includes('placito')) icon = "📜";
    else if (ev.id.includes('notte') || ev.id.includes('artisti')) icon = "🎨";
    if (iconBadgeEl) iconBadgeEl.textContent = icon;

    // Formatta la data per il sottotitolo
    const dateObj = new Date(ev.date);
    const formattedDate = isNaN(dateObj) ? ev.date : dateObj.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

    // Aggiorna elementi HTML
    if (pageTitleEl) pageTitleEl.innerHTML = `Evento: <em>${escHtml(ev.title)}</em>`;
    if (dateHeroEl) dateHeroEl.textContent = `Incontro del ${formattedDate} alle ore ${escHtml(ev.time)}`;
    if (titleEl) titleEl.textContent = ev.title;
    if (dateEl) dateEl.textContent = ev.date;
    if (timeEl) timeEl.textContent = ev.time;
    if (locationEl) locationEl.textContent = ev.location;
    if (descEl) descEl.innerHTML = `<p style="margin:0;">${escHtml(ev.description || 'Nessuna descrizione disponibile.')}</p>`;

    // Controlli admin
    if (adminContainer && localStorage.getItem('pt-user-admin') === '1') {
        adminContainer.innerHTML = `
            <div style="text-align:center; margin-top:3rem; padding:2rem; background:linear-gradient(135deg, var(--lilac-pale), var(--ivory-2)); border-radius:var(--r-md); border:1px solid var(--border);">
                <span style="font-size:1.5rem; display:block; margin-bottom:0.75rem;">⚙️ Area Amministratore</span>
                <h4 style="font-family:var(--font-display); margin-bottom:0.5rem;">Vuoi modificare questo evento?</h4>
                <p style="font-size:0.9rem; color:var(--plum-light); margin-bottom:1.25rem;">Puoi modificare la data, l'ora, il titolo, il luogo o la descrizione di questo incontro.</p>
                <button id="edit-event-page-btn" class="btn-primary" style="display:inline-flex; margin:0 auto; cursor:pointer;">Modifica Evento <i class="fas fa-edit" style="margin-left:0.5rem;"></i></button>
            </div>
        `;
        document.getElementById('edit-event-page-btn').addEventListener('click', () => {
            editMeeting(eventId);
            // Override editMeeting onsubmit callback to reload the page on edit!
            const form = document.getElementById('edit-form');
            if (form) {
                form.onsubmit = e => {
                    e.preventDefault();
                    const data = new FormData(e.target);
                    ev.title = data.get('title');
                    ev.date = data.get('date');
                    ev.time = data.get('time');
                    ev.location = data.get('location');
                    ev.description = data.get('description');

                    localStorage.setItem('pt-meetings', JSON.stringify(meetings));
                    document.getElementById('edit-modal').close();
                    // Ricarica i dati per mostrare le modifiche in tempo reale
                    loadSingleEvent();
                };
            }
        });
    }
}
