(() => {
  "use strict";

  const videos = Array.from(document.querySelectorAll("iframe[data-video-src]"));
  const playButtons = Array.from(document.querySelectorAll("[data-video-play][data-video-src]"));

  playButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const frame = button.closest(".video-card-frame");
      if (!frame) return;
      const iframe = document.createElement("iframe");
      iframe.src = button.dataset.videoSrc;
      iframe.title = button.dataset.videoTitle || "Amy Zhou 休斯顿房产视频";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-presentation allow-popups");
      iframe.setAttribute("allowfullscreen", "");
      frame.replaceChildren(iframe);
    }, { once: true });
  });

  if (!videos.length) return;

  const loadVideo = (video) => {
    if (!video.src) video.src = video.dataset.videoSrc;
  };

  if (!("IntersectionObserver" in window)) {
    videos.forEach(loadVideo);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      loadVideo(entry.target);
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "300px 0px" });

  videos.forEach((video) => observer.observe(video));
})();
