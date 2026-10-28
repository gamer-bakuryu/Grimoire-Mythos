/* Grimoire-Mythos — busca e filtros do sumário de feitiços */
(function () {
  "use strict";

  // Opcional: se você hospedar o PDF (sua própria cópia, em local permitido),
  // coloque aqui o caminho. Ex.: "livro.pdf". Cada linha vira um link para a página.
  var PDF_URL = "";

  var DATA = window.GRIMOIRE;
  var OFFSET = DATA.offset;
  var CATS = DATA.categorias;

  function fold(s) {
    return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  var spells = DATA.magias.map(function (m) {
    return {
      nome: m[0],
      cats: m[1].split(""),
      pdf: m[2],
      livro: m[2] - OFFSET,
      nota: m[3] || "",
      foldNome: fold(m[0]),
      busca: fold(m[0] + " " + (m[3] || ""))
    };
  });

  var el = {
    q: document.getElementById("q"),
    chips: document.getElementById("chips"),
    todas: document.getElementById("todas"),
    ordem: document.getElementById("ordem"),
    limpar: document.getElementById("limpar"),
    contagem: document.getElementById("contagem"),
    resultado: document.getElementById("resultado")
  };

  var state = { q: "", cats: new Set(), todas: false, ordem: "az" };

  /* ---------- estado <-> URL (#q=...&c=EO&t=1&o=pg) ---------- */
  function readHash() {
    var p = new URLSearchParams(location.hash.replace(/^#/, ""));
    state.q = p.get("q") || "";
    state.cats = new Set((p.get("c") || "").split("").filter(function (c) { return CATS[c]; }));
    state.todas = p.get("t") === "1";
    state.ordem = p.get("o") === "pg" ? "pg" : "az";
  }
  function writeHash() {
    var p = new URLSearchParams();
    if (state.q) p.set("q", state.q);
    if (state.cats.size) p.set("c", Array.from(state.cats).join(""));
    if (state.todas) p.set("t", "1");
    if (state.ordem !== "az") p.set("o", state.ordem);
    var h = p.toString();
    history.replaceState(null, "", h ? "#" + h : location.pathname + location.search);
  }

  /* ---------- chips de categoria ---------- */
  var counts = {};
  spells.forEach(function (s) { s.cats.forEach(function (c) { counts[c] = (counts[c] || 0) + 1; }); });

  Object.keys(CATS).forEach(function (code) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.dataset.code = code;
    b.appendChild(document.createTextNode(CATS[code]));
    var n = document.createElement("small");
    n.textContent = counts[code] || 0;
    b.appendChild(n);
    b.addEventListener("click", function () {
      if (state.cats.has(code)) state.cats.delete(code); else state.cats.add(code);
      update();
    });
    el.chips.appendChild(b);
  });

  /* ---------- filtragem ---------- */
  function filtrar() {
    var tokens = fold(state.q).split(/\s+/).filter(Boolean);
    var sel = Array.from(state.cats);
    var out = spells.filter(function (s) {
      for (var i = 0; i < tokens.length; i++) if (s.busca.indexOf(tokens[i]) === -1) return false;
      if (!sel.length) return true;
      return state.todas
        ? sel.every(function (c) { return s.cats.indexOf(c) !== -1; })
        : sel.some(function (c) { return s.cats.indexOf(c) !== -1; });
    });
    if (state.ordem === "pg") {
      out = out.slice().sort(function (a, b) { return a.pdf - b.pdf || a.foldNome.localeCompare(b.foldNome, "pt-BR"); });
    }
    return { lista: out, tokens: tokens };
  }

  /* ---------- renderização ---------- */
  function destacar(parent, texto, tokens) {
    var f = fold(texto);
    if (!tokens.length || f.length !== texto.length) { parent.appendChild(document.createTextNode(texto)); return; }
    var marcado = new Array(texto.length).fill(false);
    tokens.forEach(function (t) {
      var i = f.indexOf(t);
      while (i !== -1) {
        for (var k = i; k < i + t.length; k++) marcado[k] = true;
        i = f.indexOf(t, i + t.length);
      }
    });
    var i = 0;
    while (i < texto.length) {
      var j = i;
      while (j < texto.length && marcado[j] === marcado[i]) j++;
      var trecho = texto.slice(i, j);
      if (marcado[i]) { var m = document.createElement("mark"); m.textContent = trecho; parent.appendChild(m); }
      else parent.appendChild(document.createTextNode(trecho));
      i = j;
    }
  }

  function criarItem(s, tokens) {
    var li = document.createElement("li");
    li.className = "item";

    var linha = document.createElement(PDF_URL ? "a" : "div");
    linha.className = "linha";
    if (PDF_URL) {
      linha.href = PDF_URL + "#page=" + s.pdf;
      linha.target = "_blank";
      linha.rel = "noopener";
    }

    var nome = document.createElement("span");
    nome.className = "nome";
    destacar(nome, s.nome, tokens);
    if (s.nota) {
      var nota = document.createElement("span");
      nota.className = "nota";
      nota.textContent = "(" + s.nota + ")";
      nome.appendChild(nota);
    }

    var pontos = document.createElement("span");
    pontos.className = "pontos";
    pontos.setAttribute("aria-hidden", "true");

    var pag = document.createElement("span");
    pag.className = "pag";
    pag.title = "Página " + s.pdf + " do PDF (página " + s.livro + " do livro)";
    var b = document.createElement("b");
    b.textContent = s.pdf;
    var l = document.createElement("small");
    l.textContent = "livro " + s.livro;
    pag.appendChild(b);
    pag.appendChild(l);

    linha.appendChild(nome);
    linha.appendChild(pontos);
    linha.appendChild(pag);
    li.appendChild(linha);

    var tags = document.createElement("span");
    tags.className = "tags";
    s.cats.forEach(function (c) {
      var t = document.createElement("span");
      t.textContent = CATS[c];
      tags.appendChild(t);
    });
    li.appendChild(tags);
    return li;
  }

  function render(res) {
    var frag = document.createDocumentFragment();
    var lista = res.lista;

    if (!lista.length) {
      var p = document.createElement("p");
      p.className = "vazio";
      p.textContent = "Nenhum feitiço encontrado. Tente outro nome ou remova algum filtro.";
      frag.appendChild(p);
    } else if (state.ordem === "az") {
      var ul = null, letraAtual = "";
      lista.forEach(function (s) {
        var letra = s.foldNome.charAt(0).toUpperCase();
        if (letra !== letraAtual) {
          letraAtual = letra;
          var h = document.createElement("h3");
          h.className = "letra";
          h.textContent = letra;
          frag.appendChild(h);
          ul = document.createElement("ul");
          ul.className = "lista";
          frag.appendChild(ul);
        }
        ul.appendChild(criarItem(s, res.tokens));
      });
    } else {
      var ul2 = document.createElement("ul");
      ul2.className = "lista";
      lista.forEach(function (s) { ul2.appendChild(criarItem(s, res.tokens)); });
      frag.appendChild(ul2);
    }

    el.resultado.replaceChildren(frag);
    var n = lista.length;
    var filtrado = state.q || state.cats.size;
    el.contagem.textContent = filtrado
      ? n + (n === 1 ? " feitiço encontrado" : " feitiços encontrados") + " de " + spells.length
      : spells.length + " feitiços";
  }

  function update() {
    Array.prototype.forEach.call(el.chips.children, function (b) {
      b.setAttribute("aria-pressed", state.cats.has(b.dataset.code) ? "true" : "false");
    });
    el.q.value = state.q;
    el.todas.checked = state.todas;
    el.ordem.value = state.ordem;
    render(filtrar());
    writeHash();
  }

  /* ---------- eventos ---------- */
  el.q.addEventListener("input", function () { state.q = el.q.value; update(); });
  el.todas.addEventListener("change", function () { state.todas = el.todas.checked; update(); });
  el.ordem.addEventListener("change", function () { state.ordem = el.ordem.value; update(); });
  el.limpar.addEventListener("click", function () {
    state.q = ""; state.cats.clear(); state.todas = false; state.ordem = "az";
    update();
    el.q.focus();
  });
  window.addEventListener("hashchange", function () { readHash(); update(); });

  readHash();
  update();
})();
