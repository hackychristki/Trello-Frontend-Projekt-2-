// controller.js
import * as model from './model.js';
import view from './view.js';

const anmelden = document.getElementById("anmeldenB");
const insertKey = document.getElementById("insertKey");
const insertToken = document.getElementById("insertToken");

// Hilfsfunktion: Karten mit Listennamen anreichern (nur im Controller)
function getCardsWithListNames(cards) {
    return cards.map(card => ({
        ...card,
        listName: model.getListNameById(card.idList)
    }));
}

// --- View Callbacks registrieren ---

view.onSearch = (searchTerm) => {
    model.state.currentPage = 1; // Bei neuer Suche immer von Seite 1 starten
    const filtered = view.filterCards(model.state.cards, searchTerm);
    view.renderCards(
        getCardsWithListNames(filtered),
        model.state.currentPage,
        model.state.cardsPerPage
    );
};

view.onCreateCard = async ({ name, desc, idList }) => {
    try {
        await model.createCard({ name, desc, idList });
        model.state.currentPage = 1;
        view.renderCards(
        getCardsWithListNames(model.state.cards),
        model.state.currentPage,
        model.state.cardsPerPage
);
        view.clearCreateForm();
        view.showView('overview');
    } catch (error) {
        console.error('Fehler:', error);
        alert('Karte konnte nicht erstellt werden.');
    }
};

view.onEditCard = async ({ cardId, name, desc, idList }) => {
    try {
        await model.updateCard(cardId, { name, desc, idList });
        model.state.currentPage = 1;
        view.renderCards(
        getCardsWithListNames(model.state.cards),
        model.state.currentPage,
        model.state.cardsPerPage
);
        view.showView('overview');
        console.log("✅ Karte aktualisiert");
    } catch (error) {
        console.error('Fehler beim Aktualisieren:', error);
        alert('Karte konnte nicht aktualisiert werden.');
    }
};

view.onModalEdit = (cardId) => {
    const card = model.state.cards.find(({ id }) => id === cardId);

    if (card) {
        const { name, desc, idList } = card;

        document.getElementById('editCardName').value = name;
        document.getElementById('editCardDesc').value = desc || '';

        view.populateEditListSelect(model.state.lists);
        const editCardList = document.getElementById('editCardList');
        editCardList.value = idList;
        editCardList.dataset.cardId = cardId;

        view.closeCardModal();
        view.showView('edit');
    }
};

view.onModalDelete = async (cardId) => {
    try {
        await model.deleteCard(cardId);
        model.state.currentPage = 1;
        view.renderCards(
        getCardsWithListNames(model.state.cards),
        model.state.currentPage,
        model.state.cardsPerPage
);
        view.closeCardModal();
        console.log("✅ Karte gelöscht");
    } catch (error) {
        console.error('Fehler beim Löschen:', error);
        alert('Karte konnte nicht gelöscht werden.');
    }
};

view.onPageChange = (page) => {
    // Neue Seite im Model-State speichern
    model.state.currentPage = page;

    // Suchfeld-Inhalt berücksichtigen: falls der User gerade sucht,
    // soll die Pagination auf den gefilterten Karten arbeiten
    const searchTerm = document.getElementById('searchInput')?.value || '';
    const cards = searchTerm
        ? view.filterCards(model.state.cards, searchTerm)
        : model.state.cards;

    // View mit neuer Seite neu rendern
    view.renderCards(
        getCardsWithListNames(cards),
        model.state.currentPage,
        model.state.cardsPerPage
    );
};

// --- Login ---

anmelden.addEventListener("click", async function() {
    const { value: apiKeyValue } = insertKey;
    const { value: tokenValue } = insertToken;
    const apiKey = apiKeyValue.trim();
    const token = tokenValue.trim();

    if (!apiKey || !token) {
        alert("Bitte gib sowohl API-Key als auch Token ein!");
        return;
    }

    localStorage.setItem('trello_api_key', apiKey);
    localStorage.setItem('trello_token', token);
    model.setCredentials(apiKey, token);

    console.log("✅ Login erfolgreich");

    view.showView('main');
    document.getElementById('overview').classList.add('active');

    setTimeout(async () => {
        await model.loadCards();
        await model.loadLists();
        view.renderListOptions(model.state.lists);
        model.state.currentPage = 1;
        view.renderCards(
        getCardsWithListNames(model.state.cards),
        model.state.currentPage,
        model.state.cardsPerPage
);
    }, 200);
});

// --- Beim Laden gespeicherte Werte einfügen ---

window.addEventListener('load', () => {
    const savedApiKey = localStorage.getItem('trello_api_key');
    const savedToken = localStorage.getItem('trello_token');

    insertKey.value = savedApiKey || '';
    insertToken.value = savedToken || '';

    if (savedApiKey && savedToken) {
        model.setCredentials(savedApiKey, savedToken);
    }
});

console.log("Trello Controller initialized");