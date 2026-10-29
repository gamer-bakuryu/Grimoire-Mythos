/* =====================================================
   GRIMOIRE-MYTHOS — Lógica de filtro e busca
   ===================================================== */

(function () {
    "use strict";

    // Referências DOM
    const searchInput = document.getElementById("searchInput");
    const typeFilter  = document.getElementById("typeFilter");
    const clearBtn    = document.getElementById("clearBtn");
    const spellList   = document.getElementById("spellList");
    const resultsInfo = document.getElementById("resultsInfo");
    const noResults   = document.getElementById("noResults");

    let spells = [];

    // =====================================================
    // CARREGAMENTO DOS DADOS
    // =====================================================
    async function loadSpells() {
        try {
            const response = await fetch("spells.json");
            if (!response.ok) throw new Error("Falha ao carregar spells.json");
            spells = await response.json();

            // Ordena alfabeticamente (respeitando acentos PT-BR)
            spells.sort((a, b) =>
                a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" })
            );

            populateCategories();
            render();
        } catch (err) {
            console.error(err);
            spellList.innerHTML =
                '<p class="no-results">Erro ao carregar os registros do Grimório. ' +
                'Verifique se <code>spells.json</code> está na mesma pasta.</p>';
        }
    }

    // =====================================================
    // POPULA O SELECT DE CATEGORIAS (dinamicamente)
    // =====================================================
    function populateCategories() {
        const categories = [...new Set(spells.map(s => s.category))]
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b, "pt-BR"));

        categories.forEach(cat => {
            const opt = document.createElement("option");
            opt.value = cat;
            opt.textContent = cat;
            typeFilter.appendChild(opt);
        });
    }

    // =====================================================
    // RENDERIZAÇÃO DO SUMÁRIO
    // =====================================================
    function render() {
        const term = searchInput.value.trim().toLowerCase();
        const category = typeFilter.value;

        // Filtro
        const filtered = spells.filter(spell => {
            const matchesName = spell.name.toLowerCase().includes(term);
            const matchesCat  = !category || spell.category === category;
            return matchesName && matchesCat;
        });

        // Info de resultados
        const total = spells.length;
        if (filtered.length === 0) {
            resultsInfo.textContent = `Nenhum registro encontrado em ${total} feitiços catalogados.`;
        } else if (filtered.length === total) {
            resultsInfo.textContent = `${total} feitiços catalogados — exibindo todos.`;
        } else {
            resultsInfo.textContent = `Exibindo ${filtered.length} de ${total} feitiços.`;
        }

        // Estado vazio
        if (filtered.length === 0) {
            spellList.innerHTML = "";
            noResults.hidden = false;
            return;
        }
        noResults.hidden = true;

        // Agrupa por categoria
        const grouped = {};
        filtered.forEach(spell => {
            const cat = spell.category || "Outros";
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(spell);
        });

        // Ordena categorias alfabeticamente
        const sortedCats = Object.keys(grouped).sort((a, b) =>
            a.localeCompare(b, "pt-BR")
        );

        // Monta HTML
        let html = "";
        sortedCats.forEach(cat => {
            html += `<h2 class="toc-category">${escapeHTML(cat)}</h2>`;
            grouped[cat].forEach(spell => {
                html += renderEntry(spell);
            });
        });

        spellList.innerHTML = html;
    }

    // =====================================================
    // RENDER DE UMA LINHA DO SUMÁRIO
    // Nome .................. Página
    // =====================================================
    function renderEntry(spell) {
        const safeName = highlightMatch(spell.name, searchInput.value.trim());
        return `
            <div class="toc-entry" title="Categoria: ${escapeHTML(spell.category || "—")}">
                <span class="toc-name">${safeName}</span>
                <span class="toc-dots" aria-hidden="true"></span>
                <span class="toc-page">Pág. ${spell.page}</span>
            </div>
        `;
    }

    // =====================================================
    // HIGHLIGHT DO TERMO BUSCADO
    // =====================================================
    function highlightMatch(text, term) {
        const safeText = escapeHTML(text);
        if (!term) return safeText;
        const safeTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`(${safeTerm})`, "gi");
        return safeText.replace(regex, "<strong>$1</strong>");
    }

    // =====================================================
    // ESCAPE HTML (segurança contra injeção)
    // =====================================================
    function escapeHTML(str) {
        if (str == null) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    // =====================================================
    // EVENTOS
    // =====================================================
    searchInput.addEventListener("input", render);
    typeFilter.addEventListener("change", render);
    clearBtn.addEventListener("click", () => {
        searchInput.value = "";
        typeFilter.value = "";
        render();
        searchInput.focus();
    });

    // Inicializa
    loadSpells();
})();
