(() => {
  "use strict";

  const byId = (id) => document.getElementById(id);

  const pad5 = (n) => String(n ?? "").padStart(5, "0");
  const regPrefix = (codigo) => pad5(codigo).slice(0, 2);
  const hisBucket = (ndoc) => String((Number(ndoc) || 0) % 100).padStart(2, "0");

  function safeText(el, v) {
    if (!el) return;
    el.textContent = (v === null || v === undefined || v === "") ? "—" : String(v);
  }

  function onlyDigits(s) {
    return String(s || "").replace(/\D+/g, "");
  }

  function normalize(s) {
    return String(s || "").toLowerCase().trim();
  }

  async function fetchJson(url) {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      throw new Error(`HTTP ${r.status} em ${url}${txt ? `\n${txt.slice(0, 200)}` : ""}`);
    }
    return r.json();
  }

  const els = {
    q: byId("q"),
    btnClear: byId("btnClear"),
    status: byId("status"),
    results: byId("results"),

    detailPanel: byId("detailPanel"),
    btnCloseDetail: byId("btnCloseDetail"),

    dTitle: byId("dTitle"),
    dSub: byId("dSub"),
    dCodigo: byId("dCodigo"),
    dDoc: byId("dDoc"),
    dEnd: byId("dEnd"),
    dBairro: byId("dBairro"),
    dAlvEx: byId("dAlvEx"),
    dAlvVal: byId("dAlvVal"),

    btnAtividades: byId("btnAtividades"),
    btnInspecoes: byId("btnInspecoes"),
    atividadesList: byId("atividadesList"),
    inspecoesList: byId("inspecoesList"),

    modalBackdrop: byId("modalBackdrop"),
    modal: byId("modal"),
    modalTitle: byId("modalTitle"),
    modalMemo: byId("modalMemo"),
    btnCloseModal: byId("btnCloseModal"),
  };

  let indexItems = [];

  function showStatus(msg) {
    safeText(els.status, msg || "");
  }

  function hideDetail() {
    if (els.detailPanel) els.detailPanel.hidden = true;
  }

  function showDetail() {
    if (els.detailPanel) els.detailPanel.hidden = false;
  }

  function closeModal() {
    if (els.modalBackdrop) els.modalBackdrop.hidden = true;
    if (els.modal) els.modal.hidden = true;
    safeText(els.modalTitle, "");
    safeText(els.modalMemo, "");
  }

  function openModal(title, memo) {
    safeText(els.modalTitle, title || "Histórico");
    safeText(els.modalMemo, memo || "");
    if (els.modalBackdrop) els.modalBackdrop.hidden = false;
    if (els.modal) els.modal.hidden = false;
  }

  function renderResults(list) {
    if (!els.results) return;
    els.results.innerHTML = "";

    if (!list || list.length === 0) {
      const div = document.createElement("div");
      div.className = "small";
      div.textContent = "Nenhum regulado encontrado.";
      els.results.appendChild(div);
      return;
    }

    const frag = document.createDocumentFragment();
    for (const it of list.slice(0, 80)) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "result";
      btn.dataset.codigo = String(it.codigo);

      const top = document.createElement("div");
      top.className = "result__top";

      const left = document.createElement("div");

      const title = document.createElement("div");
      title.className = "result__title";
      title.textContent = it.razao || "—";

      const sub = document.createElement("div");
      sub.className = "result__sub";
      const fant = it.fantasia ? `Fantasia: ${it.fantasia}` : "Fantasia: —";
      const doc = it.documento ? `Documento: ${it.documento}` : "Documento: —";
      sub.textContent = `${fant} · ${doc}`;

      left.appendChild(title);
      left.appendChild(sub);

      const tag = document.createElement("div");
      tag.className = "tag";
      tag.textContent = `#${it.codigo}`;

      top.appendChild(left);
      top.appendChild(tag);
      btn.appendChild(top);

      btn.addEventListener("click", () => loadRegulado(it.codigo));
      frag.appendChild(btn);
    }

    els.results.appendChild(frag);
  }

  function renderDetail(reg) {
    safeText(els.dTitle, reg.razao || "—");
    safeText(els.dSub, reg.fantasia || "—");
    safeText(els.dCodigo, reg.codigo);

    const doc = reg.cnpj || reg.cpf || "—";
    safeText(els.dDoc, doc);

    const e = reg.endereco || {};
    const endParts = [];
    if (e.logradouro) endParts.push(e.logradouro);
    if (e.complemento) endParts.push(e.complemento);

    const fones = [];
    if (e.fone) fones.push(`Fone: ${e.fone}`);
    if (e.celular) fones.push(`Celular: ${e.celular}`);

    const endTxt = [
      endParts.length ? endParts.join(" · ") : "—",
      fones.length ? fones.join(" · ") : ""
    ].filter(Boolean).join(" · ");

    safeText(els.dEnd, endTxt || "—");

    const b = reg.bairro || {};
    safeText(els.dBairro, b.nome || "—");

    const alv = reg.alvara_ultimo;
    if (alv && typeof alv === "object") {
      safeText(els.dAlvEx, alv.exercicio ?? "—");
      safeText(els.dAlvVal, alv.dt_validade ?? "—");
    } else {
      safeText(els.dAlvEx, "—");
      safeText(els.dAlvVal, "—");
    }

    // Atividades
    const atvs = Array.isArray(reg.atividades) ? reg.atividades : [];
    if (els.atividadesList) {
      els.atividadesList.innerHTML = "";
      if (atvs.length === 0) {
        const div = document.createElement("div");
        div.className = "small";
        div.textContent = "Nenhuma atividade encontrada.";
        els.atividadesList.appendChild(div);
      } else {
        for (const a of atvs) {
          const item = document.createElement("div");
          item.className = "item";

          const top = document.createElement("div");
          top.className = "item__top";

          const t = document.createElement("div");
          t.className = "item__title";
          t.textContent = a.subclasse ? `${a.subclasse}` : "—";

          const badge = document.createElement("div");
          badge.className = "tag";
          badge.textContent = a.tipo || "—";

          top.appendChild(t);
          top.appendChild(badge);

          const sub = document.createElement("div");
          sub.className = "item__sub";
          const linha = [
            a.atividade ? a.atividade : null,
            a.equipe ? `Equipe: ${a.equipe}` : null,
            a.complexidade ? `Complexidade: ${a.complexidade}` : null
          ].filter(Boolean).join(" · ");
          sub.textContent = linha || "—";

          item.appendChild(top);
          item.appendChild(sub);
          els.atividadesList.appendChild(item);
        }
      }
    }

    // Inspeções
    const insps = Array.isArray(reg.inspecoes) ? reg.inspecoes : [];
    if (els.inspecoesList) {
      els.inspecoesList.innerHTML = "";
      if (insps.length === 0) {
        const div = document.createElement("div");
        div.className = "small";
        div.textContent = "Nenhuma inspeção encontrada.";
        els.inspecoesList.appendChild(div);
      } else {
        for (const v of insps) {
          const item = document.createElement("div");
          item.className = "item";

          const top = document.createElement("div");
          top.className = "item__top";

          const title = document.createElement("div");
          title.className = "item__title";
          const dt = v.dt_visita || "—";
          const tipo = v.tipo || "—";
          const num = v.numer || "—";
          title.textContent = `${tipo} ${num} · ${dt}`;

          const badge = document.createElement("div");
          badge.className = "tag";
          badge.textContent = (v.pz_retorno !== undefined && v.pz_retorno !== null)
            ? `Prazo: ${v.pz_retorno} dia(s)`
            : "Prazo: —";

          top.appendChild(title);
          top.appendChild(badge);

          const sub = document.createElement("div");
          sub.className = "item__sub";

          const ndoc = Number(v.ndoc || 0);
          if (ndoc > 0) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "btn";
            btn.style.padding = "8px 10px";
            btn.textContent = "📄 Abrir documento";

            btn.addEventListener("click", async (ev) => {
              ev.preventDefault();
              ev.stopPropagation();
              try {
                await openHistorico(ndoc);
              } catch (e) {
                openModal("Erro ao abrir histórico", String(e.message || e));
              }
            });

            sub.textContent = "Histórico: ";
            sub.appendChild(btn);
          } else {
            sub.textContent = "Histórico: —";
          }

          item.appendChild(top);
          item.appendChild(sub);
          els.inspecoesList.appendChild(item);
        }
      }
    }
  }

  async function loadRegulado(codigo) {
    const c = Number(codigo);
    const file = pad5(c);
    const path = `./data/reg/${regPrefix(c)}/${file}.json`;

    showStatus(`Carregando regulado #${c}...`);
    hideDetail();

    const reg = await fetchJson(path);
    renderDetail(reg);
    showDetail();
    showStatus(`Regulado ${c} carregado.`);

    els.detailPanel?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }

  async function openHistorico(ndoc) {
    const b = hisBucket(ndoc);
    const path = `./data/his/${b}/${ndoc}.json`;
    const h = await fetchJson(path);
    openModal(`Histórico NDOC ${ndoc}`, (h && (h.decr || h.descr)) ? (h.decr || h.descr) : "—");
  }

  function applyFilter() {
    const q = normalize(els.q?.value || "");
    if (!q) {
      renderResults(indexItems.slice(0, 80));
      showStatus(`Pronto. (${indexItems.length} no índice)`);
      return;
    }

    const qDigits = onlyDigits(q);
    const out = [];
    for (const it of indexItems) {
      const hay = `${it.razao || ""} ${it.fantasia || ""} ${it.documento || ""} ${it.codigo || ""}`.toLowerCase();
      if (hay.includes(q)) out.push(it);
      else if (qDigits && onlyDigits(it.documento || "").includes(qDigits)) out.push(it);
      else if (qDigits && String(it.codigo || "").includes(qDigits)) out.push(it);
      if (out.length >= 80) break;
    }

    renderResults(out);
    showStatus(`${out.length} encontrado(s).`);
  }

  async function init() {
    closeModal();
    hideDetail();
    showStatus("Carregando índice...");

    const url = `./data/index_regulados.json?v=${Date.now()}`;
    const root = await fetchJson(url);

    indexItems = Array.isArray(root?.dados) ? root.dados : (Array.isArray(root) ? root : []);
    showStatus(`Índice carregado (${indexItems.length}).`);

    renderResults(indexItems.slice(0, 80));

    els.q?.addEventListener("input", applyFilter);

    els.btnClear?.addEventListener("click", () => {
      if (els.q) els.q.value = "";
      closeModal();
      hideDetail();
      applyFilter();
      els.q?.focus?.();
    });

    els.btnCloseDetail?.addEventListener("click", hideDetail);

    els.btnCloseModal?.addEventListener("click", closeModal);
    els.modalBackdrop?.addEventListener("click", closeModal);

    els.btnAtividades?.addEventListener("click", () => {
      els.atividadesList?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    });
    els.btnInspecoes?.addEventListener("click", () => {
      els.inspecoesList?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    });
  }

  window.addEventListener("DOMContentLoaded", init);
})();
