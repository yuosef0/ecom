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
  const { addToCart, totalItems } = useCart();
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
        setProducts(productsData || []);
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

  // فلترة المنتجات حسب القسم المختار
  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category_id === selectedCategory)
    : products;

  // تجميع المنتجات حسب القسم
  const productsByCategory = categories.map((category) => ({
    category,
    products: filteredProducts.filter((p) => p.category_id === category.id),
  })).filter((group) => group.products.length > 0);

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
            {/* Category Filters */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">تسوق حسب القسم</h2>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-6 py-2.5 rounded-lg font-semibold transition ${
                    selectedCategory === null
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
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
                      className={`px-6 py-2.5 rounded-lg font-semibold transition ${
                        selectedCategory === category.id
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                      }`}
                    >
                      {category.name} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Products by Category */}
            {productsByCategory.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">لا توجد منتجات في هذا القسم</p>
              </div>
            ) : (
              <div className="space-y-12">
                {productsByCategory.map(({ category, products: categoryProducts }) => (
                  <div key={category.id}>
                    {/* Category Header */}
                    <div className="mb-6">
                      <h3 className="text-3xl font-bold text-gray-800 mb-2">{category.name}</h3>
                      {category.description && (
                        <p className="text-gray-600">{category.description}</p>
                      )}
                      <div className="h-1 w-20 bg-blue-600 mt-2"></div>
                    </div>

                    {/* Products Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {categoryProducts.map((product) => {
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
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}