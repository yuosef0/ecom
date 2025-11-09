// src/contexts/CartContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
interface CartItem {
  id: string;
  cartItemId: string; // معرف فريد للعنصر في السلة (product_id + size + color)
  title: string;
  price: number;
  image_url: string | null;
  quantity: number;
  stock: number;
  size?: string;
  color?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Omit<CartItem, "cartItemId"> & { quantity?: number }) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  // تحميل السلة من localStorage عند البداية
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // حفظ السلة في localStorage عند التغيير
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Omit<CartItem, "cartItemId"> & { quantity?: number }) => {
    setCart((prev) => {
      // إنشاء معرف فريد للعنصر بناءً على المنتج والمقاس واللون
      const cartItemId = `${product.id}-${product.size || 'no-size'}-${product.color || 'no-color'}`;
      const quantityToAdd = product.quantity || 1;

      const existingItem = prev.find((item) => item.cartItemId === cartItemId);

      if (existingItem) {
        // زيادة الكمية إذا كان نفس المنتج بنفس المقاس واللون موجود
        const newQuantity = Math.min(existingItem.quantity + quantityToAdd, product.stock);
        return prev.map((item) =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: newQuantity }
            : item
        );
      }

      // إضافة منتج جديد بالمقاس واللون المحددين
      const finalQuantity = Math.min(quantityToAdd, product.stock);
      return [...prev, { ...product, cartItemId, quantity: finalQuantity }];
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(cartItemId);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.cartItemId === cartItemId) {
          const newQuantity = Math.min(quantity, item.stock);
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}