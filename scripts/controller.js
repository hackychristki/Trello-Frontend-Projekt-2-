// controller.js
import * as model from './model.js';
import view from './view.js';

// Hilfsfunktion: Karten mit Listennamen anreichern
function getCardsWithListNames(cards) {
    return cards.map(card => ({
        ...card,
        listName: model.getListNameById(card.idList)
    }));
}

// --- View Callbacks registrieren ---
view.onSearch = (searchTerm) => {
    model.state.currentPage = 1;
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
        view.renderCards(getCardsWithListNames(model.state.cards), model.state.currentPage, model.state.cardsPerPage);
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
        
        // Neu rendern mit aktualisierten Listennamen
        view.renderCards(
            getCardsWithListNames(model.state.cards),
            model.state.currentPage,
            model.state.cardsPerPage
        );
        
        view.showView('overview');
        console.log("✅ Karte erfolgreich aktualisiert");
    } catch (error) {
        console.error('Fehler beim Aktualisieren:', error);
        alert('Karte konnte nicht aktualisiert werden.');
    }
};

view.onModalEdit = (cardId) => {
    console.log("✏️ onModalEdit aufgerufen mit ID:", cardId);

    if (!cardId) return;

    const card = model.state.cards.find(c => c._id === cardId || c.id === cardId);
    if (!card) return;

    document.getElementById('editCardName').value = card.name || '';
    document.getElementById('editCardDesc').value = card.desc || '';

    view.populateEditListSelect(model.state.lists);
    const editCardList = document.getElementById('editCardList');
    if (editCardList) {
        editCardList.value = card.idList;
        editCardList.dataset.cardId = cardId;
    }

    view.closeCardModal();
    view.showView('edit');
};

view.onModalDelete = async (cardId) => {
    if (!cardId) return;
    if (!confirm('Karte wirklich löschen?')) return;

    try {
        await model.deleteCard(cardId);
        model.state.currentPage = 1;
        view.renderCards(getCardsWithListNames(model.state.cards), model.state.currentPage, model.state.cardsPerPage);
        view.closeCardModal();
        console.log("✅ Karte gelöscht");
    } catch (error) {
        console.error('Fehler beim Löschen:', error);
        alert('Karte konnte nicht gelöscht werden.');
    }
};

view.onPageChange = (page) => {
    model.state.currentPage = page;
    const searchTerm = document.getElementById('searchInput')?.value || '';
    const cards = searchTerm ? view.filterCards(model.state.cards, searchTerm) : model.state.cards;
    view.renderCards(getCardsWithListNames(cards), model.state.currentPage, model.state.cardsPerPage);
};

// ===================== AUTH =====================

const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const showSignupLink = document.getElementById('showSignup');
const showLoginLink = document.getElementById('showLogin');

// Toggle Login / Signup
if (showSignupLink) {
    showSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        view.showView('signup');
    });
}
if (showLoginLink) {
    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        view.showView('login');
    });
}

// Login
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        try {
            const data = await model.login({ email, password });
            localStorage.setItem('token', data.token);

            console.log("✅ Login erfolgreich");
            view.showView('main');
            document.getElementById('overview').classList.add('active');

            // Daten laden
            await model.loadLists();
            await model.loadCards();

            console.log("=== NACH LOGIN ===");
            console.log("Anzahl Karten im State:", model.state.cards.length);

            // WICHTIG: Jetzt rendern!
            const cardsWithNames = getCardsWithListNames(model.state.cards);
            view.renderCards(cardsWithNames, model.state.currentPage, model.state.cardsPerPage);
            
            view.renderListOptions(model.state.lists);

        } catch (error) {
            console.error(error);
            alert(error.message || "Login fehlgeschlagen");
        }
    });
}

// Signup
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;

        try {
            await model.signup({ name, email, password });
            alert("✅ Account erfolgreich erstellt! Bitte melde dich an.");
            view.showView('login');
        } catch (error) {
            alert(error.message || "Registrierung fehlgeschlagen");
        }
    });
}

// Logout
window.logout = function() {
    localStorage.removeItem('token');
    view.showView('login');
    console.log("👋 Abgemeldet");
};

console.log("Trello Controller initialized");