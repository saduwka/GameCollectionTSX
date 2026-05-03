// FILE: src/components/YouTubeSection/YouTubeSection.tsx
import React from "react";
import type { YouTubeVideo } from "../../services/media/youtubeService";
import styles from "./YouTubeSection.module.css";

interface YouTubeSectionProps {
  title: string;
  videos: YouTubeVideo[];
  loading: boolean;
}

const YouTubeSection: React.FC<YouTubeSectionProps> = ({ title, videos, loading }) => {
  if (!loading && videos.length === 0) return null;

  return (
    <div className={styles.section}>
      <h3 className={styles.title}>{title}</h3>
      {loading ? (
        <div className={styles.loader}>Searching YouTube...</div>
      ) : (
        <div className={styles.grid}>
          {videos.map((video) => (
            <a
              key={video.id}
              href={`https://www.youtube.com/watch?v=${video.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.videoCard}
            >
              <div className={styles.thumbnailWrapper}>
                <img src={video.thumbnail} alt={video.title} className={styles.thumbnail} />
                <div className={styles.playIcon}>▶</div>
              </div>
              <div className={styles.info}>
                <h4 className={styles.videoTitle} title={video.title}>
                  {video.title.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'")}
                </h4>
                <p className={styles.channelName}>{video.channelTitle}</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default YouTubeSection;
