"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "./AuthContext";

interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  loading: boolean;
  addToWishlist: (productId: string) => Promise<boolean>;
  removeFromWishlist: (productId: string) => Promise<boolean>;
  isInWishlist: (productId: string) => boolean;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined
);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  // جلب المفضلة من قاعدة البيانات
  const fetchWishlist = async () => {
    if (!user) {
      setWishlist([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("wishlist")
        .select("*")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching wishlist:", error);
        return;
      }

      setWishlist(data || []);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    } finally {
      setLoading(false);
    }
  };

  // جلب المفضلة عند تسجيل الدخول
  useEffect(() => {
    fetchWishlist();
  }, [user]);

  // إضافة منتج للمفضلة
  const addToWishlist = async (productId: string): Promise<boolean> => {
    if (!user) {
      alert("يجب تسجيل الدخول أولاً لإضافة المنتجات للمفضلة");
      return false;
    }

    try {
      const { data, error } = await supabase
        .from("wishlist")
        .insert({
          user_id: user.id,
          product_id: productId,
        })
        .select()
        .single();

      if (error) {
        // تحقق من وجود المنتج مسبقاً
        if (error.code === "23505") {
          console.log("المنتج موجود بالفعل في المفضلة");
          return false;
        }
        console.error("Error adding to wishlist:", error);
        return false;
      }

      setWishlist((prev) => [...prev, data]);
      return true;
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      return false;
    }
  };

  // حذف منتج من المفضلة
  const removeFromWishlist = async (productId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("wishlist")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId);

      if (error) {
        console.error("Error removing from wishlist:", error);
        return false;
      }

      setWishlist((prev) =>
        prev.filter((item) => item.product_id !== productId)
      );
      return true;
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      return false;
    }
  };

  // التحقق من وجود المنتج في المفضلة
  const isInWishlist = (productId: string): boolean => {
    return wishlist.some((item) => item.product_id === productId);
  };

  // تحديث المفضلة
  const refreshWishlist = async () => {
    await fetchWishlist();
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        loading,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
