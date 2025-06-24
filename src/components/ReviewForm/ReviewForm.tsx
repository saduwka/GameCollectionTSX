import React, { useState, useEffect } from "react";
import type { Review } from "../../types/review";
import styles from "./ReviewForm.module.css";

interface ReviewFormProps {
  userReview: Review | null;
  onSubmit: (comment: string, rating: number) => void;
  onDelete: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  userReview,
  onSubmit,
  onDelete
}) => {
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(0);

  useEffect(() => {
    if (userReview) {
      setComment(userReview.comment);
      setRating(userReview.rating);
    } else {
      setComment("");
      setRating(0);
    }
  }, [userReview]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || rating < 1 || rating > 5) {
      alert("Please enter a comment and a rating between 1 and 5.");
      return;
    }
    onSubmit(comment.trim(), rating);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.reviewForm}>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Write your review..."
      />
      <input
        type="number"
        min="1"
        max="5"
        value={rating}
        onChange={(e) => setRating(Number(e.target.value))}
        placeholder="Rating (1-5)"
      />
      <div className={styles.reviewFormButtons}>
        <button type="submit">
          {userReview ? "Update Review" : "Submit Review"}
        </button>
        {userReview && (
          <button type="button" onClick={onDelete}>
            Delete Review
          </button>
        )}
      </div>
    </form>
  );
};

export default ReviewForm;
