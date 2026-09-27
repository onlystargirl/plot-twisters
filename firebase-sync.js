// ═══════════════════════════════════════════════════════════════
//  PLOT TWISTERS — Firebase Sync
// ═══════════════════════════════════════════════════════════════

(function() {
    // Override localStorage.setItem to save to Firestore
    const originalSetItem = localStorage.setItem;
    
    localStorage.setItem = function(key, value) {
        originalSetItem.apply(this, arguments);
        
        // Non sincronizziamo cose locali come il tema o dati non pt-
        if (key.startsWith('pt-') && key !== 'pt-theme' && key !== 'pt-auth') {
            if (window.db) {
                window.db.collection('club_data').doc(key).set({ data: value })
                    .catch(err => console.error("Firebase sync error:", err));
            }
        }
    };

    // Load da Firestore al caricamento della pagina
    window.addEventListener('DOMContentLoaded', async () => {
        if (!window.db) {
            console.warn("Nessun database Firebase trovato. Sincronizzazione fallita.");
            return;
        }
        
        try {
            const snapshot = await window.db.collection('club_data').get();
            let changed = false;
            
            snapshot.forEach(doc => {
                const current = localStorage.getItem(doc.id);
                if (current !== doc.data().data) {
                    originalSetItem.call(localStorage, doc.id, doc.data().data);
                    changed = true;
                }
            });

            // Migrazione: carica i dati locali esistenti su Firebase se Firebase è vuoto per quelle chiavi
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('pt-') && key !== 'pt-theme' && key !== 'pt-auth') {
                    let found = false;
                    snapshot.forEach(doc => { if(doc.id === key) found = true; });
                    if (!found) {
                        console.log("✦ Migrazione iniziale su Firebase per:", key);
                        window.db.collection('club_data').doc(key).set({ data: localStorage.getItem(key) })
                            .catch(err => console.error("Firebase upload error:", err));
                    }
                }
            }
            
            // Se i dati sono stati aggiornati da Firebase, ricarica le funzioni di render per mostrare i dati nuovi
            if (changed) {
                // Funzioni di dashboard.js
                if (typeof loadDiary === 'function') loadDiary();
                if (typeof loadReviews === 'function') loadReviews();
                if (typeof loadWishlist === 'function') loadWishlist();
                if (typeof loadMeetings === 'function') loadMeetings();
                if (typeof loadBookCrush === 'function') loadBookCrush();
                if (typeof loadLeaderboard === 'function') loadLeaderboard();
                if (typeof loadPdfs === 'function') loadPdfs();
                if (typeof loadCurrentBookAdmin === 'function') loadCurrentBookAdmin();
                
                // Funzioni di script.js
                if (typeof initCalendar === 'function' && document.getElementById('calendar-grid')) initCalendar();
                if (typeof loadDynamicReviews === 'function' && document.getElementById('dynamic-reviews-container')) loadDynamicReviews();
                if (typeof loadSingleEvent === 'function' && document.getElementById('event-title')) loadSingleEvent();
                if (typeof loadUpcomingMeetings === 'function') loadUpcomingMeetings();
                if (typeof loadBookCrushHighlight === 'function') loadBookCrushHighlight();
                if (typeof loadLeaderboardHome === 'function') loadLeaderboardHome();
                if (typeof loadBooksArchive === 'function') loadBooksArchive();
                if (typeof loadDynamicCurrentBook === 'function') loadDynamicCurrentBook();
                if (typeof loadNewsToPage === 'function') loadNewsToPage();
            }
            
            console.log("✦ Sincronizzazione Firebase completata!");
            
        } catch(e) {
            console.error("Errore durante il recupero dei dati da Firebase:", e);
        }
    });
})();
