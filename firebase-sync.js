// ═══════════════════════════════════════════════════════════════
//  PLOT TWISTERS — Realtime Firebase Sync
// ═══════════════════════════════════════════════════════════════

(function() {
    // Shared keys that belong to club data in Firestore
    // Note: private keys (pt-auth, pt-user-name, pt-user-admin, pt-theme, pt-data-version) are NEVER synced.
    const PRIVATE_KEYS = ['pt-auth', 'pt-user-name', 'pt-user-admin', 'pt-theme', 'pt-data-version'];
    
    function isSharedKey(key) {
        if (!key) return false;
        if (PRIVATE_KEYS.includes(key)) return false;
        return key.startsWith('pt-') || key === 'newsletter_emails';
    }

    const originalSetItem = localStorage.setItem.bind(localStorage);
    const originalRemoveItem = localStorage.removeItem.bind(localStorage);

    // Flag to prevent feedback loops when Firestore updates localStorage
    let isApplyingRemoteChange = false;

    // Hook localStorage.setItem
    localStorage.setItem = function(key, value) {
        originalSetItem(key, value);
        
        if (!isApplyingRemoteChange && isSharedKey(key) && window.db) {
            const dataToSave = typeof value === 'string' ? value : JSON.stringify(value);
            window.db.collection('club_data').doc(key).set({ 
                data: dataToSave
            }).catch(err => {
                console.error("Firestore sync write error for key " + key + ":", err);
            });
        }
    };

    // Hook localStorage.removeItem
    localStorage.removeItem = function(key) {
        originalRemoveItem(key);
        
        if (!isApplyingRemoteChange && isSharedKey(key) && window.db) {
            window.db.collection('club_data').doc(key).delete().catch(err => {
                console.error("Firestore sync delete error for key " + key + ":", err);
            });
        }
    };

    // Master function to re-render any active components on whatever page is open
    window.refreshAllPageContent = function() {
        try {
            // Dashboard functions
            if (typeof window.loadDiary === 'function') window.loadDiary();
            if (typeof window.loadReviews === 'function') window.loadReviews();
            if (typeof window.loadWishlist === 'function') window.loadWishlist();
            if (typeof window.loadMeetings === 'function') window.loadMeetings();
            if (typeof window.loadEventsAdmin === 'function') window.loadEventsAdmin();
            if (typeof window.loadBookCrush === 'function') window.loadBookCrush();
            if (typeof window.loadLeaderboard === 'function') window.loadLeaderboard();
            if (typeof window.loadPdfs === 'function') window.loadPdfs();
            if (typeof window.loadCurrentBookAdmin === 'function') window.loadCurrentBookAdmin();
            if (typeof window.loadNewsMediaAdmin === 'function') window.loadNewsMediaAdmin();
            if (typeof window.loadNewsNoticesAdmin === 'function') window.loadNewsNoticesAdmin();

            // Script.js functions (Public pages)
            if (typeof window.loadDynamicCurrentBook === 'function' && (document.getElementById('lettura-mese') || document.querySelector('.current-book-title') || document.querySelector('.bento-book-cover'))) {
                window.loadDynamicCurrentBook();
            }
            if (typeof window.loadUpcomingMeetings === 'function' && (document.getElementById('upcoming-meetings') || document.getElementById('novita-upcoming-events'))) {
                window.loadUpcomingMeetings();
            }
            if (typeof window.loadBookCrushHighlight === 'function' && document.getElementById('bookcrush-highlight')) {
                window.loadBookCrushHighlight();
            }
            if (typeof window.loadLeaderboardHome === 'function' && document.getElementById('home-leaderboard')) {
                window.loadLeaderboardHome();
            }
            if (typeof window.loadBooksArchive === 'function' && document.getElementById('dynamic-books-archive')) {
                window.loadBooksArchive();
            }
            if (typeof window.loadNewsToPage === 'function' && (document.getElementById('news-yt-container') || document.getElementById('news-notices-container'))) {
                window.loadNewsToPage();
            }
            if (typeof window.loadDynamicReviews === 'function' && document.getElementById('dynamic-reviews-container')) {
                window.loadDynamicReviews();
            }
            if (typeof window.loadSingleReview === 'function' && document.getElementById('review-book-title')) {
                window.loadSingleReview();
            }
            if (typeof window.loadSingleEvent === 'function' && document.getElementById('event-title')) {
                window.loadSingleEvent();
            }
            if (typeof window.loadEventsArchive === 'function' && document.getElementById('dynamic-events-grid')) {
                window.loadEventsArchive();
            }
            if (typeof window.initCalendar === 'function' && document.getElementById('calendar-grid')) {
                window.initCalendar();
            }
            
            // Estrazione
            if (typeof window.loadEstrazione === 'function') {
                window.loadEstrazione();
            }
        } catch (err) {
            console.warn("Errore durante il refresh della pagina:", err);
        }
    };

    // Realtime synchronization from Firestore to localStorage & DOM
    function initRealtimeSync() {
        if (!window.db) {
            console.warn("Firebase non inizializzato. Impossibile sincronizzare.");
            return;
        }

        window.db.collection('club_data').onSnapshot((snapshot) => {
            isApplyingRemoteChange = true;
            try {
                let hasChanges = false;
                snapshot.docChanges().forEach((change) => {
                    const docId = change.doc.id;
                    if (!isSharedKey(docId)) return;

                    if (change.type === 'removed') {
                        originalRemoveItem(docId);
                        hasChanges = true;
                    } else {
                        const cloudData = change.doc.data();
                        const val = cloudData ? cloudData.data : null;
                        if (val !== null && val !== undefined) {
                            const strVal = typeof val === 'string' ? val : JSON.stringify(val);
                            const currVal = localStorage.getItem(docId);
                            if (currVal !== strVal) {
                                originalSetItem(docId, strVal);
                                hasChanges = true;
                            }
                        }
                    }
                });

                if (hasChanges) {
                    console.log("✦ Dati aggiornati dal cloud in tempo reale!");
                    window.refreshAllPageContent();
                }
            } catch (err) {
                console.error("Errore durante l'applicazione snapshot da Firestore:", err);
            } finally {
                isApplyingRemoteChange = false;
            }
        }, (error) => {
            console.error("Errore realtime Firestore:", error);
        });
    }

    if (window.db) {
        initRealtimeSync();
    } else {
        window.addEventListener('load', initRealtimeSync);
    }
})();
