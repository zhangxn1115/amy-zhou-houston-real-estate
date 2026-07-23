(() => {
  const dialog = document.querySelector("#lead-dialog");
  const form = dialog?.querySelector("[data-lead-form]");
  if (!(dialog instanceof HTMLDialogElement) || !(form instanceof HTMLFormElement)) return;

  const startedAt = form.querySelector("[data-lead-started-at]");
  const status = form.querySelector("[data-lead-status]");
  const submitLabel = form.querySelector("[data-lead-submit-label]");
  const success = dialog.querySelector("[data-lead-success]");
  const name = form.querySelector("input[name='name']");
  const message = form.querySelector("textarea[name='message']");
  const characterCount = form.querySelector("[data-lead-character-count]");

  function isChineseCharacter(character) {
    return /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u.test(character);
  }

  function validateNameLength() {
    if (!(name instanceof HTMLInputElement)) return;
    const length = Array.from(name.value).reduce(
      (total, character) => total + (isChineseCharacter(character) ? 2 : 1),
      0,
    );
    name.setCustomValidity(length > 10 ? "姓名最多填写5个汉字或10个英文字符。" : "");
  }

  function markStarted() {
    if (startedAt instanceof HTMLInputElement) startedAt.value = String(Date.now());
  }

  function openDialog() {
    if (!dialog.open) {
      markStarted();
      dialog.showModal();
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
  if (message instanceof HTMLTextAreaElement && characterCount) {
    message.addEventListener("input", () => {
      characterCount.textContent = String(message.value.length);
    });
  }
  if (name instanceof HTMLInputElement) {
    name.addEventListener("input", validateNameLength);
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    validateNameLength();
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
