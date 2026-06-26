import * as model from './model.js';
import view from './view.js';

function getCardsWithListNames(cards) {
    return cards.map(card => ({
        ...card,
        listName: model.getListNameById(card.idList)
    }));
}

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
        view.renderCards(
            getCardsWithListNames(model.state.cards),
            model.state.currentPage,
            model.state.cardsPerPage
        );
        view.clearCreateForm();
        view.showView('overview');
    } catch (error) {
        alert('Fehler: Karte konnte nicht erstellt werden.');
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
    } catch (error) {
        alert('Fehler: Karte konnte nicht aktualisiert werden.');
    }
};

view.onModalEdit = (cardId) => {
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
        view.renderCards(
            getCardsWithListNames(model.state.cards),
            model.state.currentPage,
            model.state.cardsPerPage
        );
        view.closeCardModal();
    } catch (error) {
        alert('Fehler: Karte konnte nicht gelöscht werden.');
    }
};

view.onPageChange = (page) => {
    model.state.currentPage = page;
    const searchTerm = document.getElementById('searchInput')?.value || '';
    const cards = searchTerm
        ? view.filterCards(model.state.cards, searchTerm)
        : model.state.cards;

    view.renderCards(
        getCardsWithListNames(cards),
        model.state.currentPage,
        model.state.cardsPerPage
    );
};

const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const showSignupLink = document.getElementById('showSignup');
const showLoginLink = document.getElementById('showLogin');

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

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        try {
            const data = await model.login({ email, password });
            localStorage.setItem('token', data.token);

            view.showView('main');
            document.getElementById('overview').classList.add('active');

            await model.loadLists();
            await model.loadCards();

            const cardsWithNames = getCardsWithListNames(model.state.cards);
            view.renderCards(cardsWithNames, model.state.currentPage, model.state.cardsPerPage);
            view.renderListOptions(model.state.lists);
        } catch (error) {
            alert(error.message || 'Login fehlgeschlagen. Bitte überprüfe deine Daten.');
        }
    });
}

if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;

        try {
            await model.signup({ name, email, password });
            alert('✅ Account erfolgreich erstellt! Du kannst dich jetzt anmelden.');
            view.showView('login');
        } catch (error) {
            alert(error.message || 'Registrierung fehlgeschlagen.');
        }
    });
}

window.logout = function () {
    localStorage.removeItem('token');
    view.showView('login');
};