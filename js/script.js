document.addEventListener('DOMContentLoaded', () => {
    const searchBox = document.getElementById('searchBox');
    const categoryFilter = document.getElementById('categoryFilter');
    const spellList = document.getElementById('spellList');
    const noResults = document.getElementById('noResults');

    function renderSpells(filteredSpells) {
        spellList.innerHTML = '';
        
        if (filteredSpells.length === 0) {
            noResults.style.display = 'block';
            return;
        } else {
            noResults.style.display = 'none';
        }

        filteredSpells.forEach(spell => {
            const item = document.createElement('div');
            item.className = 'spell-item';

            item.innerHTML = `
                <span class="spell-name">${spell.name} <span class="spell-category">(${spell.category})</span></span>
                <div class="spell-dots"></div>
                <span class="spell-page">Pág. ${spell.page}</span>
            `;

            spellList.appendChild(item);
        });
    }

    function filterSpells() {
        const searchTerm = searchBox.value.toLowerCase().trim();
        const selectedCategory = categoryFilter.value.toLowerCase().trim();

        const filtered = spellsData.filter(spell => {
            const matchesSearch = spell.name.toLowerCase().includes(searchTerm);
            
            // Filtro flexível para abranger variações de nomes nas categorias
            let matchesCategory = true;
            if (selectedCategory !== "") {
                const spellCat = spell.category.toLowerCase();
                if (selectedCategory === "convocação") {
                    matchesCategory = spellCat.includes("convocação");
                } else if (selectedCategory === "criação de monstros") {
                    matchesCategory = spellCat.includes("criação");
                } else {
                    matchesCategory = spellCat === selectedCategory;
                }
            }

            return matchesSearch && matchesCategory;
        });

        renderSpells(filtered);
    }

    searchBox.addEventListener('input', filterSpells);
    categoryFilter.addEventListener('change', filterSpells);

    // Carga inicial
    renderSpells(spellsData);
});
