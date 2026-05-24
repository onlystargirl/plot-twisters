<!DOCTYPE html
<html lang="it" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Plot Twisters! | Book Club a Capua</title>
    <meta name="description" content="Plot Twisters! è il book club di Capua. Ci riuniamo ogni mese alla Libreria Cose d'Interni per parlare di libri, ridere e sognare insieme.">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,900;1,400;1,700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300;1,9..40,400&family=Cormorant:ital,wght@1,300;1,400;1,500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <?php include 'includes/header.php'; ?>
    <div class="particles" id="particles" aria-hidden="true"></div>
    <!-- HOME HERO -->
    <section class="home-hero">
        <div class="container">
            <div class="hero-inner">
                <div class="hero-overline"><span>Il nostro angolo magico 𝜗𝜚</span></div>
                <h1 class="hero-title">
                    Plot<br>
                    <em>Twisters!</em>
                </h1>
                <p class="hero-tagline">dove la magia prende vita, pagina dopo pagina</p>
                <p class="hero-desc">
                    Benvenuta nel nostro cerchio letterario. Ci incontriamo ogni mese alla <strong>Libreria Cose d'Interni a Capua</strong> per commentare libri, sognare ad occhi aperti, bere tisane calde e ridere in totale complicità.
                    Nessun giudizio, solo puro amore per la lettura.
                </p>
                <div class="hero-actions">
                    <a href="#lettura-mese" class="btn-primary">Lettura del Mese <i class="fas fa-book" style="margin-left:0.25rem;"></i></a>
                    <a href="chi-siamo.php" class="btn-outline">Scopri il Club <i class="fas fa-heart" style="margin-left:0.25rem;"></i></a>
                </div>
            </div>
            <div class="hero-visual" aria-hidden="true">
                <div class="hero-brand-group">
                    <img src="logo.png" alt="Plot Twisters Logo" class="hero-logo-standalone" id="main-logo">
                    <div class="hero-stat-pill-standalone">
                        <span class="stat-num">30+</span>
                        <span class="stat-label">Sognatrici</span>
                    </div>
                </div>
            </div>
        </div>
    </section>
    <!-- CONTENT SECTIONS -->
    <section class="bento-section">
        <div class="container">
            <div class="bento-grid-simple">
                <!-- Lettura del Mese (will be populated via fetch) -->
                <div class="bento-box bento-current-read" id="lettura-mese">
                    <span class="bento-tag">📖 lettura del mese</span>
                    <div class="bento-current-content" id="current-book">
                        <!-- Placeholder content; will be replaced by script.js fetch -->
                        <img src="https://www.sperling.it/content/uploads/2025/10/978882008373HIG.JPG" alt="Get to You Cover" class="bento-book-cover">
                        <div class="bento-book-details">
                            <h3>Get to You</h3>
                            <p class="bento-author">di Sara Rampado</p>
                            <p class="bento-book-desc">Il romance intenso e tormentato che ci sta tenendo incollate alla pagina nelle nostre letture serali.</p>
                            <div class="progress-wrap">
                                <div class="progress-meta">
                                    <span>Avanzamento Gruppo</span>
                                    <span>45%</span>
                                </div>
                                <div class="progress-track" role="progressbar" aria-valuenow="45" aria-valuemin="0" aria-valuemax="100">
                                    <div class="progress-fill" style="width: 45%;"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Filosofia -->
                <div class="bento-box bento-philosophy">
                    <span class="bento-tag">✨ la nostra filosofia</span>
                    <h3>Una Tazza di Tè e un<br><em>Capitolo alla Volta</em></h3>
                    <p>Siamo nate per creare uno spazio sereno e accogliente a Capua. Per noi leggere non è mai un'attività solitaria: significa sguardi complici, tisane fumanti e storie vissute insieme.</p>
                    <a href="chi-siamo.php" class="bento-arrow-link">Scopri di più su di noi →</a>
                </div>
                <!-- Newsletter -->
                <div class="bento-box bento-newsletter">
                    <span class="bento-tag">💌 unisciti a noi</span>
                    <h2>Entra nella <em>Cerchia</em></h2>
                    <p>Lascia il tuo indirizzo email per ricevere gli avvisi sui prossimi incontri a Capua.</p>
                    <form class="join-form" id="newsletter-form" onsubmit="submitNewsletter(event)">
                        <label for="newsletter-email" class="visually-hidden">Indirizzo Email</label>
                        <input type="email" id="newsletter-email" placeholder="La tua email..." required>
                        <button type="submit" class="btn-primary" id="newsletter-btn">Partecipa <i class="fas fa-paper-plane" style="margin-left: 0.5rem;"></i></button>
                        <p class="newsletter-feedback" id="newsletter-feedback" style="display:none;"></p>
                    </form>
                </div>
            </div>
        </div>
    </section>
    <?php include 'includes/footer.php'; ?>
    <script src="script.js"></script>
</body>
</html>
