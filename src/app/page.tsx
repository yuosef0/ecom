// src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useCart } from "../contexts/CartContext";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";

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
  old_price?: number; // السعر القديم قبل التخفيض
  image_url: string | null;
  images: string[];
  stock: number;
  sizes: string[];
  colors: { name: string; hex: string }[];
  category_id: string;
  created_at: string;
  category?: Category;
}

interface SliderImage {
  id: string;
  image_url: string;
  title: string | null;
  description: string | null;
  display_order: number;
  is_active: boolean;
}

// جمل متغيرة للبانر العلوي
const rotatingMessages = [
  "شحن مجاني للطلبات فوق 500 جنيه",
  "خصم 25% على جميع المنتجات الجديدة",
  "توصيل سريع لجميع المحافظات",
  "منتجات أصلية 100% بأفضل الأسعار",
];

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sliderImages, setSliderImages] = useState<SliderImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { addToCart, cart } = useCart();
  const { user, signOut, isAdmin } = useAuth();
  const [addedProducts, setAddedProducts] = useState<Set<string>>(new Set());

  // حالة الرسالة المتغيرة
  const [messageIndex, setMessageIndex] = useState(0);

  // حالة السلايدر
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSliderPaused, setIsSliderPaused] = useState(false);

  // حالة البحث
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // حالة قائمة المستخدم المنسدلة
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // تغيير الرسالة كل 3 ثوانٍ
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % rotatingMessages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // تغيير الصور كل 2 ثانية
  useEffect(() => {
    if (!isSliderPaused && sliderImages.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isSliderPaused, sliderImages.length]);

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

        // جلب صور السلايدر
        const { data: sliderData, error: sliderError } = await supabase
          .from("slider_images")
          .select("*")
          .eq("is_active", true)
          .order("display_order", { ascending: true });

        if (sliderError) {
          console.error("Error fetching slider images:", sliderError);
        } else {
          setSliderImages(sliderData || []);
        }
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

  // تجميع المنتجات حسب القسم
  const productsByCategory = categories.map((category) => ({
    category,
    products: products.filter((p) => p.category_id === category.id),
  })).filter((group) => group.products.length > 0);

  // فلترة المنتجات بناءً على البحث
  const filteredProductsByCategory = productsByCategory.map((group) => ({
    ...group,
    products: searchQuery
      ? group.products.filter((p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : group.products,
  })).filter((group) => group.products.length > 0);

  const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
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
      {/* Top Bar - الجزء الأول من الهيدر */}
      <div className="bg-red-600 text-white py-2">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center gap-8">
            {/* Social Media Icons - اليسار */}
            <div className="flex items-center gap-3">
              <a href="https://facebook.com" target="_blank" className="hover:opacity-80 transition">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="https://instagram.com" target="_blank" className="hover:opacity-80 transition">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="https://twitter.com" target="_blank" className="hover:opacity-80 transition">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
            </div>

            {/* Rotating Message - الوسط */}
            <div className="text-sm font-medium">
              <span className="inline-block animate-pulse">
                &lt; {rotatingMessages[messageIndex]} &gt;
              </span>
            </div>

            {/* Phone Number - اليمين */}
            <div className="text-sm">
              📞 01234567890
            </div>
          </div>
        </div>
      </div>

      {/* Main Header - الجزء الثاني من الهيدر */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="grid grid-cols-3 items-start gap-4">
            {/* Right Side - User & Cart */}
            <div className="flex items-center gap-4 justify-start">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center gap-2 hover:text-red-600 transition"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </button>

                  {showUserDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowUserDropdown(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-20">
                        <div className="p-4 border-b">
                          <p className="font-medium text-gray-900 truncate">{user.email}</p>
                        </div>
                        <div className="py-2">
                          <Link
                            href="/profile"
                            className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
                            onClick={() => setShowUserDropdown(false)}
                          >
                            📝 حسابي
                          </Link>
                          <Link
                            href="/orders"
                            className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
                            onClick={() => setShowUserDropdown(false)}
                          >
                            📦 طلباتي
                          </Link>
                          {isAdmin && (
                            <Link
                              href="/admin"
                              className="block px-4 py-2 text-blue-600 hover:bg-blue-50 transition font-medium"
                              onClick={() => setShowUserDropdown(false)}
                            >
                              ⚙️ لوحة التحكم
                            </Link>
                          )}
                        </div>
                        <div className="border-t py-2">
                          <button
                            onClick={() => {
                              signOut();
                              setShowUserDropdown(false);
                            }}
                            className="block w-full text-right px-4 py-2 text-red-600 hover:bg-red-50 transition"
                          >
                            🚪 تسجيل الخروج
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link href="/login" className="flex items-center gap-2 hover:text-red-600 transition">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </Link>
              )}

              <Link href="/cart" className="relative flex items-center gap-2 hover:text-red-600 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cartItemsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                )}
              </Link>
            </div>

            {/* Center - Logo & Navigation */}
            <div className="flex flex-col items-center gap-4">
              <Link href="/" className="text-3xl font-black text-red-600">
                متجري
              </Link>

              <nav className="flex items-center gap-6">
                <Link href="/" className="text-gray-700 hover:text-red-600 transition font-medium">
                  الرئيسية
                </Link>
                <Link href="/products" className="text-gray-700 hover:text-red-600 transition font-medium">
                  المنتجات
                </Link>
                <Link href="/about" className="text-gray-700 hover:text-red-600 transition font-medium">
                  من نحن
                </Link>
                <Link href="/contact" className="text-gray-700 hover:text-red-600 transition font-medium">
                  اتصل بنا
                </Link>
              </nav>
            </div>

            {/* Left Side - Search */}
            <div className="flex items-center justify-end">
              {searchOpen ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث عن منتج..."
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-600 w-64"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchQuery("");
                    }}
                    className="text-gray-600 hover:text-red-600"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="flex items-center gap-2 hover:text-red-600 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Slider Section */}
      {sliderImages.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-6">
          <div className="relative overflow-hidden rounded-2xl shadow-2xl aspect-[2/1]">
            {/* Slides */}
            <div className="relative w-full h-full">
              {sliderImages.map((image, index) => (
                <div
                  key={image.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    index === currentSlide ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 h-full">
                    {/* Left Side - Text Content */}
                    <div className="bg-black flex flex-col justify-center items-start px-12 py-8 text-white">
                      {image.title && (
                        <>
                          <p className="text-sm font-medium mb-2 opacity-80">تشكيل</p>
                          <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                            {image.title}
                          </h2>
                        </>
                      )}
                      {image.description && (
                        <p className="text-xl md:text-2xl font-medium opacity-90">
                          {image.description}
                        </p>
                      )}
                    </div>

                    {/* Right Side - Image */}
                    <div className="relative bg-gray-200">
                      <img
                        src={image.image_url}
                        alt={image.title || `Slide ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400'%3E%3Crect fill='%23ddd' width='800' height='400'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='40' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3E" + (image.title || "صورة السلايدر") + "%3C/text%3E%3C/svg%3E";
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Arrows & Controls */}
            <div className="absolute inset-x-0 bottom-6 flex items-center justify-center gap-4">
              {/* Previous Button */}
              <button
                onClick={() => setCurrentSlide((prev) => (prev === 0 ? sliderImages.length - 1 : prev - 1))}
                className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition flex items-center justify-center shadow-lg"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Dots Indicator */}
              <div className="flex gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                {sliderImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`transition-all ${
                      index === currentSlide
                        ? "w-8 h-2 bg-red-600 rounded-full"
                        : "w-2 h-2 bg-gray-400 rounded-full hover:bg-gray-600"
                    }`}
                  />
                ))}
              </div>

              {/* Next Button */}
              <button
                onClick={() => setCurrentSlide((prev) => (prev + 1) % sliderImages.length)}
                className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition flex items-center justify-center shadow-lg"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Play/Pause Button - Top Right */}
            <button
              onClick={() => setIsSliderPaused(!isSliderPaused)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition flex items-center justify-center shadow-lg"
            >
              {isSliderPaused ? (
                <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              )}
            </button>
          </div>
        </section>
      )}

      {/* Products by Category */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          {filteredProductsByCategory.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg mb-4">
                {searchQuery ? "لا توجد نتائج للبحث" : "لا توجد منتجات حالياً"}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-red-600 hover:underline"
                >
                  مسح البحث
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-16">
              {filteredProductsByCategory.map(({ category, products: categoryProducts }) => (
                <div key={category.id}>
                  {/* Category Title */}
                  <div className="mb-8 text-center">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">{category.name}</h2>
                    {category.description && (
                      <p className="text-gray-600">{category.description}</p>
                    )}
                    <div className="h-1 w-24 bg-red-600 mt-3 mx-auto"></div>
                  </div>

                  {/* Products Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {categoryProducts.map((product) => {
                    const productImage = product.images && product.images.length > 0
                      ? product.images[0]
                      : product.image_url || null;

                    const hasDiscount = product.old_price && product.old_price > product.price;

                    return (
                      <div
                        key={product.id}
                        className="bg-white rounded-lg overflow-hidden shadow hover:shadow-xl transition group"
                      >
                        {/* Image */}
                        <Link href={`/products/${product.id}`}>
                          <div className="relative h-48 bg-gray-100 overflow-hidden cursor-pointer">
                            {productImage ? (
                              <img
                                src={productImage}
                                alt={product.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full text-gray-400">
                                <span className="text-4xl">📦</span>
                              </div>
                            )}

                            {product.stock === 0 && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <span className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-bold">
                                  نفذت الكمية
                                </span>
                              </div>
                            )}
                          </div>
                        </Link>

                        {/* Info */}
                        <div className="p-4">
                          <Link href={`/products/${product.id}`}>
                            <h3 className="font-bold text-base mb-3 line-clamp-2 hover:text-red-600 transition cursor-pointer min-h-[3rem]">
                              {product.title}
                            </h3>
                          </Link>

                          {/* Price */}
                          <div className="mb-3">
                            {hasDiscount ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xl font-bold text-red-600">
                                  {product.price.toFixed(2)} ج.م
                                </span>
                                <span className="text-sm text-gray-400 line-through">
                                  {product.old_price!.toFixed(2)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xl font-bold text-gray-900">
                                {product.price.toFixed(2)} ج.م
                              </span>
                            )}
                          </div>

                          {/* Add to Cart */}
                          <button
                            onClick={() => handleAddToCart(product)}
                            disabled={product.stock === 0}
                            className={`w-full py-2 rounded-lg font-bold transition ${
                              addedProducts.has(product.id)
                                ? "bg-green-600 text-white"
                                : product.stock === 0
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-red-600 text-white hover:bg-red-700"
                            }`}
                          >
                            {product.stock === 0
                              ? "غير متوفر"
                              : addedProducts.has(product.id)
                              ? "✓ تمت الإضافة"
                              : "أضف للسلة"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
