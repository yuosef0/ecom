"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { useWishlist } from "../../contexts/WishlistContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Footer from "../../components/Footer";

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  old_price?: number;
  image_url: string | null;
  images: string[];
  stock: number;
  sizes: string[];
  colors: { name: string; hex: string }[];
  category_id: string;
}

export default function WishlistPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { wishlist, removeFromWishlist, loading: wishlistLoading } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    fetchWishlistProducts();
  }, [user, wishlist]);

  const fetchWishlistProducts = async () => {
    if (wishlist.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const productIds = wishlist.map((item) => item.product_id);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .in("id", productIds);

      if (error) {
        console.error("Error fetching wishlist products:", error);
        return;
      }

      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching wishlist products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault(); // منع الانتقال للصفحة عند الحذف
    e.stopPropagation();
    const success = await removeFromWishlist(productId);
    if (success) {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a1a1a] text-[#333333] dark:text-[#f0f0f0]">
      <main className="container mx-auto px-4 md:px-8 lg:px-16 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">قائمة الرغبات</h1>
          <p className="text-[#666666] dark:text-[#aaaaaa]">
            المنتجات المفضلة لديك ({products.length})
          </p>
        </div>

        {loading || wishlistLoading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#e60000] border-t-transparent"></div>
            <p className="mt-4 text-[#666666] dark:text-[#aaaaaa]">
              جاري التحميل...
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <svg
              className="w-24 h-24 mx-auto mb-4 text-[#666666] dark:text-[#aaaaaa]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <p className="text-xl font-medium mb-2">قائمة الرغبات فارغة</p>
            <p className="text-[#666666] dark:text-[#aaaaaa] mb-6">
              ابدأ بإضافة منتجاتك المفضلة هنا
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-[#e60000] text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
              تصفح المنتجات
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug || product.id}`}
                className="bg-[#f5f5f5] dark:bg-[#2d1616] rounded-lg overflow-hidden border border-[#e5e7eb] dark:border-[#4a4a4a] hover:shadow-lg transition-all hover:scale-105 group"
              >
                {/* Product Image */}
                <div className="relative aspect-square">
                  <img
                    src={product.image_url || "/placeholder.jpg"}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                  {product.old_price && (
                    <div className="absolute top-2 right-2 bg-[#e60000] text-white px-2 py-1 rounded text-sm font-bold">
                      خصم {Math.round(((product.old_price - product.price) / product.old_price) * 100)}%
                    </div>
                  )}
                  {/* Remove Button */}
                  <button
                    onClick={(e) => handleRemoveFromWishlist(e, product.id)}
                    className="absolute top-2 left-2 p-2 bg-white/90 dark:bg-[#1a1a1a]/90 rounded-full hover:bg-white dark:hover:bg-[#1a1a1a] border border-[#e5e7eb] dark:border-[#4a4a4a] hover:scale-110 transition-all z-10"
                    title="إزالة من المفضلة"
                  >
                    <svg
                      className="w-5 h-5 text-[#e60000]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="font-medium text-lg mb-2 group-hover:text-[#e60000] transition-colors line-clamp-2">
                    {product.title}
                  </h3>

                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl font-bold text-[#e60000]">
                      {product.price} ريال
                    </span>
                    {product.old_price && (
                      <span className="text-sm text-[#666666] dark:text-[#aaaaaa] line-through">
                        {product.old_price} ريال
                      </span>
                    )}
                  </div>

                  {/* Stock Status */}
                  {product.stock === 0 ? (
                    <p className="text-red-500 text-sm">نفذ من المخزون</p>
                  ) : (
                    <p className="text-green-600 dark:text-green-400 text-sm">متوفر</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
