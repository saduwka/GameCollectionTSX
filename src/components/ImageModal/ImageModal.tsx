import React, { useEffect, useState } from "react";
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
  const [touchStart, setTouchStart] = useState<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onNext, onPrev]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      onNext();
    } else if (isRightSwipe) {
      onPrev();
    }
    
    setTouchStart(null);
  };

  const modalContent = (
    <div 
      className={styles.modalOverlay} 
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button className={styles.closeButton} onClick={onClose}>
        &times;
      </button>
      
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={`${styles.modalNavButton} ${styles.prevButton}`} onClick={onPrev}>
          ←
        </button>
        
        <img
          key={animationKey}
          src={images[currentIndex]}
          alt="Modal content"
          className={`${styles.modalImage} ${styles.modalImageAnimated}`}
        />
        
        <button className={`${styles.modalNavButton} ${styles.nextButton}`} onClick={onNext}>
          →
        </button>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default ImageModal;
