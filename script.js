// ===== ДАННЫЕ СБОРА =====
const DATA = {
  goal: 500000,                 // цель, tenge
  raised: 0,                   // запасное значение, если таблица не загрузилась
  date: "ДД.ММ.ГГГГ",          // запасная дата
  card: "4400 4303 2191 6733",
  phone: "+7 776 697 42 76",
  owner: "Гүлзана Б. (мама Ислама)"
};
const SHEET_URL = window.SHEET_URL || ""; // задаётся в config.js
// ========================

const fmt = n => n.toLocaleString("ru-RU").replace(/\u00A0/g, " ");
const $ = id => document.getElementById(id);

function render() {
  const pct = Math.min(100, Math.round(DATA.raised / DATA.goal * 100));
  $("goal").textContent = fmt(DATA.goal);
  $("raised").textContent = fmt(DATA.raised);
  $("percent").textContent = pct;
  $("date").textContent = DATA.date;
  $("fill").parentElement.setAttribute("aria-valuenow", pct);
  $("fill").style.width = pct + "%";
}

// Таблица: A1 = raised, B1 = число; A2 = date, B2 = дата текстом
async function loadFromSheet() {
  if (!SHEET_URL) return;
  try {
    const res = await fetch(SHEET_URL);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const rows = (await res.text()).trim().split(/\r?\n/).map(r => r.split(","));
    for (const [key, ...rest] of rows) {
      const val = rest.join(",").replace(/^"|"$/g, "").trim();
      if (key.trim() === "raised") DATA.raised = Number(val.replace(/[^\d.]/g, "")) || 0;
      if (key.trim() === "date") DATA.date = val;
    }
  } catch (e) {
    console.warn("Не удалось загрузить таблицу, показаны запасные значения", e);
  }
  render();
}

document.querySelectorAll(".js-card").forEach(e => e.textContent = DATA.card);
document.querySelectorAll(".js-phone").forEach(e => e.textContent = DATA.phone);
document.querySelectorAll(".js-owner").forEach(e => e.textContent = DATA.owner);
render();
loadFromSheet();

const modal = $("modal");
let amount = 5000;
const money = n => fmt(n) + " ₸";

function setAmount(n) {
  amount = n;
  $("goBtn").textContent = n > 0 ? "Помочь на " + money(n) : "Помочь";
}
function showStep(n) {
  $("step1").hidden = n !== 1;
  $("step2").hidden = n !== 2;
}
function openModal() { showStep(1); modal.hidden = false; }
function closeModal() { modal.hidden = true; }

$("openBtn").onclick = openModal;
$("closeBtn").onclick = closeModal;
modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

document.querySelectorAll(".amt").forEach(b => {
  b.onclick = () => {
    document.querySelectorAll(".amt").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    $("custom").value = "";
    setAmount(Number(b.dataset.amt));
  };
});
$("custom").addEventListener("input", e => {
  const n = Math.min(100000000, Number(e.target.value.replace(/\D/g, "")) || 0);
  e.target.value = n ? fmt(n) : "";
  document.querySelectorAll(".amt").forEach(x => x.classList.remove("active"));
  setAmount(n);
});
$("goBtn").onclick = () => {
  if (amount < 1) { $("custom").focus(); return; }
  $("sumShow").textContent = money(amount);
  showStep(2);
};
$("backBtn").onclick = () => showStep(1);

async function copy(text, btn, label) {
  try { await navigator.clipboard.writeText(text); btn.textContent = "Скопировано ✓"; }
  catch { btn.textContent = "Скопируйте вручную"; }
  setTimeout(() => btn.textContent = label, 2500);
}

function toast(text) {
  const el = $("toast");
  el.textContent = text;
  el.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.hidden = true, 8000);
}

// ----- Открытие Kaspi -----
const KASPI_URL = "https://kaspi.kz/";

// Копирование сразу, в момент нажатия (так надёжнее работает на iPhone)
function copySync(text) {
  let ok = false;
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
  document.body.appendChild(ta);
  ta.select();
  ta.setSelectionRange(0, text.length);
  try { ok = document.execCommand("copy"); } catch {}
  ta.remove();
  if (!ok && navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
  return ok;
}

function openKaspi() {
  window.open(KASPI_URL, "_blank", "noopener,noreferrer");
}

const cardRaw = () => DATA.card.replace(/\s/g, "");
const phoneRaw = () => DATA.phone.replace(/[^\d+]/g, "");

document.querySelectorAll(".ico").forEach(b => {
  b.onclick = async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy === "card" ? cardRaw() : phoneRaw()); } catch {}
    b.classList.add("done");
    setTimeout(() => b.classList.remove("done"), 1500);
  };
});

document.querySelectorAll(".kaspi-btn").forEach(b => {
  const label = b.textContent;
  b.onclick = () => {
    copySync(phoneRaw());
    b.textContent = "Скопировано ✓";
    setTimeout(() => b.textContent = label, 2500);
    toast("Номер телефона скопирован. Вставьте его в Kaspi в разделе «Переводы».");
    openKaspi();
  };
});

document.querySelectorAll(".kaspi-link").forEach(a => {
  a.addEventListener("click", () => copySync(phoneRaw()));
});

document.querySelectorAll(".docs-btn").forEach(b => {
  if (!$("docs")) { b.hidden = true; return; }
  b.onclick = () => { closeModal(); $("docs").scrollIntoView({ behavior: "smooth" }); };
});

const msg = "Исламу 5 лет, ему нужна трансплантация. Помогите, пожалуйста, или поделитесь: " + location.href;
$("wa").href = "https://wa.me/?text=" + encodeURIComponent(msg);
$("copyLink").onclick = e => copy(location.href, e.target, "Скопировать ссылку");
