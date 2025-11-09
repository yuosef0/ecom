// src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useCart } from "../contexts/CartContext";
import Link from "next/link";
import Header from "../components/Header";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
}

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  original_price?: number; // السعر الأصلي قبل الخصم
  discount_percentage?: number; // نسبة الخصم
  image_url: string | null;
  images: string[];
  stock: number;
  sizes: string[];
  colors: { name: string; hex: string }[];
  category_id: string;
  created_at: string;
  category?: Category;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { addToCart } = useCart();
  const [addedProducts, setAddedProducts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        // جلب الأقسام
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("categories")
          .select("*")
          .eq("is_active", true)
          .order("display_order", { ascending: true });

        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);

        // جلب المنتجات مع معلومات القسم
        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select(`
            *,
            category:categories (
              id,
              name,
              slug,
              description,
              display_order
            )
          `)
          .order("created_at", { ascending: false });

        if (productsError) throw productsError;

        // حساب السعر الأصلي والخصم (محاكاة - يمكنك إضافتها للـ database لاحقاً)
        const productsWithDiscount = (productsData || []).map((product) => ({
          ...product,
          original_price: Math.random() > 0.5 ? product.price * 1.25 : undefined,
          discount_percentage: Math.random() > 0.5 ? Math.floor(Math.random() * 30) + 10 : undefined,
        }));

        setProducts(productsWithDiscount);
      } catch (err: any) {
        console.error("❌ Error fetching data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
      image_url: product.image_url,
      stock: product.stock,
    });

    setAddedProducts((prev) => new Set(prev).add(product.id));
    setTimeout(() => {
      setAddedProducts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(product.id);
        return newSet;
      });
    }, 1000);
  };

  // فلترة المنتجات حسب القسم المختار
  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category_id === selectedCategory)
    : products;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">جاري تحميل المنتجات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <p className="text-red-600 text-lg">❌ حدث خطأ: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Hero Section - Promotional Banner */}
      <section className="relative bg-gradient-to-r from-black via-gray-900 to-black text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-20 md:py-28 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* النص الترويجي */}
            <div className="text-center md:text-right space-y-6">
              <div className="inline-block">
                <span className="bg-red-600 text-white px-6 py-2 rounded-full text-sm font-bold tracking-wider">
                  عرض محدود ⚡
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-black leading-tight">
                خصم حصري
                <span className="block text-red-500 mt-2">25%</span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-300 font-medium">
                على جميع المنتجات الجديدة
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
                <Link
                  href="#products"
                  className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-xl"
                >
                  تسوق الآن 🛍️
                </Link>
                <Link
                  href="/products"
                  className="bg-white hover:bg-gray-100 text-black px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-xl"
                >
                  عرض جميع المنتجات
                </Link>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-400 justify-center md:justify-start pt-6">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" />
                  </svg>
                  <span>شحن مجاني للطلبات فوق 500 جنيه</span>
                </div>
              </div>
            </div>

            {/* الصورة/البانر */}
            <div className="hidden md:flex justify-center items-center">
              <div className="relative">
                <div className="absolute inset-0 bg-red-600 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-red-500 to-red-700 rounded-2xl p-12 transform hover:scale-105 transition-transform">
                  <div className="text-center space-y-4">
                    <div className="text-8xl font-black text-white">25%</div>
                    <div className="text-2xl font-bold text-white">خصم</div>
                    <div className="text-sm text-red-100">على جميع المنتجات</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-black text-gray-900 mb-3">تسوق حسب القسم</h2>
              <div className="w-24 h-1 bg-red-600 mx-auto"></div>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-8 py-3.5 rounded-full font-bold text-lg transition-all transform hover:scale-105 ${
                  selectedCategory === null
                    ? "bg-black text-white shadow-xl"
                    : "bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-200"
                }`}
              >
                الكل ({products.length})
              </button>
              {categories.map((category) => {
                const count = products.filter((p) => p.category_id === category.id).length;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-8 py-3.5 rounded-full font-bold text-lg transition-all transform hover:scale-105 ${
                      selectedCategory === category.id
                        ? "bg-black text-white shadow-xl"
                        : "bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-200"
                    }`}
                  >
                    {category.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Products Section */}
      <section id="products" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-gray-500 text-xl mb-6">لا توجد منتجات في هذا القسم</p>
              <button
                onClick={() => setSelectedCategory(null)}
                className="bg-black text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-800 transition"
              >
                عرض جميع المنتجات
              </button>
            </div>
          ) : (
            <>
              <div className="text-center mb-12">
                <h2 className="text-4xl font-black text-gray-900 mb-3">
                  {selectedCategory
                    ? categories.find(c => c.id === selectedCategory)?.name
                    : "أحدث المنتجات"
                  }
                </h2>
                <div className="w-24 h-1 bg-red-600 mx-auto"></div>
              </div>

              {/* Products Grid - 5 per row on large screens */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredProducts.map((product) => {
                  const productImage = product.images && product.images.length > 0
                    ? product.images[0]
                    : product.image_url || null;

                  const hasDiscount = product.original_price && product.original_price > product.price;

                  return (
                    <div
                      key={product.id}
                      className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-gray-300 hover:shadow-2xl transition-all duration-300"
                    >
                      {/* Product Image */}
                      <Link href={`/products/${product.id}`}>
                        <div className="relative h-64 bg-gray-100 overflow-hidden cursor-pointer">
                          {productImage ? (
                            <img
                              src={productImage}
                              alt={product.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                              <div className="text-center">
                                <div className="text-5xl mb-2">📦</div>
                                <p className="text-sm">بدون صورة</p>
                              </div>
                            </div>
                          )}

                          {/* Discount Badge */}
                          {hasDiscount && product.discount_percentage && (
                            <div className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1.5 rounded-full text-sm font-black shadow-lg">
                              -{product.discount_percentage}%
                            </div>
                          )}

                          {/* Stock Badge */}
                          {product.stock === 0 && (
                            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                              <span className="bg-red-600 text-white px-6 py-2 rounded-full text-lg font-black">
                                نفذت الكمية
                              </span>
                            </div>
                          )}

                          {/* New Badge */}
                          {!hasDiscount && (
                            <div className="absolute top-3 left-3 bg-black text-white px-3 py-1.5 rounded-full text-xs font-bold">
                              جديد
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Product Info */}
                      <div className="p-4">
                        <Link href={`/products/${product.id}`}>
                          <h3 className="font-bold text-base mb-2 line-clamp-2 cursor-pointer hover:text-red-600 transition min-h-[3rem]">
                            {product.title}
                          </h3>
                        </Link>

                        {/* Price */}
                        <div className="mb-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-black text-gray-900">
                              {product.price.toFixed(2)} ج.م
                            </span>
                            {hasDiscount && product.original_price && (
                              <span className="text-sm text-gray-400 line-through">
                                {product.original_price.toFixed(2)} ج.م
                              </span>
                            )}
                          </div>
                          {hasDiscount && (
                            <p className="text-xs text-green-600 font-semibold mt-1">
                              وفر {(product.original_price! - product.price).toFixed(2)} جنيه!
                            </p>
                          )}
                        </div>

                        {/* Variants Info */}
                        {(product.sizes?.length > 0 || product.colors?.length > 0) && (
                          <div className="flex gap-3 mb-4 text-xs text-gray-500">
                            {product.sizes?.length > 0 && (
                              <span className="flex items-center gap-1">
                                📏 {product.sizes.length} مقاس
                              </span>
                            )}
                            {product.colors?.length > 0 && (
                              <span className="flex items-center gap-1">
                                🎨 {product.colors.length} لون
                              </span>
                            )}
                          </div>
                        )}

                        {/* Add to Cart Button */}
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={product.stock === 0}
                          className={`w-full py-3 rounded-lg font-bold transition-all transform hover:scale-105 ${
                            addedProducts.has(product.id)
                              ? "bg-green-600 text-white"
                              : product.stock === 0
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : "bg-black text-white hover:bg-red-600"
                          }`}
                        >
                          {product.stock === 0
                            ? "غير متوفر"
                            : addedProducts.has(product.id)
                            ? "✓ تمت الإضافة"
                            : "أضف للسلة 🛒"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Promo Banner */}
      <section className="bg-gradient-to-r from-red-600 to-red-700 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-white">
          <h3 className="text-3xl md:text-4xl font-black mb-4">
            شحن مجاني للطلبات فوق 500 جنيه! 🚚
          </h3>
          <p className="text-lg md:text-xl font-medium text-red-100">
            استمتع بتجربة تسوق مميزة مع توصيل سريع لجميع أنحاء الجمهورية
          </p>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-gray-900 mb-3">لماذا تختارنا؟</h2>
            <div className="w-24 h-1 bg-red-600 mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg text-center hover:shadow-2xl transition-shadow">
              <div className="text-6xl mb-4">✨</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">جودة عالية</h3>
              <p className="text-gray-600">منتجات أصلية 100% بأفضل الأسعار</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg text-center hover:shadow-2xl transition-shadow">
              <div className="text-6xl mb-4">🚚</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">توصيل سريع</h3>
              <p className="text-gray-600">شحن لجميع المحافظات خلال 2-5 أيام</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg text-center hover:shadow-2xl transition-shadow">
              <div className="text-6xl mb-4">🔒</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">دفع آمن</h3>
              <p className="text-gray-600">نظام دفع آمن ومحمي 100%</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
