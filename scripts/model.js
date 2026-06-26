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
    const key = state.apiKey || DEFAULT_API_KEY;
    const token = state.token || DEFAULT_TOKEN;
    const url = `https://api.trello.com/1${endpoint}?key=${key}&token=${token}`;
    const options = { method };

    if (body && method !== 'GET') {
        options.body = body instanceof URLSearchParams ? body : new URLSearchParams(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
        throw new Error(`Trello Fehler: ${response.status}`);
    }
    return await response.json();
}

export async function loadCards() {
    try {
        const cards = await fetchTrello(`/boards/${state.currentBoardId}/cards`);
        state.cards = cards;
        console.log("Card:")
        console.log(cards)
        return cards;
    } catch (error) {
        console.error("Fehler beim Laden der Karten:", error);
        throw error;
    }
}

export function setCredentials(apiKey, token) {
    state.apiKey = apiKey;
    state.token = token;
}

export async function loadLists() {
    try {
        const lists = await fetchTrello(`/boards/${state.currentBoardId}/lists`);
        state.lists = lists;
        return lists;
    } catch (error) {
        console.error("Fehler beim Laden der Listen:", error);
        throw error;
    }
}

export function getListNameById(listId) {
    const list = state.lists.find(l => l.id === listId);
    return list ? list.name : listId;
}

export async function createCard({ name, desc, idList }) {
    const body = { name, desc: desc || '', idList };
    const newCard = await fetchTrello('/cards', { method: 'POST', body });
    state.cards.push(newCard);
    return newCard;
}

export async function getList(card) {
    const list = state.lists.find(l => l.id === card.idList);
    if (list) return list.name;

    const listData = await fetchTrello(`/cards/${card.id}/list`);
    return listData.name;
}

export async function deleteCard(cardId) {
    await fetchTrello(`/cards/${cardId}`, { method: 'DELETE' });
    state.cards = state.cards.filter(c => c.id !== cardId);
    return true;
}

export async function updateCard(cardId, { name, desc, idList }) {
    const body = { name, desc: desc || '', idList };
    const updatedCard = await fetchTrello(`/cards/${cardId}`, { method: 'PUT', body });
    
    const index = state.cards.findIndex(c => c.id === cardId);
    if (index !== -1) {
        state.cards[index] = updatedCard;
    }
    return updatedCard;
}

// Später kannst du hier loadBoards() etc. hinzufügen