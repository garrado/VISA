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

    dAlvNum: $("dAlvNum"),
    dAlvEmi: $("dAlvEmi"),
    dAlvVal: $("dAlvVal"),

    btnAtividades: $("btnAtividades"),
    btnInspecoes: $("btnInspecoes"),

    // modal (histórico/descrição)
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
    lastQuery: "",
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

  const debounce = (fn, ms = 150) => {
    let t = null;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };

  const fetchJson = async (path) => {
    // anti-cache leve (Safari/iOS costuma segurar)
    const url = `${path}?v=${Date.now()}`;
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status} em ${path}`);
    return await r.json();
  };

  const normalizeIndexToObjects = (data) => {
    // Aceita 2 formatos:
    // (novo)  [ [codigo, razao, fantasia, documento], ... ]
    // (antigo) { dados: [ {codigo, razao, fantasia, cnpj, cpf, logradouro, bairro_codigo, ...} ] }

    // Novo (array puro)
    if (Array.isArray(data)) {
      return data.map((r) => {
        const codigo = r?.[0];
        const razao = r?.[1] || "";
        const fantasia = r?.[2] || "";
        const documento = r?.[3] || "";

        const blob = [codigo, razao, fantasia, documento].filter(Boolean).join(" ");
        return { codigo, razao, fantasia, documento, _blob: norm(blob) };
      });
    }

    // Antigo (objeto com .dados)
    if (Array.isArray(data?.dados)) {
      return data.dados.map((r) => {
        const blob = [
          r.codigo,
          r.razao,
          r.fantasia,
          r.cnpj,
          r.cpf,
          r.logradouro,
          r.bairro_codigo,
        ]
          .filter(Boolean)
          .join(" ");
        return { ...r, _blob: norm(blob) };
      });
    }

    return [];
  };

  const loadIndex = async () => {
    try {
      setStatus("Carregando índice...");
      const data = await fetchJson("./data/index_regulados.json");

      const rows = normalizeIndexToObjects(data);
      state.index = rows;
      state.indexLoaded = true;

      setStatus(`Índice carregado. Regulados ativos: ${state.index.length}.`);
    } catch (e) {
      console.error(e);
      state.indexLoaded = false;
      state.index = [];
      setStatus("Falha ao carregar índice. Verifique caminho/formato do JSON.");
      alert(`Falha ao carregar índice.\n\n${e.message}`);
    }
  };

  const showDetail = (show) => {
    if (!els.detailPanel) return;
    els.detailPanel.hidden = !show;
  };

  const closeModal = () => {
    if (!els.modal) return;
    els.modal.hidden = true;
  };

  const regPrefix = (codigo) => String(codigo).padStart(5, "0").slice(0, 2);
  const hisBucket = (ndoc) => String(ndoc % 100).padStart(2, "0");

  const renderResults = (arr) => {
    if (!els.results) return;

    els.results.innerHTML = "";
    if (!arr || arr.length === 0) {
      els.results.innerHTML = `<div class="empty">Nenhum regulado encontrado.</div>`;
      return;
    }

    const frag = document.createDocumentFragment();

    // Limite de render para não travar iOS
    const MAX = 200;
    const list = arr.slice(0, MAX);

    list.forEach((r) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "resultCard";

      const title = document.createElement("div");
      title.className = "resultTitle";
      title.textContent = r.razao || r.fantasia || `Código ${r.codigo}`;

      const sub = [
        r.fantasia ? `Fantasia: ${r.fantasia}` : "",
        // novo índice: documento
        r.documento ? `Documento: ${r.documento}` : "",
        // antigo índice: cnpj/cpf (se existir)
        !r.documento && r.cnpj ? `CNPJ: ${r.cnpj}` : "",
        !r.documento && !r.cnpj && r.cpf ? `CPF: ${r.cpf}` : "",
      ]
        .filter(Boolean)
        .join(" • ");

      const subtitle = document.createElement("div");
      subtitle.className = "resultSub";
      subtitle.textContent = sub || "—";

      card.appendChild(title);
      card.appendChild(subtitle);

      card.addEventListener("click", () => openRegulado(r.codigo));
      frag.appendChild(card);
    });

    if (arr.length > MAX) {
      const more = document.createElement("div");
      more.className = "hint";
      more.textContent = `Mostrando ${MAX} de ${arr.length}. Refine a busca para reduzir.`;
      frag.appendChild(more);
    }

    els.results.appendChild(frag);
  };

  const search = (rawQuery) => {
    if (!state.indexLoaded) return;

    const q = norm(rawQuery);
    state.lastQuery = q;

    if (!q || q.length < 2) {
      setStatus(`Índice carregado. Digite ao menos 2 caracteres.`);
      renderResults([]);
      return;
    }

    // filtro simples por "blob"
    const hits = state.index.filter((r) => r._blob.includes(q));
    setStatus(`Resultados: ${hits.length}`);
    renderResults(hits);
  };

  const renderDetail = (reg) => {
    state.currentReg = reg;
    showDetail(true);

    els.dTitle.textContent = reg.razao || reg.fantasia || `Código ${reg.codigo}`;
    els.dSub.textContent = reg.fantasia ? `Fantasia: ${reg.fantasia}` : "—";

    els.dCodigo.textContent = safe(reg.codigo);

    const doc = reg.documento || reg.cnpj || reg.cpf || "—";
    els.dDoc.textContent = doc;

    const end = [
      reg.endereco?.logradouro ?? "",
      reg.endereco?.complemento ?? "",
      reg.endereco?.cep ? `CEP: ${reg.endereco.cep}` : "",
    ]
      .filter(Boolean)
      .join(" • ");
    els.dEnd.textContent = end || "—";

    const bairro = reg.bairro?.nome
      ? `${reg.bairro.nome} (cód. ${reg.bairro.codigo})`
      : reg.bairro?.codigo
      ? `Cód. ${reg.bairro.codigo}`
      : "—";
    els.dBairro.textContent = bairro;

    // alvará último válido (pode ser null)
    if (!reg.alvara_ultimo) {
      els.dAlvNum.textContent = "—";
      els.dAlvEmi.textContent = "—";
      els.dAlvVal.textContent = "—";
    } else {
      els.dAlvNum.textContent = safe(reg.alvara_ultimo.numero) || "—";
      els.dAlvEmi.textContent = reg.alvara_ultimo.dt_emite || "—";
      els.dAlvVal.textContent = reg.alvara_ultimo.dt_validade || "—";
    }

    // Botões (atividades/inspeções) — usam o JSON carregado do regulado
    if (els.btnAtividades) {
      els.btnAtividades.onclick = () => openAtividades(reg);
    }
    if (els.btnInspecoes) {
      els.btnInspecoes.onclick = () => openInspecoes(reg);
    }
  };

  const openRegulado = async (codigo) => {
    try {
      setStatus(`Carregando regulado ${codigo}...`);
      const pfx = regPrefix(codigo);

      // Ajuste aqui se sua pasta reg não estiver dentro de /data/
      const path = `./data/reg/${pfx}/${codigo}.json`;

      const reg = await fetchJson(path);

      // opcional: injeta documento no detalhe se seu JSON do regulado não tiver
      if (!reg.documento) {
        const idx = state.index.find((x) => x.codigo === codigo);
        if (idx?.documento) reg.documento = idx.documento;
      }

      setStatus(`Regulado ${codigo} carregado.`);
      renderDetail(reg);
    } catch (e) {
      console.error(e);
      setStatus(`Falha ao carregar regulado ${codigo}. Verifique data/reg/...`);
      alert(`Erro ao carregar regulado ${codigo}.\n\n${e.message}`);
    }
  };

  const openAtividades = (reg) => {
    // Usa o modal simples (mesmo usado pelo histórico)
    try {
      els.modal.hidden = false;
      els.mTitle.textContent = "Atividades (CNAE)";
      els.mSub.textContent = reg.codigo ? `Regulado: ${reg.codigo}` : "";
      if (!Array.isArray(reg.atividades) || reg.atividades.length === 0) {
        els.mBody.textContent = "Nenhuma atividade encontrada.";
        return;
      }

      const lines = reg.atividades.map((a) => {
        const sub = a.subclasse ? `Subclasse: ${a.subclasse}` : "";
        const ps = a.principal_secundaria || a.tipo || "";
        const desc = a.atividade || "";
        const equipe = a.equipe ? `Equipe: ${a.equipe}` : "";
        const comp = a.complexidade ? `Complexidade: ${a.complexidade}` : "";
        return [sub, ps ? `Tipo: ${ps}` : "", desc ? `Desc.: ${desc}` : "", equipe, comp]
          .filter(Boolean)
          .join(" | ");
      });

      els.mBody.textContent = lines.join("\n");
    } catch (e) {
      console.error(e);
      alert(`Erro ao abrir atividades.\n\n${e.message}`);
    }
  };

  const openInspecoes = (reg) => {
    try {
      els.modal.hidden = false;
      els.mTitle.textContent = "Inspeções";
      els.mSub.textContent = reg.codigo ? `Regulado: ${reg.codigo}` : "";

      if (!Array.isArray(reg.inspecoes) || reg.inspecoes.length === 0) {
        els.mBody.textContent = "Nenhuma inspeção encontrada.";
        return;
      }

      // Render em texto simples + orientação para clicar pelo NDOC (se você quiser virar lista clicável, eu monto)
      const lines = reg.inspecoes.map((i) => {
        const dt = i.dt_visita ? `Data: ${i.dt_visita}` : "";
        const tipo = i.documento_emitido ? `Doc: ${i.documento_emitido}` : "";
        const num = i.numero_documento ? `Nº: ${i.numero_documento}` : "";
        const prazo = i.prazo_retorno ? `Prazo: ${i.prazo_retorno}` : (i.prazo ? `Prazo: ${i.prazo}` : "");
        const nd = Number.isFinite(i.ndoc) ? `NDOC: ${i.ndoc}` : "";
        return [dt, tipo, num, prazo, nd].filter(Boolean).join(" | ");
      });

      els.mBody.textContent = lines.join("\n");

      // Se existir NDOC, permite abrir histórico digitando/colando NDOC via clique simples:
      // (melhor UX: lista com botões; se você quiser, eu refaço esse modal em HTML com botões)
      // Aqui, deixo um "atalho": primeiro NDOC abre ao pressionar Enter no campo de busca, etc. (opcional)
    } catch (e) {
      console.error(e);
      alert(`Erro ao abrir inspeções.\n\n${e.message}`);
    }
  };

  const openHistorico = async (ndoc) => {
    try {
      els.modal.hidden = false;
      els.mTitle.textContent = `Histórico (NDOC ${ndoc})`;
      els.mSub.textContent = "Carregando...";
      els.mBody.textContent = "Carregando...";

      const bucket = hisBucket(ndoc);

      // Ajuste aqui se sua pasta his não estiver dentro de /data/
      const path = `./data/his/${bucket}/${ndoc}.json`;

      const h = await fetchJson(path);

      els.mSub.textContent = `Arquivo: his/${bucket}/${ndoc}.json`;

      const txt = (h && typeof h.decr === "string" && h.decr.trim() !== "")
        ? h.decr
        : (h && typeof h.descr === "string" && h.descr.trim() !== "")
          ? h.descr
          : "";

      els.mBody.textContent = txt !== ""
        ? txt
        : "(Sem conteúdo no histórico / campo vazio)";

    } catch (e) {
      console.warn("Histórico não disponível:", e);

      els.mSub.textContent = "Histórico indisponível";
      els.mBody.textContent =
        "O conteúdo detalhado desta inspeção não está disponível nesta versão pública do sistema.\n\n" +
        "Essas informações são de uso institucional e podem ser liberadas futuramente, conforme autorização.";
    }
  };

  // Eventos
  if (els.q) {
    els.q.addEventListener(
      "input",
      debounce(() => search(els.q.value), 120)
    );
  }

  if (els.btnClear) {
    els.btnClear.addEventListener("click", () => {
      els.q.value = "";
      renderResults([]);
      setStatus(state.indexLoaded ? "Digite para pesquisar." : "Carregando índice...");
      els.q.focus();
    });
  }

  if (els.btnCloseDetail) {
    els.btnCloseDetail.addEventListener("click", () => showDetail(false));
  }

  if (els.btnModalClose) {
    els.btnModalClose.addEventListener("click", closeModal);
  }

  if (els.modalBackdrop) {
    els.modalBackdrop.addEventListener("click", closeModal);
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && els.modal && !els.modal.hidden) closeModal();
  });

  // Inicialização
  loadIndex();
})();
