const PHONE = "593987434850";

const state = {
  products: [],
  filtered: [],
  lines: [],
  activeLine: "Todas",
  query: "",
  page: 1,
  perPage: 12,
  selected: null
};

const el = (id) => document.getElementById(id);

const chipsEl = el("chips");
const gridEl = el("grid");
const resultsMetaEl = el("resultsMeta");
const pageInfoEl = el("pageInfo");

const searchInput = el("searchInput");
const clearBtn = el("clearBtn");
const prevBtn = el("prevBtn");
const nextBtn = el("nextBtn");
const perPageSelect = el("perPageSelect");

const modalOverlay = el("modalOverlay");
const modalClose = el("modalClose");
const modalImg = el("modalImg");
const modalTitle = el("modalTitle");
const modalLine = el("modalLine");
const modalDesc = el("modalDesc");
const qtyMinus = el("qtyMinus");
const qtyPlus = el("qtyPlus");
const qtyInput = el("qtyInput");
const waBtn = el("waBtn");

const waHeaderBtn = el("waHeaderBtn");
waHeaderBtn.href = `https://wa.me/${PHONE}`;
waHeaderBtn.textContent = "WhatsApp";

el("year").textContent = new Date().getFullYear();

function normalize(s){
  return (s || "")
    .toString()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function uniqueLines(products){
  const set = new Set(products.map(p => p.line).filter(Boolean));
  return ["Todas", ...Array.from(set).sort((a,b)=>a.localeCompare(b,"es"))];
}

function renderChips(){
  chipsEl.innerHTML = "";
  state.lines.forEach(line => {
    const btn = document.createElement("button");
    btn.className = "chip" + (state.activeLine === line ? " is-active" : "");
    btn.type = "button";
    btn.textContent = line;
    btn.addEventListener("click", () => {
      state.activeLine = line;
      state.page = 1;
      applyFilters();
      renderAll();
    });
    chipsEl.appendChild(btn);
  });
}

function applyFilters(){
  const q = normalize(state.query);
  state.filtered = state.products.filter(p => {
    const inLine = (state.activeLine === "Todas") || (p.line === state.activeLine);
    if(!inLine) return false;
    if(!q) return true;
    const hay = normalize(`${p.name} ${p.line} ${p.shortDescription}`);
    return hay.includes(q);
  });
}

function paginate(list){
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / state.perPage));
  if(state.page > pages) state.page = pages;

  const start = (state.page - 1) * state.perPage;
  const end = start + state.perPage;
  return { slice: list.slice(start, end), total, pages };
}

function cardPlaceholder(text){
  const words = (text || "").split(" ").filter(Boolean);
  const initials = words.slice(0,2).map(w=>w[0]).join("").toUpperCase();
  return initials || "FX";
}

function renderGrid(){
  const { slice, total, pages } = paginate(state.filtered);

  resultsMetaEl.textContent = `${total} producto(s) • Filtro: ${state.activeLine} • Página ${state.page}/${pages}`;
  pageInfoEl.textContent = `Página ${state.page} de ${pages}`;

  prevBtn.disabled = state.page <= 1;
  nextBtn.disabled = state.page >= pages;

  gridEl.innerHTML = "";

  if(slice.length === 0){
    gridEl.innerHTML = `
      <div class="infoCard" style="grid-column:1/-1;">
        <div class="infoCard__title">No hay resultados</div>
        <div class="muted">Prueba con otro filtro o cambia el texto de búsqueda.</div>
      </div>
    `;
    return;
  }

  slice.forEach(p => {
    const card = document.createElement("article");
    card.className = "card";

    const imgWrap = document.createElement("div");
    imgWrap.className = "card__img";

    if(p.image){
      const img = document.createElement("img");
      img.src = p.image;
      img.alt = p.name;
      img.loading = "lazy";
      imgWrap.appendChild(img);
    } else {
      const ph = document.createElement("div");
      ph.className = "placeholder";
      ph.textContent = cardPlaceholder(p.name);
      imgWrap.appendChild(ph);
    }

    const body = document.createElement("div");
    body.className = "card__body";
    body.innerHTML = `
      <div class="badge">${p.line}</div>
      <h3 class="card__title">${p.name}</h3>
      <p class="card__desc">${p.shortDescription || "Bebida funcional para tu rutina diaria."}</p>
      <div class="card__actions">
        <button class="btn btn--ghost" type="button" data-action="open">Ver ficha</button>
        <button class="btn btn--wa" type="button" data-action="wa">Pedir</button>
      </div>
    `;

    card.appendChild(imgWrap);
    card.appendChild(body);

    card.querySelector('[data-action="open"]').addEventListener("click", () => openModal(p));
    card.querySelector('[data-action="wa"]').addEventListener("click", () => openWhatsApp(p, 1));

    // clic en imagen también abre
    imgWrap.addEventListener("click", () => openModal(p));

    gridEl.appendChild(card);
  });
}

