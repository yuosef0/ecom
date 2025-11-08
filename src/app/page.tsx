// src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useCart } from "../contexts/CartContext";
import Link from "next/link";
import Header from "../components/Header";

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  image_url: string | null;
  images: string[];
  stock: number;
  sizes: string[];
  colors: { name: string; hex: string }[];
  created_at: string;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { addToCart, totalItems } = useCart();
  const [addedProducts, setAddedProducts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        setProducts(data || []);
      } catch (err: any) {
        console.error("❌ Error fetching products:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
      image_url: product.image_url,
      stock: product.stock,
    });

    // إضافة تأثير بصري
    setAddedProducts((prev) => new Set(prev).add(product.id));
    setTimeout(() => {
      setAddedProducts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(product.id);
        return newSet;
      });
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل المنتجات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-center">
        <p className="text-red-600">❌ حدث خطأ: {error}</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg mb-4">لا توجد منتجات حالياً</p>
            <Link 
              href="/admin" 
              className="text-blue-600 hover:underline"
            >
              أضف أول منتج →
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-6">المنتجات المتاحة ({products.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => {
                const productImage = product.images && product.images.length > 0
                  ? product.images[0]
                  : product.image_url || null;

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
                  >
                    {/* Product Image - Clickable */}
                    <Link href={`/products/${product.id}`}>
                      <div className="relative h-48 bg-gray-200 cursor-pointer">
                        {productImage ? (
                          <img
                            src={productImage}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            📦 بدون صورة
                          </div>
                        )}

                        {/* Stock Badge */}
                        {product.stock === 0 && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                            نفذت الكمية
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Product Info */}
                    <div className="p-4">
                      <Link href={`/products/${product.id}`}>
                        <h3 className="font-bold text-lg mb-2 line-clamp-1 cursor-pointer hover:text-blue-600 transition">
                          {product.title}
                        </h3>
                      </Link>

                      {product.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {product.description}
                        </p>
                      )}

                      <div className="flex justify-between items-center mb-3">
                        <span className="text-2xl font-bold text-blue-600">
                          {product.price.toFixed(2)} ج.م
                        </span>
                        <span className="text-sm text-gray-500">
                          متوفر: {product.stock}
                        </span>
                      </div>

                      {/* Quick Info */}
                      {(product.sizes?.length > 0 || product.colors?.length > 0) && (
                        <div className="flex gap-2 mb-3 text-xs text-gray-500">
                          {product.sizes?.length > 0 && (
                            <span>📏 {product.sizes.length} مقاس</span>
                          )}
                          {product.colors?.length > 0 && (
                            <span>🎨 {product.colors.length} لون</span>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Link
                          href={`/products/${product.id}`}
                          className="flex-1 bg-gray-100 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-200 transition text-center"
                        >
                          عرض التفاصيل
                        </Link>
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={product.stock === 0}
                          className={`flex-1 py-2 rounded-lg font-semibold transition ${
                            addedProducts.has(product.id)
                              ? "bg-green-600 text-white"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          } disabled:bg-gray-300 disabled:cursor-not-allowed`}
                        >
                          {product.stock === 0
                            ? "غير متوفر"
                            : addedProducts.has(product.id)
                            ? "✓"
                            : "🛒"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}