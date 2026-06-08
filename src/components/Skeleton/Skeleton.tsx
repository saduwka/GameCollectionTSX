import React from "react";
import styles from "./Skeleton.module.scss";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ width, height, borderRadius, className }) => {
  return (
    <div
      className={`${styles.skeleton} ${className || ""}`}
      style={{
        width,
        height,
        borderRadius,
      }}
    />
  );
};

export default Skeleton;
