import React from "react";
import Skeleton from "./Skeleton";

const PlatformCardSkeleton: React.FC = () => {
  return (
    <div
      style={{
        background: "#2a2a2a",
        borderRadius: "12px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        padding: "0 0 12px",
      }}
      aria-busy="true"
    >
      <Skeleton width="100%" height="140px" borderRadius="0" />
      <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: "8px" }}>
        <Skeleton width="70%" height="1.1rem" />
        <Skeleton width="40%" height="0.85rem" />
      </div>
    </div>
  );
};

export default PlatformCardSkeleton;
