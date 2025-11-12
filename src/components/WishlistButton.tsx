"use client";

import { useState } from "react";
import { useWishlist } from "../contexts/WishlistContext";

interface WishlistButtonProps {
  productId: string;
  variant?: "icon" | "button";
  className?: string;
}

export default function WishlistButton({
  productId,
  variant = "icon",
  className = "",
}: WishlistButtonProps) {
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const [loading, setLoading] = useState(false);
  const inWishlist = isInWishlist(productId);

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setLoading(true);
    try {
      if (inWishlist) {
        await removeFromWishlist(productId);
      } else {
        const success = await addToWishlist(productId);
        if (!success && variant === "button") {
          // لا تظهر شيء لأن addToWishlist يظهر alert
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (variant === "icon") {
    return (
      <button
        onClick={handleToggleWishlist}
        disabled={loading}
        className={`p-2 rounded-full transition-all ${
          inWishlist
            ? "bg-[#e60000] text-white"
            : "bg-white/80 dark:bg-[#2d1616]/80 text-[#666666] dark:text-[#aaaaaa] hover:bg-white dark:hover:bg-[#2d1616]"
        } backdrop-blur-sm shadow-md hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        title={inWishlist ? "إزالة من المفضلة" : "إضافة للمفضلة"}
      >
        <svg
          className="w-5 h-5"
          fill={inWishlist ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={handleToggleWishlist}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
        inWishlist
          ? "bg-[#e60000] text-white hover:opacity-90"
          : "bg-white dark:bg-[#2d1616] border border-[#e5e7eb] dark:border-[#4a4a4a] hover:bg-[#f5f5f5] dark:hover:bg-[#281313]"
      } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <svg
        className="w-5 h-5"
        fill={inWishlist ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      <span>{inWishlist ? "في المفضلة" : "أضف للمفضلة"}</span>
    </button>
  );
}
