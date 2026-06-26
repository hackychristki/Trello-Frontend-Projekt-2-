// model.js
export const state = {
    cards: [],
    lists: [],
    currentBoardId: "69baa64fde283946c185b118",
    apiKey: null,
    token: null,
    currentPage: 1,      // Welche Seite ist gerade aktiv?
    cardsPerPage: 5,
};

const DEFAULT_API_KEY = "c00c9baa4bf619be642ea7036fe60762";
const DEFAULT_TOKEN = "ATTA652d12603e14892bc9936b8b8711a8472c8203b35d8b60db61440ad90fe0554b8ABC79889";


export async function fetchTrello(endpoint, { method = 'GET', body = null } = {}) {
    const baseURL = 'http://127.0.0.1:3000/api/v1';
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const url = `${baseURL}/${cleanEndpoint}`;

    console.log(`🔗 Fetching: ${method} ${url}`);

    const options = { 
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    // JWT Token automatisch mitschicken
    const token = localStorage.getItem('token');
    if (token) {
        options.headers.Authorization = `Bearer ${token}`;
    }

    if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
        let errorMsg = `API Fehler ${response.status}`;
        try {
            const errorData = await response.json();
            errorMsg = errorData.message || errorMsg;
        } catch (e) {}
        throw new Error(errorMsg);
    }

    return await response.json();
}

export async function loadCards() {
    try {
        const response = await fetchTrello('cards');

        console.log("📥 Raw Cards Response:", response);

        let cards = [];

        // Genau auf deine Backend-Struktur angepasst
        if (response?.data?.cards) {
            cards = response.data.cards;
        } else if (response?.data && Array.isArray(response.data)) {
            cards = response.data;
        } else if (Array.isArray(response)) {
            cards = response;
        }

        state.cards = cards;
        
        console.log(`✅ ${cards.length} Karten erfolgreich geladen`);
        console.log("Karten im State:", state.cards);

        return cards;

    } catch (error) {
        console.error("Fehler beim Laden der Karten:", error);
        state.cards = [];
        throw error;
    }
}

export function setCredentials(apiKey, token) {
    state.apiKey = apiKey;
    state.token = token;
}

export async function loadLists() {
    try {
        const response = await fetchTrello('lists');

        console.log("📥 Raw Lists Response:", response);

        // Backend-Struktur extrahieren
        let lists = [];
        
        if (response?.data?.lists) {
            lists = response.data.lists;
        } else if (response?.data) {
            lists = Array.isArray(response.data) ? response.data : [];
        } else if (Array.isArray(response)) {
            lists = response;
        }

        state.lists = lists;
        console.log("✅ Lists erfolgreich geladen:", state.lists.length, "Listen");
        
        return state.lists;

    } catch (error) {
        console.error("Fehler beim Laden der Listen:", error);
        state.lists = [];
        throw error;
    }
}

export function getListNameById(listId) {
    if (!listId) return "Unbekannte Liste";

    const list = state.lists.find(l => 
        l._id === listId || l.id === listId
    );

    return list ? list.name : listId;   // Fallback: ID anzeigen
}

export async function createCard({ name, desc, idList }) {
    try {
        const body = { 
            name, 
            desc: desc || '', 
            idList 
        };

        const response = await fetchTrello('cards', { method: 'POST', body });

        const newCard = response?.data?.card || response?.data || response;

        if (newCard) {
            // Listennamen direkt hinzufügen
            newCard.listName = getListNameById(newCard.idList);
            state.cards.unshift(newCard);   // Neueste Karte oben
        }

        console.log("✅ Neue Karte erstellt:", newCard);
        return newCard;

    } catch (error) {
        console.error("❌ Fehler beim Erstellen:", error);
        throw error;
    }
}

export async function getList(card) {
    const list = state.lists.find(l => l.id === card.idList);
    if (list) return list.name;

    const listData = await fetchTrello(`cards/${card.id}/list`);
    return listData.name;
}

export async function deleteCard(cardId) {
    if (!cardId) {
        console.error("❌ deleteCard: Keine cardId übergeben!");
        alert("Fehler: Karte konnte nicht gefunden werden.");
        return;
    }

    try {
        console.log("🗑️ Lösche Karte mit ID:", cardId);

        const response = await fetchTrello(`cards/${cardId}`, { method: 'DELETE' });

        console.log("📥 Delete Response:", response);

        // State aktualisieren
        state.cards = state.cards.filter(c => 
            (c._id !== cardId) && (c.id !== cardId)
        );

        console.log("✅ Karte erfolgreich gelöscht");
        return true;

    } catch (error) {
        console.error("❌ Fehler beim Löschen:", error);
        throw error;
    }
}

export async function updateCard(cardId, updates) {
    try {
        const body = {};

        if (updates.name !== undefined) body.name = updates.name;
        if (updates.desc !== undefined) body.desc = updates.desc || '';
        if (updates.idList !== undefined) body.idList = updates.idList;
        if (updates.due !== undefined) body.due = updates.due;
        if (updates.closed !== undefined) body.closed = updates.closed;

        const response = await fetchTrello(`cards/${cardId}`, { 
            method: 'PATCH', 
            body 
        });

        console.log("📥 Update Response:", response);

        // Aktualisierte Karte extrahieren
        let updatedCard = response?.data?.card || response?.data || response;

        if (updatedCard) {
            // WICHTIG: Listennamen neu setzen
            updatedCard.listName = getListNameById(updatedCard.idList);
        }

        // State aktualisieren
        const index = state.cards.findIndex(c => 
            c._id === cardId || c.id === cardId
        );

        if (index !== -1 && updatedCard) {
            state.cards[index] = updatedCard;
            console.log("✅ Karte im State aktualisiert mit ListName:", updatedCard.listName);
        }

        return updatedCard;

    } catch (error) {
        console.error("❌ Fehler beim Aktualisieren:", error);
        throw error;
    }
}

// ===================== AUTH FUNCTIONS =====================

export async function signup({ name, email, password }) {
    try {
        const response = await fetchTrello('users/signup', {
            method: 'POST',
            body: { name, email, password }
        });

        const data = response?.data || response;
        console.log("✅ Signup Response:", data);
        return data;

    } catch (error) {
        console.error("Signup Fehler:", error);
        throw error;
    }
}

export async function login({ email, password }) {
    try {
        const response = await fetchTrello('users/login', {
            method: 'POST',
            body: { email, password }
        });

        const data = response?.data || response;

        if (data.token) {
            localStorage.setItem('token', data.token);
            console.log("🔑 JWT Token gespeichert");
        }

        console.log("✅ Login Response:", data);
        return data;

    } catch (error) {
        console.error("Login Fehler:", error);
        throw error;
    }
}

// Später kannst du hier loadBoards() etc. hinzufügen