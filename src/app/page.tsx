// src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useCart } from "../contexts/CartContext";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import TopBar from "../components/TopBar";
import Footer from "../components/Footer";

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
  const { cart } = useCart();
  const { user, signOut, isAdmin } = useAuth();

  // حالة السلايدر
  const [currentSlide, setCurrentSlide] = useState(0);

  // حالة البحث
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // حالة قائمة المستخدم المنسدلة
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // تغيير الصور تلقائياً كل 5 ثوانٍ
  useEffect(() => {
    if (sliderImages.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [sliderImages.length]);

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e60000] mx-auto mb-4"></div>
          <p className="text-[#666666] dark:text-[#aaaaaa]">جاري تحميل المنتجات...</p>
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
    <div className="relative flex w-full flex-col min-h-screen bg-[#f8f5f5] dark:bg-[#230f0f]">
      {/* TopBar Component */}
      <TopBar />

      {/* Main Header */}
      <header className="bg-white dark:bg-[#2d1616] sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 md:px-8 lg:px-16 py-4">
          <div className="flex items-center justify-between">
            {/* Left Side Icons */}
            <div className="flex items-center gap-4 w-1/3">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label="Search"
                className="flex items-center justify-center p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Account Icon with Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  aria-label="User Account"
                  className="flex items-center justify-center p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
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
                    <div className="absolute left-0 right-0 md:right-auto mt-2 w-full md:w-64 mx-4 md:mx-0 bg-white dark:bg-[#2d1616] rounded-lg shadow-lg border border-[#e5e7eb] dark:border-[#4a4a4a] z-20">
                      {user ? (
                        <>
                          <div className="p-4 border-b border-[#e5e7eb] dark:border-[#4a4a4a]">
                            <p className="font-medium text-[#333333] dark:text-[#f0f0f0] text-sm break-words overflow-hidden">
                              {user.email}
                            </p>
                          </div>
                          <div className="py-2">
                            <Link
                              href="/profile"
                              className="block px-4 py-2 text-[#666666] dark:text-[#aaaaaa] hover:bg-[#f5f5f5] dark:hover:bg-[#281313] transition text-sm"
                              onClick={() => setShowUserDropdown(false)}
                            >
                              📝 حسابي
                            </Link>
                            <Link
                              href="/orders"
                              className="block px-4 py-2 text-[#666666] dark:text-[#aaaaaa] hover:bg-[#f5f5f5] dark:hover:bg-[#281313] transition text-sm"
                              onClick={() => setShowUserDropdown(false)}
                            >
                              📦 طلباتي
                            </Link>
                            {isAdmin && (
                              <Link
                                href="/admin"
                                className="block px-4 py-2 text-[#e60000] hover:bg-[#f5f5f5] dark:hover:bg-[#281313] transition font-medium text-sm"
                                onClick={() => setShowUserDropdown(false)}
                              >
                                ⚙️ لوحة التحكم
                              </Link>
                            )}
                          </div>
                          <div className="border-t border-[#e5e7eb] dark:border-[#4a4a4a] py-2">
                            <button
                              onClick={() => {
                                signOut();
                                setShowUserDropdown(false);
                              }}
                              className="block w-full text-right px-4 py-2 text-[#e60000] hover:bg-[#f5f5f5] dark:hover:bg-[#281313] transition text-sm"
                            >
                              🚪 تسجيل الخروج
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="py-2">
                          <Link
                            href="/login"
                            className="block px-4 py-2 text-[#666666] dark:text-[#aaaaaa] hover:bg-[#f5f5f5] dark:hover:bg-[#281313] transition text-sm"
                            onClick={() => setShowUserDropdown(false)}
                          >
                            تسجيل الدخول
                          </Link>
                          <Link
                            href="/signup"
                            className="block px-4 py-2 text-[#666666] dark:text-[#aaaaaa] hover:bg-[#f5f5f5] dark:hover:bg-[#281313] transition text-sm"
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
            <div className="w-1/3 text-center">
              <Link href="/" className="text-2xl md:text-3xl font-bold tracking-tight">
                متجري
              </Link>
            </div>

            {/* Cart Icon - Right */}
            <div className="flex items-center justify-end gap-4 w-1/3">
              <Link
                href="/cart"
                aria-label="Shopping Cart"
                className="relative flex items-center justify-center p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#e60000] text-white text-xs font-bold">
                    {cartItemsCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex justify-center items-center gap-8 pt-4 mt-2 border-t border-[#e5e7eb] dark:border-[#4a4a4a]">
            <Link href="/" className="text-base font-medium text-[#333333] dark:text-[#f0f0f0] hover:text-[#e60000] transition-colors">
              رجالي
            </Link>
            <Link href="/" className="text-base font-medium text-[#333333] dark:text-[#f0f0f0] hover:text-[#e60000] transition-colors">
              حريمي
            </Link>
            <Link href="/" className="text-base font-medium text-[#333333] dark:text-[#f0f0f0] hover:text-[#e60000] transition-colors">
              أطفال
            </Link>
            <Link href="/" className="text-base font-medium text-[#333333] dark:text-[#f0f0f0] hover:text-[#e60000] transition-colors">
              أحذية
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-grow">

        {/* Sticky Search Bar */}
        {searchOpen && (
          <div className="sticky top-[7.5rem] md:top-[9rem] z-30 px-4 md:px-8 lg:px-16 py-3 bg-[#f8f5f5]/80 dark:bg-[#230f0f]/80 backdrop-blur-sm shadow-sm">
            <div className="flex flex-col min-w-40 h-12 w-full max-w-2xl mx-auto">
              <div className="flex w-full flex-1 items-stretch rounded-lg h-full shadow-md">
                <div className="text-[#666666] dark:text-[#aaaaaa] flex bg-white dark:bg-[#2d1616] items-center justify-center pl-4 rounded-r-lg border-l border-[#e5e7eb] dark:border-[#4a4a4a]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن المنتجات..."
                  className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg focus:outline-0 focus:ring-2 focus:ring-[#e60000]/50 border-none bg-white dark:bg-[#2d1616] h-full placeholder:text-[#666666] dark:placeholder:text-[#aaaaaa] px-4 rounded-r-none border-r-0 text-base font-normal leading-normal text-[#333333] dark:text-[#f0f0f0]"
                  autoFocus
                />
              </div>
            </div>
          </div>
        )}

        {/* Hero Slider/Carousel */}
        <div className="container mx-auto px-4 md:px-8 lg:px-16 pt-6">
          <div className="relative w-full overflow-hidden rounded-xl shadow-lg">
            {sliderImages.length > 0 ? (
              <>
                <div className="flex">
                  <div className="min-w-full duration-700 ease-in-out">
                    <div
                      className="relative w-full bg-center bg-no-repeat aspect-[16/7] md:aspect-[16/6] bg-cover flex flex-col justify-center items-start text-white p-8 md:p-16 rounded-xl"
                      style={{
                        backgroundImage: `url(${sliderImages[currentSlide]?.image_url})`,
                      }}
                    >
                      <div className="bg-black/40 p-6 rounded-lg">
                        <h2 className="text-3xl md:text-5xl font-extrabold mb-3">
                          {sliderImages[currentSlide]?.title || "تشكيلة الصيف الجديدة"}
                        </h2>
                        <p className="text-lg md:text-xl mb-6 max-w-md">
                          {sliderImages[currentSlide]?.description || "تسوق الآن أحدث صيحات الموضة بخصومات تصل إلى 50%"}
                        </p>
                        <Link
                          href="/products"
                          className="inline-flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-[#e60000] text-white text-base font-bold leading-normal tracking-wide hover:opacity-90 transition-opacity"
                        >
                          <span className="truncate">تسوق الآن</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Slider Dots */}
                <div className="absolute bottom-4 right-0 left-0">
                  <div className="flex items-center justify-center gap-2">
                    {sliderImages.map((_, index) => (
                      <button
                        key={index}
                        aria-label={`Go to slide ${index + 1}`}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-3 h-3 rounded-full ${
                          currentSlide === index ? "bg-white" : "bg-white/50"
                        }`}
                      ></button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full aspect-[16/7] md:aspect-[16/6] bg-[#f5f5f5] dark:bg-[#281313] rounded-xl flex items-center justify-center">
                <p className="text-[#666666] dark:text-[#aaaaaa]">لا توجد صور في السلايدر</p>
              </div>
            )}
          </div>
        </div>

        {/* Product Grid Sections */}
        <div className="container mx-auto px-4 md:px-8 lg:px-16">
          {filteredProductsByCategory.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[#666666] dark:text-[#aaaaaa] text-lg mb-4">
                {searchQuery ? "لا توجد نتائج للبحث" : "لا توجد منتجات حالياً"}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-[#e60000] hover:underline font-medium"
                >
                  مسح البحث
                </button>
              )}
            </div>
          ) : (
            <>
              {filteredProductsByCategory.map(({ category, products: categoryProducts }) => (
                <div key={category.id} className="mt-8">
                  {/* Category Title */}
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight px-4 pb-3 pt-10 text-[#333333] dark:text-[#f0f0f0]">
                    {category.name}
                  </h2>

                  {/* Products Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 p-4">
                    {categoryProducts.map((product) => {
                      const productImage =
                        product.images && product.images.length > 0
                          ? product.images[0]
                          : product.image_url || null;

                      const hasDiscount =
                        product.old_price && product.old_price > product.price;
                      const discountPercentage = hasDiscount
                        ? Math.round(
                            ((product.old_price! - product.price) /
                              product.old_price!) *
                              100
                          )
                        : 0;

                      return (
                        <Link
                          key={product.id}
                          href={`/products/${product.id}`}
                          className="flex flex-col gap-3 pb-3 bg-white dark:bg-[#2d1616] rounded-lg shadow-sm overflow-hidden group hover:shadow-md transition-shadow duration-300"
                        >
                          <div
                            className={`relative w-full bg-center bg-no-repeat aspect-[3/4] bg-cover transition-transform duration-300 group-hover:scale-105 ${
                              !productImage && "bg-[#f5f5f5] dark:bg-[#281313]"
                            }`}
                            style={
                              productImage
                                ? { backgroundImage: `url(${productImage})` }
                                : {}
                            }
                          >
                            {!productImage && (
                              <div className="flex items-center justify-center h-full text-[#aaaaaa]">
                                <span className="text-4xl">📦</span>
                              </div>
                            )}
                            {hasDiscount && (
                              <span className="absolute top-3 right-3 bg-[#e60000] text-white text-xs font-bold px-2 py-1 rounded">
                                خصم {discountPercentage}%
                              </span>
                            )}
                          </div>
                          <div className="px-4">
                            <p className="text-base font-medium leading-normal truncate text-[#333333] dark:text-[#f0f0f0]">
                              {product.title}
                            </p>
                            <div className="flex items-baseline gap-2 mt-1">
                              <p className="text-lg font-bold text-[#e60000]">
                                {product.price.toFixed(2)} ريال
                              </p>
                              {hasDiscount && (
                                <p className="text-sm font-normal text-[#666666] dark:text-[#aaaaaa] line-through">
                                  {product.old_price!.toFixed(2)} ريال
                                </p>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
