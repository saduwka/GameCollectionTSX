import React from "react";
import styles from "./ImageModal.module.css";

interface ImageModalProps {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  animationKey: number;
}

const ImageModal: React.FC<ImageModalProps> = ({
  images,
  currentIndex,
  onClose,
  onPrev,
  onNext,
  animationKey
}) => {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalNavButton} onClick={onPrev}>
          ‹
        </button>
        <img
          key={animationKey}
          src={images[currentIndex]}
          alt="Game Fullscreen"
          className={`${styles.modalImage} ${styles.modalImageAnimated}`}
        />
        <button className={styles.modalNavButton} onClick={onNext}>
          ›
        </button>
      </div>
    </div>
  );
};

export default ImageModal;
