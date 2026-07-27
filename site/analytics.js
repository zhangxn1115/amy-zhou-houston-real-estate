(() => {
  "use strict";

  const measurementId = "G-S5TRTZP0X8";
  let loaded = false;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  const loadAnalytics = () => {
    if (loaded) return;
    loaded = true;

    window.gtag("consent", "default", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);
  };

  const interactionEvents = ["pointerdown", "keydown", "touchstart"];
  interactionEvents.forEach((eventName) => {
    window.addEventListener(eventName, loadAnalytics, { once: true, passive: true });
  });

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(loadAnalytics, { timeout: 3500 });
  } else {
    window.setTimeout(loadAnalytics, 2500);
  }
})();
