// Fixed-rate, fully amortizing estimate. No network requests or persisted inputs.
export function calculateMortgage(values) {
  const limits = { price: [1, 100000000], downPercent: [0, 100], rate: [0, 30], years: [1, 40], taxRate: [0, 20], insurance: [0, 1000000], hoa: [0, 1000000], pmi: [0, 100000] };
  for (const [key, [min, max]] of Object.entries(limits)) {
    if (typeof values[key] !== "number" || !Number.isFinite(values[key]) || values[key] < min || values[key] > max) throw new RangeError(`Invalid ${key}`);
  }
  if (!Number.isInteger(values.years)) throw new RangeError("Invalid years");
  const downPayment = values.price * values.downPercent / 100;
  const principal = Math.max(0, values.price - downPayment);
  const months = values.years * 12;
  const monthlyRate = values.rate / 1200;
  const payment = principal === 0 ? 0 : monthlyRate === 0 ? principal / months : principal * monthlyRate / -Math.expm1(-months * Math.log1p(monthlyRate));
  const tax = values.price * values.taxRate / 1200;
  const insurance = values.insurance / 12;
  const hoa = values.hoa / 12;
  const pmi = principal === 0 ? 0 : values.pmi;
  return { downPayment, principal, payment, tax, insurance, hoa, pmi, total: payment + tax + insurance + hoa + pmi };
}

export function initializeBuyerTools(root) {
  if (!root || root.dataset.buyerReady) return;
  root.dataset.buyerReady = "true";
  const tablist = root.querySelector("[data-buyer-tabs]");
  const tabs = Array.from(root.querySelectorAll("[data-buyer-tab]"));
  const panels = Array.from(root.querySelectorAll("[data-buyer-panel]"));
  function activate(key, focus = false) {
    if (!tabs.some((tab) => tab.dataset.buyerTab === key)) return;
    tabs.forEach((tab) => {
      const active = tab.dataset.buyerTab === key;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && focus) tab.focus();
    });
    panels.forEach((panel) => { panel.hidden = panel.dataset.buyerPanel !== key; });
  }
  tablist.setAttribute("role", "tablist");
  tabs.forEach((tab, index) => {
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", `buyer-panel-${tab.dataset.buyerTab}`);
    tab.addEventListener("click", (event) => { event.preventDefault(); activate(tab.dataset.buyerTab); });
    tab.addEventListener("keydown", (event) => {
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (event.key === " ") next = index;
      if (next !== undefined) { event.preventDefault(); activate(tabs[next].dataset.buyerTab, true); }
    });
  });
  panels.forEach((panel) => { panel.setAttribute("role", "tabpanel"); panel.tabIndex = 0; });
  const fromHash = () => {
    const match = window.location.hash.match(/^#buyer-(?:panel|tab)-(basic|mortgage|areas|schools|resources)$/);
    if (match) activate(match[1]);
  };
  activate("basic");
  fromHash();
  window.addEventListener("hashchange", fromHash);

  const form = root.querySelector("[data-mortgage-form]");
  const result = root.querySelector("[data-mortgage-result]");
  const error = root.querySelector("[data-mortgage-error]");
  const dirty = root.querySelector("[data-mortgage-dirty]");
  const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function update() {
    const values = {};
    for (const field of form.querySelectorAll("input[name],select[name]")) values[field.name] = field.value.trim() === "" ? NaN : Number(field.value);
    try {
      const amounts = calculateMortgage(values);
      result.querySelectorAll("[data-mortgage-output]").forEach((output) => { output.textContent = currency.format(amounts[output.dataset.mortgageOutput]); });
      error.hidden = true;
      dirty.hidden = true;
      result.dataset.stale = "false";
    } catch {
      error.hidden = false;
      dirty.hidden = true;
      result.dataset.stale = "true";
      result.querySelectorAll("[data-mortgage-output]").forEach((output) => { output.textContent = "—"; });
    }
  }
  form.querySelector("[data-mortgage-submit]").disabled = false;
  form.addEventListener("submit", (event) => { event.preventDefault(); update(); });
  form.addEventListener("input", () => { dirty.hidden = false; result.dataset.stale = "true"; });
  form.addEventListener("change", () => { dirty.hidden = false; result.dataset.stale = "true"; });
  form.addEventListener("reset", () => { setTimeout(update, 0); });
  update();
}

if (typeof document !== "undefined") {
  const init = () => initializeBuyerTools(document.querySelector("[data-buyer-tools]"));
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
}
