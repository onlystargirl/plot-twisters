// ═══════════════════════════════════════════════════════════════
//  PLOT TWISTERS — Main Script (pagine pubbliche)
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initParticles();
    initNavbar();
    initSidebar();

    // Inizializzazioni specifiche per pagina
    if (document.getElementById('calendar-grid')) initCalendar();
    if (document.getElementById('review-text'))   loadSingleReview();
    
    // Caricamento del libro del mese dinamico da Firestore
    setTimeout(loadDynamicCurrentBook, 600);
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
    const btns    = document.querySelectorAll('.menu-pill-btn');
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

// ─── DYNAMIC CURRENT BOOK (FIRESTORE) ──────────────────────────
async function loadDynamicCurrentBook() {
    if (!window.db) {
        console.log("Firebase non disponibile o caricato offline.");
        return;
    }
    try {
        const bookDoc = await window.db.collection('config').doc('currentBook').get();
        if (bookDoc.exists) {
            const data = bookDoc.data();
            
            // Trova tutti gli elementi delle copertine e dei dettagli nelle pagine
            const covers     = document.querySelectorAll('.bento-book-cover');
            const titles     = document.querySelectorAll('.bento-book-details h3, .current-book-title');
            const authors    = document.querySelectorAll('.bento-author, .current-book-author');
            const progressFills = document.querySelectorAll('.progress-fill');
            const progressTexts = document.querySelectorAll('.progress-meta span:last-child');
            const progressWraps = document.querySelectorAll('.progress-meta span:first-child');
            
            covers.forEach(c => {
                if (data.cover) c.src = data.cover;
                c.alt = `Copertina di ${data.title}`;
            });

            titles.forEach(t => {
                if (data.title) t.textContent = data.title;
            });

            authors.forEach(a => {
                if (data.author) a.textContent = 'di ' + data.author;
            });

            progressFills.forEach(f => {
                if (data.progress !== undefined) f.style.width = data.progress + '%';
            });

            progressTexts.forEach(pt => {
                if (data.progress !== undefined) pt.textContent = data.progress + '%';
            });

            progressWraps.forEach(pw => {
                if (data.progress !== undefined) {
                    pw.textContent = `Avanzamento Gruppo · ${data.progress}%`;
                }
            });
        }
    } catch (e) {
        console.warn("Impossibile caricare il libro dinamico da Firestore:", e);
    }
}

