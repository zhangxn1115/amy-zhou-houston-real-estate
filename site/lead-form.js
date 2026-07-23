(() => {
  const dialog = document.querySelector("#lead-dialog");
  const form = dialog?.querySelector("[data-lead-form]");
  if (!(dialog instanceof HTMLDialogElement) || !(form instanceof HTMLFormElement)) return;

  const storageKey = "amy-lead-dialog-seen";
  const submittedKey = "amy-lead-submitted";
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const startedAt = form.querySelector("[data-lead-started-at]");
  const status = form.querySelector("[data-lead-status]");
  const submitLabel = form.querySelector("[data-lead-submit-label]");
  const success = dialog.querySelector("[data-lead-success]");

  function markStarted() {
    if (startedAt instanceof HTMLInputElement) startedAt.value = String(Date.now());
  }

  function openDialog() {
    if (!dialog.open) {
      markStarted();
      dialog.showModal();
      window.localStorage.setItem(storageKey, String(Date.now()));
      window.setTimeout(() => form.querySelector("input[name='name']")?.focus(), 80);
    }
  }

  function closeDialog() {
    if (dialog.open) dialog.close();
  }

  document.querySelectorAll("[data-lead-open]").forEach((button) => {
    button.addEventListener("click", openDialog);
  });
  dialog.querySelectorAll("[data-lead-close]").forEach((button) => {
    button.addEventListener("click", closeDialog);
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog();
  });

  const lastSeen = Number(window.localStorage.getItem(storageKey) || 0);
  const alreadySubmitted = window.localStorage.getItem(submittedKey) === "true";
  if (!alreadySubmitted && (!lastSeen || Date.now() - lastSeen > sevenDays)) {
    const delay = window.matchMedia("(max-width: 700px)").matches ? 18000 : 12000;
    window.setTimeout(openDialog, delay);
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const submit = form.querySelector("button[type='submit']");
    if (submit instanceof HTMLButtonElement) submit.disabled = true;
    if (submitLabel) submitLabel.textContent = "正在提交…";
    if (status) status.textContent = "";

    const fields = new FormData(form);
    const payload = Object.fromEntries(fields.entries());
    payload.consent = fields.get("consent") === "on";

    try {
      const response = await fetch(form.action, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "提交暂时没有成功，请稍后再试。");

      window.localStorage.setItem(submittedKey, "true");
      form.hidden = true;
      if (success instanceof HTMLElement) success.hidden = false;
      form.reset();
    } catch (error) {
      if (status) {
        status.textContent = error instanceof Error
          ? error.message
          : "提交暂时没有成功，请稍后再试。";
      }
    } finally {
      if (submit instanceof HTMLButtonElement) submit.disabled = false;
      if (submitLabel) submitLabel.textContent = "提交置业需求";
    }
  });
})();
