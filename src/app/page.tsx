// src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useCart } from "../contexts/CartContext";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import TopBar from "../components/TopBar";

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
      {/* TopBar Component */}
      <TopBar />

      {/* Main Header */}
      <header className="header">
        <div className="header-top">
          {/* Left Side Icons */}
          <div className="flex items-center gap-3">
            {/* Search Icon */}
            <button
              onClick={() => setSearchOpen(true)}
              className="header-icon"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Account Icon */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="header-icon"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>

              {/* Account Dropdown Menu */}
              {showUserDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserDropdown(false)}
                  />
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-20">
                    {user ? (
                      <>
                        <div className="p-4 border-b">
                          <p className="font-medium text-gray-900 text-sm">{user.email}</p>
                        </div>
                        <div className="py-2">
                          <Link
                            href="/profile"
                            className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition text-sm"
                            onClick={() => setShowUserDropdown(false)}
                          >
                            📝 حسابي
                          </Link>
                          <Link
                            href="/orders"
                            className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition text-sm"
                            onClick={() => setShowUserDropdown(false)}
                          >
                            📦 طلباتي
                          </Link>
                          {isAdmin && (
                            <Link
                              href="/admin"
                              className="block px-4 py-2 text-blue-600 hover:bg-blue-50 transition font-medium text-sm"
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
                            className="block w-full text-right px-4 py-2 text-red-600 hover:bg-red-50 transition text-sm"
                          >
                            🚪 تسجيل الخروج
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="py-2">
                        <Link
                          href="/login"
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition text-sm"
                          onClick={() => setShowUserDropdown(false)}
                        >
                          تسجيل الدخول
                        </Link>
                        <Link
                          href="/signup"
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition text-sm"
                          onClick={() => setShowUserDropdown(false)}
                        >
                          إنشاء حساب
                        </Link>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Logo - Center */}
          <Link href="/" className="text-2xl font-black text-red-600">
            متجري
          </Link>

          {/* Cart Icon - Right */}
          <Link href="/cart" className="relative header-icon">
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

        {/* Navigation Links */}
        <div className="header-links">
          <Link href="/">رجالي</Link>
          <Link href="/">حريمي</Link>
          <Link href="/">أطفال</Link>
          <Link href="/">أحذية</Link>
        </div>
      </header>

      {/* Search Bar */}
      {searchOpen && (
        <div className="sticky top-0 z-40 bg-white shadow-md border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن منتج..."
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                autoFocus
              />
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
                className="flex items-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                إغلاق
              </button>
            </div>
            {searchQuery && (
              <p className="text-sm text-gray-600 mt-2">
                {filteredProductsByCategory.reduce((total, group) => total + group.products.length, 0)} منتج
              </p>
            )}
          </div>
        </div>
      )}

      {/* Slider Section */}
      {sliderImages.length > 0 && (
        <div className="container__slider">
          {sliderImages.map((image, index) => (
            <div
              key={image.id}
              className={`slider__item slider__item-active-${currentSlide + 1}`}
            >
              <img
                src={image.image_url}
                alt={image.title || `Slide ${index + 1}`}
                onError={(e) => {
                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400'%3E%3Crect fill='%23ddd' width='800' height='400'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='40' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3E" + (image.title || "صورة السلايدر") + "%3C/text%3E%3C/svg%3E";
                }}
              />
            </div>
          ))}

          {/* Controls */}
          <div className="controls">
            <button className="slider__btn" onClick={() => setCurrentSlide((prev) => (prev === 0 ? sliderImages.length - 1 : prev - 1))}>
              &lt;
            </button>

            {sliderImages.map((_, index) => (
              <button
                key={index}
                className={
                  currentSlide === index
                    ? "container__slider__links-small container__slider__links-small-active"
                    : "container__slider__links-small"
                }
                onClick={() => setCurrentSlide(index)}
              ></button>
            ))}

            <button className="slider__btn" onClick={() => setCurrentSlide((prev) => (prev + 1) % sliderImages.length)}>
              &gt;
            </button>

            <button className="pause-button" onClick={() => setIsSliderPaused(!isSliderPaused)}>
              {isSliderPaused ? "▶" : "⏸"}
            </button>
          </div>
        </div>
      )}

      {/* Products by Category */}
      <div className="home-container">
        <div className="categories-section">
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
            <>
              {filteredProductsByCategory.map(({ category, products: categoryProducts }) => (
                <div key={category.id} className="category-block">
                  {/* Category Title */}
                  <h2 className="category-title">{category.name}</h2>

                  {/* Products List */}
                  <div className="products-wrapper">
                    <div className="products-list">
                      {categoryProducts.map((product) => {
                        const productImage = product.images && product.images.length > 0
                          ? product.images[0]
                          : product.image_url || null;

                        const hasDiscount = product.old_price && product.old_price > product.price;
                        const discountPercentage = hasDiscount
                          ? Math.round(((product.old_price! - product.price) / product.old_price!) * 100)
                          : 0;

                        return (
                          <div key={product.id} className="product-card">
                            <Link href={`/products/${product.id}`} className="product-link">
                              <div className="product-image-wrapper">
                                {productImage ? (
                                  <img
                                    src={productImage}
                                    alt={product.title}
                                    className="product-image"
                                  />
                                ) : (
                                  <div className="flex items-center justify-center h-full text-gray-400">
                                    <span className="text-4xl">📦</span>
                                  </div>
                                )}
                              </div>

                              {hasDiscount && (
                                <span className="discount-badge">-{discountPercentage}%</span>
                              )}

                              <h3 className="product-title">{product.title}</h3>

                              <div className="price-section">
                                <span className="price-new">{product.price.toFixed(2)} ج.م</span>
                                {hasDiscount && (
                                  <span className="price-old">{product.old_price!.toFixed(2)}</span>
                                )}
                              </div>
                            </Link>

                            {/* زر أضف للسلة مخفي بـ CSS */}
                            <button
                              onClick={() => handleAddToCart(product)}
                              disabled={product.stock === 0}
                              className="add-to-cart-button"
                            >
                              {product.stock === 0 ? "غير متوفر" : "أضف للسلة"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