// ─── DECO PARTICLES ───────────────────────────────────────────
function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    const count  = window.innerWidth > 768 ? 16 : 7;
    const shapes = ['✦', '✧', '·', '⋆', '✶'];
    for (let i = 0; i < count; i++) {
        const p   = document.createElement('span');
        p.textContent = shapes[Math.floor(Math.random() * shapes.length)];
        const sz  = Math.random() * 10 + 7;
        p.style.cssText = `
            position:absolute;
            font-size:${sz}px;
            left:${Math.random()*100}vw;
            top:${Math.random()*100}vh;
            color:${Math.random()>0.5 ? 'rgba(181,160,221,0.28)' : 'rgba(150,129,203,0.22)'};
            pointer-events:none;
            animation:floatParticle ${Math.random()*22+18}s ${Math.random()*-20}s infinite linear;
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
window.submitNewsletter = async function(e) {
    e.preventDefault();
    const input    = document.getElementById('newsletter-email');
    const btn      = document.getElementById('newsletter-btn');
    const feedback = document.getElementById('newsletter-feedback');
    if (!input) return;

    const email = input.value.trim();
    if (!email) return;

    // Disable button while processing
    const origHTML = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span>';
    btn.disabled  = true;

    // Hide old feedback
    if (feedback) { feedback.style.display = 'none'; feedback.className = 'newsletter-feedback'; }

    try {
        if (window.db) {
            // Save to Firestore
            await window.db.collection('newsletter').add({
                email: email,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                source: 'website'
            });
        } else {
            // Fallback: localStorage
            let emails = JSON.parse(localStorage.getItem('newsletter_emails') || '[]');
            if (!emails.includes(email)) {
                emails.push(email);
                localStorage.setItem('newsletter_emails', JSON.stringify(emails));
            }
        }

        // Success feedback
        if (feedback) {
            feedback.textContent = '✦ Benvenuta nella cerchia! Ti terremo aggiornata.';
            feedback.className = 'newsletter-feedback success';
            feedback.style.display = 'block';
        }
        input.value = '';
    } catch (err) {
        console.error('Errore newsletter:', err);
        if (feedback) {
            feedback.textContent = 'Ops, qualcosa è andato storto. Riprova!';
            feedback.className = 'newsletter-feedback error';
            feedback.style.display = 'block';
        }
    }

    // Re-enable button
    btn.innerHTML = origHTML;
    btn.disabled  = false;

    // Hide feedback after 5 seconds
    if (feedback) {
        setTimeout(() => { feedback.style.display = 'none'; }, 5000);
    }
};

// ─── CALENDAR ─────────────────────────────────────────────────
const DUMMY_EVENTS = [
    { year:2026, month:0,  day:30, title:"Shoah – Racconti di memoria",    type:"live", time:"18:00", location:"Libreria Cose d'Interni, Capua" },
    { year:2026, month:4,  day:15, title:"Incontro Gruppo di Lettura",      type:"live", time:"18:00", location:"Libreria Cose d'Interni, Capua" },
    { year:2026, month:5,  day:12, title:"Incontro Giugno – Get to You",    type:"live", time:"18:00", location:"Libreria Cose d'Interni, Capua" },
];
const monthNames = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
let currentYear  = new Date().getFullYear();
let currentMonth = new Date().getMonth();

function initCalendar() {
    renderCalendar(currentYear, currentMonth);
    document.getElementById('prev-month').addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) { currentMonth = 11; currentYear--; }
        renderCalendar(currentYear, currentMonth);
    });
    document.getElementById('next-month').addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) { currentMonth = 0; currentYear++; }
        renderCalendar(currentYear, currentMonth);
    });
}

function renderCalendar(year, month) {
    document.getElementById('calendar-month-year').textContent = `${monthNames[month]} ${year}`;
    const grid       = document.getElementById('calendar-grid');
    if (!grid) return;
    grid.innerHTML   = '';
    const firstDay   = new Date(year, month, 1).getDay();
    const startOff   = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMo   = new Date(year, month+1, 0).getDate();
    const today      = new Date();

    for (let i = 0; i < startOff; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day empty';
        grid.appendChild(empty);
    }
    for (let d = 1; d <= daysInMo; d++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-day';
        cell.textContent = d;
        if (d === today.getDate() && month === today.getMonth() && year === today.getFullYear())
            cell.classList.add('today');
        const ev = DUMMY_EVENTS.find(e => e.year===year && e.month===month && e.day===d);
        if (ev) { cell.classList.add('has-event'); cell.title = ev.title; }
        grid.appendChild(cell);
    }
    renderEventsList(DUMMY_EVENTS.filter(e => e.year===year && e.month===month), monthNames[month]);
}

function renderEventsList(events, monthName) {
    const container = document.getElementById('events-container');
    if (!container) return;
    container.innerHTML = '';
    if (!events.length) {
        container.innerHTML = `<p style="text-align:center;color:var(--plum-light);padding:2rem 0;font-style:italic;">Nessun incontro in programma per ${monthName}.</p>`;
        return;
    }
    events.forEach(ev => {
        const card = document.createElement('div');
        card.className = 'event-card';
        card.innerHTML = `
            <span class="event-date-tag">${ev.day} ${monthName.substring(0,3)}</span>
            <h3>${ev.title}</h3>
            <div class="event-details">
                <div><i class="fas fa-map-marker-alt"></i>${ev.location}</div>
                <div><i class="fas fa-clock"></i>Ore ${ev.time}</div>
            </div>`;
        container.appendChild(card);
    });
}

// ─── SINGLE REVIEW ────────────────────────────────────────────
const REVIEWS_DB = {
    "shatter-me": {
        title:"Shatter Me", author:"Tahereh Mafi", rating:4.5, reviewer:"Dal nostro IG ✦",
        cover:"https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1487622956i/13642254.jpg",
        text:`<p>Juliette è un personaggio che spacca letteralmente la pagina! Le atmosfere sono incredibili e lo stile di scrittura è super particolare. Perfetto per le serate autunnali con una tisana fumante.</p>
              <p>Il modo in cui la Mafi esplora la mente frammentata della protagonista è pazzesco. All'inizio può sembrare caotico, ma è una scelta stilistica geniale che ti fa entrare perfettamente nella testa di una ragazza isolata dal mondo per 264 giorni.</p>
              <p>E poi parliamo di Warner. O di Adam? Insomma, un triangolo che fa scintille! Assolutamente da leggere se amate i distopici con un tocco di romance e superpoteri.</p>`
    },
    "brave-ragazze": {
        title:"Come uccidono le brave ragazze", author:"Holly Jackson", rating:5, reviewer:"Dal nostro IG ✦",
        cover:"https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1582236056i/40916679.jpg",
        text:`<p>Un thriller che ti tiene incollata fino all'ultima pagina! Holly Jackson sa davvero come scrivere un mistero. Ne abbiamo parlato per ore durante il nostro incontro a Capua e avevamo tutte teorie diverse!</p>
              <p>Pippa Fitz-Amobi è un'investigatrice dilettante perfetta: determinata, geniale, ma con i suoi difetti che la rendono umana e adorabile.</p>
              <p>Il finale è un susseguirsi di colpi di scena. Nessuna di noi aveva indovinato il vero colpevole! 5 stelle meritatissime.</p>`
    },
    "ci-sono-io": {
        title:"E poi ci sono io", author:"Kathleen Glasgow", rating:4, reviewer:"Dal nostro IG ✦",
        cover:"https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1435272635i/24863343.jpg",
        text:`<p>Una storia cruda, emozionante e potentissima. Il viaggio di Charlie ci ha distrutto il cuore ma è un libro che ti entra nell'anima. Preparate i fazzoletti.</p>
              <p>È un libro pesante, ma gestito con un'empatia e una delicatezza rara. Charlie è spezzata in mille pezzi, ma la sua determinazione a sopravvivere è commovente.</p>
              <p>Non è un libro facile, ma è uno di quei libri che ti cambiano la prospettiva. Al nostro incontro ci siamo tutte abbracciate a fine discussione.</p>`
    }
};

function loadSingleReview() {
    const id   = new URLSearchParams(window.location.search).get('id');
    const data = REVIEWS_DB[id];
    if (!data) {
        document.getElementById('review-title').textContent = "Recensione non trovata 😢";
        document.getElementById('review-text').innerHTML = `<p>Sembra che questo incantesimo non abbia funzionato. <a href='lettura.html' style='color:var(--lilac-deep)'>Torna indietro</a> per scoprire altre letture!</p>`;
        if (document.getElementById('review-cover')) document.getElementById('review-cover').style.display = 'none';
        return;
    }
    document.getElementById('review-title').textContent  = data.title;
    document.getElementById('review-author').textContent = 'di ' + data.author;
    document.getElementById('review-reviewer').textContent = data.reviewer;
    document.getElementById('review-cover').src = data.cover;
    document.getElementById('review-text').innerHTML = data.text;

    let stars = '';
    const full = Math.floor(data.rating);
    const half = data.rating % 1 !== 0;
    for (let i = 0; i < 5; i++) {
        if (i < full)              stars += '<i class="fas fa-star"></i>';
        else if (i===full && half) stars += '<i class="fas fa-star-half-alt"></i>';
        else                       stars += '<i class="far fa-star"></i>';
    }
    document.getElementById('review-rating').innerHTML = stars;
}
