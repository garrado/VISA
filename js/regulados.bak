(() => {
  const $ = (id) => document.getElementById(id);

  const els = {
    q: $("q"),
    btnClear: $("btnClear"),
    status: $("status"),
    results: $("results"),

    detailPanel: $("detailPanel"),
    btnCloseDetail: $("btnCloseDetail"),

    dTitle: $("dTitle"),
    dSub: $("dSub"),
    dCodigo: $("dCodigo"),
    dDoc: $("dDoc"),
    dEnd: $("dEnd"),
    dBairro: $("dBairro"),

    // Alvará (novo)
    dAlvEx: $("dAlvEx"),
    dAlvVal: $("dAlvVal"),

    btnAtividades: $("btnAtividades"),
    btnInspecoes: $("btnInspecoes"),

    // modal
    modal: $("modal"),
    modalBackdrop: $("modalBackdrop"),
    btnModalClose: $("btnModalClose"),
    mTitle: $("mTitle"),
    mSub: $("mSub"),
    mBody: $("mBody"),
  };

  const state = {
    indexLoaded: false,
    index: [],
    currentReg: null,
  };

  const setStatus = (msg) => {
    if (els.status) els.status.textContent = msg || "";
  };

  const safe = (v) => (v === null || v === undefined ? "" : String(v));

  const norm = (s) =>
    safe(s)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const pad5 = (n) => String(parseInt(n, 10) || 0).padStart(5, "0");
  const regPrefix = (codigo) => pad5(codigo).slice(0, 2);
  const hisBucket = (ndoc) => String((parseInt(ndoc, 10) || 0) % 100).padStart(2, "0");

  const debounce = (fn, ms = 150) => {
    let t = null;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };

  const fetchJson = async (path) => {
    // iOS/Safari costuma cachear agressivo
    const url = `${path}?v=${Date.now()}`;
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status} em ${path}`);
    return await r.json();
  };

  const closeModal = () => {
    if (els.modal) els.modal.hidden = true;
    if (els.modalBackdrop) els.modalBackdrop.hidden = true;
    if (els.mBody) els.mBody.textContent = "";
  };

  const openModal = (title, sub, body) => {
    if (els.modalBackdrop) els.modalBackdrop.hidden = false;
    if (els.modal) els.modal.hidden = false;
    if (els.mTitle) els.mTitle.textContent = title || "—";
    if (els.mSub) els.mSub.textContent = sub || "—";
    if (els.mBody) els.mBody.textContent = body || "";
  };

  const renderResults = (rows) => {
    if (!els.results) return;
    els.results.innerHTML = "";

    if (!rows || rows.length === 0) return;

    const frag = document.createDocumentFragment();
    for (const r of rows) {
      const div = document.createElement("div");
      div.className = "res";

      const linha1 = r.razao || "—";
      const linha2 = [r.fantasia, r.documento ? `Doc: ${r.documento}` : ""].filter(Boolean).join(" • ");

      div.innerHTML = `
        <div class="res__top">
          <div class="res__title">${escapeHtml(linha1)}</div>
          <div class="res__code">#${escapeHtml(String(r.codigo))}</div>
        </div>
        <div class="res__sub">${escapeHtml(linha2 || "—")}</div>
      `;

      div.addEventListener("click", () => openRegulado(r.codigo));
      frag.appendChild(div);
    }
    els.results.appendChild(frag);
  };

  const escapeHtml = (s) =>
    (s ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[c]));

  const showDetail = (show) => {
    if (els.detailPanel) els.detailPanel.hidden = !show;
    if (!show) state.currentReg = null;
  };

  const renderDetail = (reg) => {
    state.currentReg = reg;
    showDetail(true);

    if (els.dTitle) els.dTitle.textContent = reg.razao || reg.fantasia || `Código ${reg.codigo}`;
    if (els.dSub) els.dSub.textContent = reg.fantasia ? `Fantasia: ${reg.fantasia}` : "—";

    if (els.dCodigo) els.dCodigo.textContent = safe(reg.codigo);

    // documento (preferência: cnpj > cpf)
    const doc = reg.cnpj || reg.cpf || "—";
    if (els.dDoc) els.dDoc.textContent = doc;

    // endereço novo (sem CEP; com fone/celular)
    const endParts = [
      reg.endereco?.logradouro ?? "",
      reg.endereco?.complemento ?? "",
      reg.endereco?.fone ? `Fone: ${reg.endereco.fone}` : "",
      reg.endereco?.celular ? `Celular: ${reg.endereco.celular}` : "",
    ].filter(Boolean);
    if (els.dEnd) els.dEnd.textContent = endParts.join(" • ") || "—";

    // bairro novo (só nome)
    if (els.dBairro) els.dBairro.textContent = reg.bairro?.nome || "—";

    // alvará novo
    if (!reg.alvara_ultimo) {
      if (els.dAlvEx) els.dAlvEx.textContent = "—";
      if (els.dAlvVal) els.dAlvVal.textContent = "—";
    } else {
      if (els.dAlvEx) els.dAlvEx.textContent = reg.alvara_ultimo.exercicio ? String(reg.alvara_ultimo.exercicio) : "—";
      if (els.dAlvVal) els.dAlvVal.textContent = reg.alvara_ultimo.dt_validade ? String(reg.alvara_ultimo.dt_validade) : "—";
    }

    // rolagem (útil no iOS)
    if (els.detailPanel && els.detailPanel.scrollIntoView) {
      els.detailPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const openRegulado = async (codigo) => {
    try {
      setStatus(`Carregando regulado ${codigo}...`);
      const pfx = regPrefix(codigo);
      const file = pad5(codigo); // <<< garante 00014.json
      const path = `./data/reg/${pfx}/${file}.json`;
      const reg = await fetchJson(path);
      renderDetail(reg);
      setStatus(`Pronto. (Cód. ${codigo})`);
    } catch (e) {
      console.error(e);
      setStatus(`Falha ao carregar regulado ${codigo}.`);
      alert(`Erro ao carregar regulado ${codigo}.\n\n${e.message}`);
    }
  };

  const openHistorico = async (ndoc) => {
    try {
      const b = hisBucket(ndoc);
      const path = `./data/his/${b}/${ndoc}.json`;
      const h = await fetchJson(path);

      const txt =
        (h && typeof h.decr === "string" && h.decr.trim() !== "") ? h.decr :
        (h && typeof h.descr === "string" && h.descr.trim() !== "") ? h.descr :
        "";

      openModal(
        `Histórico (NDOC ${ndoc})`,
        `Arquivo: his/${b}/${ndoc}.json`,
        txt !== "" ? txt : "(Sem conteúdo no histórico)"
      );
    } catch (e) {
      console.warn("Histórico não disponível:", e);
      openModal(
        `Histórico (NDOC ${ndoc})`,
        "Histórico indisponível",
        "O conteúdo detalhado desta inspeção não está disponível nesta versão pública do sistema.\n\n" +
          "Essas informações são de uso institucional e podem ser liberadas futuramente, conforme autorização."
      );
    }
  };

  const openAtividades = (reg) => {
    try {
      if (!Array.isArray(reg.atividades) || reg.atividades.length === 0) {
        openModal("Atividades (CNAE)", reg.codigo ? `Regulado: ${reg.codigo}` : "", "Nenhuma atividade encontrada.");
        return;
      }

      const lines = reg.atividades.map((a) => {
        const sub = a.subclasse ? `Subclasse: ${a.subclasse}` : "";
        const tipo = a.tipo ? `Tipo: ${a.tipo}` : "";
        const desc = a.atividade ? `Atividade: ${a.atividade}` : "";
        const eq = a.equipe ? `Equipe: ${a.equipe}` : "";
        const comp = a.complexidade ? `Complexidade: ${a.complexidade}` : "";
        return [sub, tipo, desc, eq, comp].filter(Boolean).join(" | ");
      });

      openModal("Atividades (CNAE)", reg.codigo ? `Regulado: ${reg.codigo}` : "", lines.join("\n"));
    } catch (e) {
      console.error(e);
      alert(`Erro ao abrir atividades.\n\n${e.message}`);
    }
  };

  const openInspecoes = (reg) => {
    try {
      if (!Array.isArray(reg.inspecoes) || reg.inspecoes.length === 0) {
        openModal("Inspeções", reg.codigo ? `Regulado: ${reg.codigo}` : "", "Nenhuma inspeção encontrada.");
        return;
      }

      const lines = reg.inspecoes.map((i) => {
        const dt = i.dt_visita ? `Data: ${i.dt_visita}` : "";
        const tipo = i.tipo ? `Tipo: ${i.tipo}` : "";
        const num = i.numer ? `Número: ${i.numer}` : "";
        const prazo = (i.pz_retorno !== null && i.pz_retorno !== undefined) ? `Prazo(dias): ${i.pz_retorno}` : "";
        const nd = Number.isFinite(i.ndoc) ? `NDOC: ${i.ndoc}` : "";
        return [dt, tipo, num, prazo, nd].filter(Boolean).join(" | ");
      });

      openModal(
        "Inspeções",
        reg.codigo ? `Regulado: ${reg.codigo} • Clique no NDOC e eu abro o histórico` : "",
        lines.join("\n")
      );

      // UX simples: se o usuário clicar em uma linha (selecionar NDOC), abre histórico.
      // (Para virar lista com botões, eu monto depois.)
    } catch (e) {
      console.error(e);
      alert(`Erro ao abrir inspeções.\n\n${e.message}`);
    }
  };

  const search = (q) => {
    const nq = norm(q);
    if (!state.indexLoaded) return;

    if (nq.length < 3) {
      renderResults([]);
      setStatus("Digite ao menos 3 caracteres para pesquisar.");
      return;
    }

    const out = [];
    for (const r of state.index) {
      if (r._blob.includes(nq)) out.push(r);
      if (out.length >= 80) break;
    }
    setStatus(`${out.length} resultado(s) (limitado a 80).`);
    renderResults(out);
  };

  const loadIndex = async () => {
    try {
      setStatus("Carregando índice...");
      const data = await fetchJson("./data/index_regulados.json");

      // formato novo: [ [codigo, razao, fantasia, documento], ... ]
      const rows = Array.isArray(data) ? data : [];
      state.index = rows.map((r) => {
        const codigo = r?.[0];
        const razao = r?.[1] || "";
        const fantasia = r?.[2] || "";
        const documento = r?.[3] || "";
        const blob = [codigo, razao, fantasia, documento].filter(Boolean).join(" ");
        return { codigo, razao, fantasia, documento, _blob: norm(blob) };
      });

      state.indexLoaded = true;
      setStatus(`Índice carregado. Total: ${state.index.length}.`);
    } catch (e) {
      console.error(e);
      setStatus("Falha ao carregar índice. Verifique data/index_regulados.json");
      alert(`Erro ao carregar índice.\n\n${e.message}`);
    }
  };

  // eventos
  if (els.q) els.q.addEventListener("input", debounce(() => search(els.q.value), 120));
  if (els.btnClear) els.btnClear.addEventListener("click", () => { els.q.value = ""; renderResults([]); setStatus("Digite para pesquisar."); });

  if (els.btnCloseDetail) els.btnCloseDetail.addEventListener("click", () => showDetail(false));

  if (els.btnAtividades) els.btnAtividades.addEventListener("click", () => {
    if (!state.currentReg) return;
    openAtividades(state.currentReg);
  });

  if (els.btnInspecoes) els.btnInspecoes.addEventListener("click", () => {
    if (!state.currentReg) return;
    openInspecoes(state.currentReg);
  });

  if (els.btnModalClose) els.btnModalClose.addEventListener("click", closeModal);
  if (els.modalBackdrop) els.modalBackdrop.addEventListener("click", closeModal);

  // init
  loadIndex();
})();
