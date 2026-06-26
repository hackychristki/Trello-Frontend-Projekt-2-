// view.js
class View {
    constructor() {
        this.cardsContainer = document.getElementById('cards-container');
        this._initEventListeners();
    }

    _initEventListeners() {
        // Search
        document.getElementById('searchInput')?.addEventListener('input', (e) => {
            const { value: searchTerm } = e.target;
            this.onSearch?.(searchTerm);
        });

        // Create Card Save
        document.getElementById('createCardSave')?.addEventListener('click', () => {
            const { value: nameValue } = document.getElementById('createCardName');
            const { value: descValue } = document.getElementById('createCardDesc');
            const { value: idList } = document.getElementById('createCardList');
            const name = nameValue.trim();
            const desc = descValue.trim();

            if (!name || !idList) {
                alert('Name und Liste sind erforderlich.');
                return;
            }

            this.onCreateCard?.({ name, desc, idList });
        });

        // Edit Card Save
        document.getElementById('editCardSave')?.addEventListener('click', () => {
            const { dataset: { cardId } } = document.getElementById('editCardList');
            const { value: nameValue } = document.getElementById('editCardName');
            const { value: descValue } = document.getElementById('editCardDesc');
            const { value: idList } = document.getElementById('editCardList');
            const name = nameValue.trim();
            const desc = descValue.trim();

            if (!name || !idList) {
                alert('Name und Liste sind erforderlich.');
                return;
            }

            this.onEditCard?.({ cardId, name, desc, idList });
        });

        // Modal Edit Button
        document.getElementById('modalEditBtn')?.addEventListener('click', () => {
            const { dataset: { cardId } } = document.getElementById('cardModal');
            this.onModalEdit?.(cardId);
        });

        // Modal Delete Button
        document.getElementById('modalDeleteBtn')?.addEventListener('click', () => {
            const cardId = document.getElementById('cardModal').dataset.cardId;
            if (confirm('Bist du sicher, dass du diese Karte löschen möchtest?')) {
                this.onModalDelete?.(cardId);
            }
        });

        // Globale Funktionen für HTML onclick Handler
        window.showView = (viewId) => this.showView(viewId);
        window.closeCardModal = () => this.closeCardModal();

        document.getElementById('cards-container')?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-page]');
        if (!btn) return; // Klick war nicht auf einem Pagination-Button
            const page = parseInt(btn.dataset.page); // "2" → 2
            this.onPageChange?.(page);               // Callback zum Controller
        });
    }

    renderListOptions(lists) {
    const select = document.getElementById('createCardList');
    if (!select) return;

    select.innerHTML = lists
        .map(({ _id, id, name }) => `<option value="${_id || id}">${name}</option>`)
        .join('');
}


    clearCreateForm() {
        document.getElementById('createCardName').value = '';
        document.getElementById('createCardDesc').value = '';
        document.getElementById('createCardList').selectedIndex = 0;
    }

    // listName wird jetzt vom Controller mitgeliefert, kein model-Zugriff nötig
    filterCards(cards, searchTerm) {
        return cards.filter(({ name }) =>
            name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    renderCards(cards, currentPage = 1, cardsPerPage = 5) {
    const container = document.getElementById('cards-container');

    if (!container) {
        console.error("Container nicht gefunden!");
        return;
    }

    container.innerHTML = '';

    if (cards.length === 0) {
        container.innerHTML = '<p>Keine Karten gefunden.</p>';
        return;
    }

    // --- Berechnung: welche Karten gehören auf diese Seite? ---
    const totalPages = Math.ceil(cards.length / cardsPerPage);
    
   
    const safePage = Math.max(1, Math.min(currentPage, totalPages));

    const startIndex = (safePage - 1) * cardsPerPage; // Seite 2 → Index 5
    const endIndex   = startIndex + cardsPerPage;      // Seite 2 → Index 10
    const pageCards  = cards.slice(startIndex, endIndex);
    // gibt Karten an Index 5,6,7,8,9 zurück

    // --- Karten dieser Seite rendern ---
    pageCards.forEach(card => {
        const { listName, idList, name, desc, due } = card;

        const div = document.createElement('div');
        div.className = 'card';

        div.style.cssText = `
            padding: 20px;
            margin: 15px 0;
            border: 3px solid #3ca5e7;
            border-radius: 10px;
            background: #fff9e6;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            font-size: 17px;
            min-height: 80px;
            cursor: pointer;
        `;

        div.innerHTML = `
            <small>Liste: ${listName || idList}</small><br>
            <strong>${name}</strong><br><br>
            <small>${desc ? desc.substring(0, 120) + '...' : 'Keine Beschreibung'}</small><br><br>
            <small style="color:#e67e22; font-weight:bold;">
                ${due ? new Date(due).toLocaleDateString('de-DE') : 'Kein Fälligkeitsdatum'}
            </small>
            <small class="card-hint">✏ Zum Bearbeiten klicken</small>
        `;

        div.addEventListener('click', () => this.openCardModal(card));
        container.appendChild(div);
    });

    // --- Pagination-Leiste rendern ---
    // Nur anzeigen wenn es mehr als eine Seite gibt
    if (totalPages > 1) {
        const nav = document.createElement('div');
        nav.style.cssText = `
            display: flex;
            gap: 8px;
            justify-content: center;
            align-items: center;
            margin-top: 20px;
            flex-wrap: wrap;
        `;

        // Zurück-Button
        // data-page speichert die Zielseitenzahl – der Event Listener
        const prevBtn = document.createElement('button');
        prevBtn.textContent = '← Zurück';
        prevBtn.dataset.page = safePage - 1; 
        prevBtn.disabled = safePage === 1;   
        prevBtn.style.cssText = `
            padding: 6px 14px; border-radius: 6px; border: 1px solid #3ca5e7;
            background: ${safePage === 1 ? '#eee' : '#3ca5e7'};
            color: ${safePage === 1 ? '#999' : '#fff'};
            cursor: ${safePage === 1 ? 'default' : 'pointer'};
        `;
        nav.appendChild(prevBtn);

        // Seitenzahl-Buttons (eine Zahl pro Seite)
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.dataset.page = i; // Zielseitenzahl
            pageBtn.style.cssText = `
                padding: 6px 12px; border-radius: 6px; border: 1px solid #3ca5e7;
                background: ${i === safePage ? '#3ca5e7' : '#fff'};
                color: ${i === safePage ? '#fff' : '#3ca5e7'};
                font-weight: ${i === safePage ? 'bold' : 'normal'};
                cursor: pointer;
            `;
            nav.appendChild(pageBtn);
        }

        // Weiter-Button
        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Weiter →';
        nextBtn.dataset.page = safePage + 1;             // Zielseitenzahl
        nextBtn.disabled = safePage === totalPages;      // Auf letzter Seite deaktivieren
        nextBtn.style.cssText = `
            padding: 6px 14px; border-radius: 6px; border: 1px solid #3ca5e7;
            background: ${safePage === totalPages ? '#eee' : '#3ca5e7'};
            color: ${safePage === totalPages ? '#999' : '#fff'};
            cursor: ${safePage === totalPages ? 'default' : 'pointer'};
        `;
        nav.appendChild(nextBtn);

        container.appendChild(nav);
    }

    console.log(`✅ Seite ${safePage}/${totalPages} gerendert (${pageCards.length} Karten)`);
}

    showView(viewId) {
        document.querySelectorAll('.view').forEach(v => {
            if (v.id === 'main' && viewId !== 'login') {
                return;
            }
            v.classList.remove('active');
        });

        const targetView = document.getElementById(viewId);
        if (targetView) {
            targetView.classList.add('active');
        }
    }

    openCardModal(card) {
    const { _id, id, name, desc, listName, idList } = card;
    const realId = _id || id;   // Beide Möglichkeiten abdecken

    console.log("🃏 Modal geöffnet für Karte:", realId);

    document.getElementById('modalCardName').textContent = name;
    document.getElementById('modalCardDesc').textContent = desc || 'Keine Beschreibung';
    document.getElementById('modalCardList').textContent = `Liste: ${listName || idList}`;

    const modal = document.getElementById('cardModal');
    modal.dataset.cardId = realId;        // ← WICHTIG
    modal.classList.add('active');
}

    closeCardModal() {
        document.getElementById('cardModal').classList.remove('active');
    }

    populateEditListSelect(lists) {
    const editListSelect = document.getElementById('editCardList');
    if (editListSelect) {
        editListSelect.innerHTML = lists
            .map(({ _id, id, name }) => `<option value="${_id || id}">${name}</option>`)
            .join('');
    }
}
}

export default new View();