import React from "react";
import ReactDOM from "react-dom";
import styles from "./ImageModal.module.css";

type Props = {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  animationKey: number;
};

const ImageModal: React.FC<Props> = ({
  images,
  currentIndex,
  onClose,
  onNext,
  onPrev,
  animationKey
}) => {
  const modalContent = (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalNavButton} onClick={onPrev}>
          ←
        </button>
        <img
          key={animationKey}
          src={images[currentIndex]}
          alt="Modal content"
          className={`${styles.modalImage} ${styles.modalImageAnimated}`}
        />
        <button className={styles.modalNavButton} onClick={onNext}>
          →
        </button>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default ImageModal;