function openWhatsApp(product, qty){
  const q = Math.max(1, Number(qty || 1));
  const msg =
    `Hola 👋 Quiero ${q} unidad(es) de ${product.name} (${product.line}). ` +
    `¿Disponibilidad y envío por favor?`;
  const url = `https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank", "noopener");
}

function openModal(product){
  state.selected = product;
  qtyInput.value = 1;

  modalTitle.textContent = product.name;
  modalLine.textContent = product.line;
  modalDesc.textContent = product.shortDescription || "Bebida funcional para tu rutina diaria.";

  modalImg.innerHTML = "";
  if(product.image){
    const img = document.createElement("img");
    img.src = product.image;
    img.alt = product.name;
    modalImg.appendChild(img);
  } else {
    const ph = document.createElement("div");
    ph.className = "placeholder";
    ph.style.fontSize = "34px";
    ph.textContent = cardPlaceholder(product.name);
    modalImg.appendChild(ph);
  }

  modalOverlay.classList.add("is-open");
  modalOverlay.setAttribute("aria-hidden", "false");
}

function closeModal(){
  modalOverlay.classList.remove("is-open");
  modalOverlay.setAttribute("aria-hidden", "true");
  state.selected = null;
}

function renderAll(){
  renderChips();
  renderGrid();
}

async function init(){
  const res = await fetch("products.json", { cache: "no-store" });
  const data = await res.json();

  state.products = data;
  state.lines = uniqueLines(data);

  applyFilters();
  renderAll();
}

searchInput.addEventListener("input", (e) => {
  state.query = e.target.value;
  state.page = 1;
  applyFilters();
  renderGrid();
});

clearBtn.addEventListener("click", () => {
  searchInput.value = "";
  state.query = "";
  state.page = 1;
  applyFilters();
  renderGrid();
});

prevBtn.addEventListener("click", () => {
  state.page = Math.max(1, state.page - 1);
  renderGrid();
});

nextBtn.addEventListener("click", () => {
  const pages = Math.max(1, Math.ceil(state.filtered.length / state.perPage));
  state.page = Math.min(pages, state.page + 1);
  renderGrid();
});

perPageSelect.addEventListener("change", (e) => {
  state.perPage = Number(e.target.value) || 12;
  state.page = 1;
  renderGrid();
});

// Modal events
modalClose.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => {
  if(e.target === modalOverlay) closeModal();
});
document.addEventListener("keydown", (e) => {
  if(e.key === "Escape") closeModal();
});

qtyMinus.addEventListener("click", () => {
  qtyInput.value = Math.max(1, Number(qtyInput.value || 1) - 1);
});
qtyPlus.addEventListener("click", () => {
  qtyInput.value = Math.max(1, Number(qtyInput.value || 1) + 1);
});
qtyInput.addEventListener("input", () => {
  const v = Math.max(1, Number(qtyInput.value || 1));
  qtyInput.value = v;
});
waBtn.addEventListener("click", () => {
  if(!state.selected) return;
  openWhatsApp(state.selected, qtyInput.value);
});

init().catch(err => {
  console.error(err);
  resultsMetaEl.textContent = "Error cargando productos. Revisa products.json";
});