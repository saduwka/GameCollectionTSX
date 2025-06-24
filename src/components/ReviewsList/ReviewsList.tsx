import React from "react";
import type { Review } from "../../types/review";
import styles from "./ReviewsList.module.css";

interface ReviewsListProps {
  reviews: Review[];
}

const ReviewsList: React.FC<ReviewsListProps> = ({ reviews }) => {
  return (
    <div className={styles.reviewsSection}>
      <h3>Reviews</h3>
      {reviews.length > 0 ? (
        <ul>
          {reviews.map((review) => (
            <li key={review.id}>
              <strong>{review.username}:</strong> {review.comment} (Rating:{" "}
              {review.rating})
            </li>
          ))}
        </ul>
      ) : (
        <p>No reviews yet.</p>
      )}
    </div>
  );
};

export default ReviewsList;
