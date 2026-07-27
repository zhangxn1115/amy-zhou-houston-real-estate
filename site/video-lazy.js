(() => {
  "use strict";

  const videos = Array.from(document.querySelectorAll("iframe[data-video-src]"));
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
