export const state = {
    cards: [],
    lists: [],
    currentBoardId: "69baa64fde283946c185b118",
    apiKey: null,
    token: null,
    currentPage: 1,
    cardsPerPage: 5,
};

const DEFAULT_API_KEY = "c00c9baa4bf619be642ea7036fe60762";
const DEFAULT_TOKEN = "ATTA652d12603e14892bc9936b8b8711a8472c8203b35d8b60db61440ad90fe0554b8ABC79889";

export async function fetchTrello(endpoint, { method = 'GET', body = null } = {}) {
    const baseURL = 'http://127.0.0.1:3000/api/v1';
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const url = `${baseURL}/${cleanEndpoint}`;

    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

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

        let cards = [];

        if (response?.data?.cards) {
            cards = response.data.cards;
        } else if (response?.data && Array.isArray(response.data)) {
            cards = response.data;
        } else if (Array.isArray(response)) {
            cards = response;
        }

        state.cards = cards;

        return cards;

    } catch (error) {
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

        let lists = [];

        if (response?.data?.lists) {
            lists = response.data.lists;
        } else if (response?.data) {
            lists = Array.isArray(response.data) ? response.data : [];
        } else if (Array.isArray(response)) {
            lists = response;
        }

        state.lists = lists;

        return state.lists;

    } catch (error) {
        state.lists = [];
        throw error;
    }
}

export function getListNameById(listId) {
    if (!listId) return "Unbekannte Liste";

    const list = state.lists.find(l =>
        l._id === listId || l.id === listId
    );

    return list ? list.name : listId;
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
            newCard.listName = getListNameById(newCard.idList);
            state.cards.unshift(newCard);
        }

        return newCard;

    } catch (error) {
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
        alert("Fehler: Karte konnte nicht gefunden werden.");
        return;
    }

    try {
        const response = await fetchTrello(`cards/${cardId}`, { method: 'DELETE' });

        state.cards = state.cards.filter(c =>
            (c._id !== cardId) && (c.id !== cardId)
        );

        return true;

    } catch (error) {
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

        let updatedCard = response?.data?.card || response?.data || response;

        if (updatedCard) {
            updatedCard.listName = getListNameById(updatedCard.idList);
        }

        const index = state.cards.findIndex(c =>
            c._id === cardId || c.id === cardId
        );

        if (index !== -1 && updatedCard) {
            state.cards[index] = updatedCard;
        }

        return updatedCard;

    } catch (error) {
        throw error;
    }
}

export async function signup({ name, email, password }) {
    try {
        const response = await fetchTrello('users/signup', {
            method: 'POST',
            body: { name, email, password }
        });

        const data = response?.data || response;
        return data;

    } catch (error) {
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
        }

        return data;

    } catch (error) {
        throw error;
    }
}