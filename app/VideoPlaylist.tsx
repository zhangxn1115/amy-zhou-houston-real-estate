// YouTube's channel uploads playlist is maintained by YouTube, not by this site.
// Keep this tied to Amy's channel so new public uploads appear without a deploy.
export const uploadsPlaylistId = "UU1ymf6PCQwnLL8-ETiPteHw";

export function VideoPlaylist() {
  const playlistUrl = `https://www.youtube.com/playlist?list=${uploadsPlaylistId}`;
  return (
    <section className="videos section" id="videos">
      <div className="section-label">02 / 视频解读</div>
      <div className="video-intro">
        <div>
          <p className="kicker">HOUSTON IN FOCUS</p>
          <h2>用更直观的方式，<span>了解休斯顿。</span></h2>
        </div>
        <p>跟着 Amy 实地看房，了解休斯顿的社区、户型与置业生活。这里与 YouTube 频道同步，持续呈现最新发布的公开影片。</p>
      </div>
      <div className="video-playlist" data-video-playlist={uploadsPlaylistId}>
        <div className="video-playlist-frame">
          <iframe
            data-video-src={`https://www.youtube.com/embed/videoseries?list=${uploadsPlaylistId}&listType=playlist&rel=0&hl=zh-CN&playsinline=1`}
            title="Amy Zhou 休斯顿实地看房 · 最新视频播放列表"
            width="1120"
            height="630"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
        <div className="video-playlist-footer">
          <p>点击播放器右上角的列表图标，选择更多视频。</p>
          <a href={playlistUrl} target="_blank" rel="noopener noreferrer">在 YouTube 查看播放列表 <span aria-hidden="true">↗</span></a>
        </div>
        <p className="video-playlist-note">视频由 YouTube 提供，需在可访问 YouTube 的网络环境下观看。</p>
      </div>
    </section>
  );
}
