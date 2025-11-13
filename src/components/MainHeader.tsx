"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabaseClient";
import TopBar from "./TopBar";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function MainHeader() {
  const { cart } = useCart();
  const { wishlist } = useWishlist();
  const { user, signOut, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0);
  const wishlistCount = wishlist.length;

  // قراءة الـ search من الـ URL
  useEffect(() => {
    const search = searchParams?.get("search");
    if (search) {
      setSearchQuery(search);
      setSearchOpen(true);
    }
  }, [searchParams]);

  // دالة البحث
  const handleSearch = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();

    if (searchQuery.trim()) {
      // البحث
      const currentCategory = searchParams?.get("category");
      const queryParams = new URLSearchParams();
      queryParams.set("search", searchQuery.trim());

      // الحفاظ على الـ category إذا كانت موجودة
      if (currentCategory) {
        queryParams.set("category", currentCategory);
      }

      // التوجه للصفحة الرئيسية مع الـ search query
      if (pathname === "/") {
        router.push(`/?${queryParams.toString()}`);
      } else {
        router.push(`/?${queryParams.toString()}`);
      }
    } else {
      // إذا كان الـ search فارغ، إزالة الـ search من الـ URL
      const currentCategory = searchParams?.get("category");
      if (currentCategory) {
        router.push(`/?category=${currentCategory}`);
      } else {
        router.push("/");
      }
    }
  };

  // مسح البحث وإغلاق نموذج البحث
  const clearSearch = () => {
    setSearchQuery("");
    setSearchOpen(false);
    const currentCategory = searchParams?.get("category");
    if (currentCategory) {
      router.push(`/?category=${currentCategory}`);
    } else {
      router.push("/");
    }
  };

  // جلب الأقسام
  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .limit(5);

      if (data) {
        setCategories(data);
      }
    };

    fetchCategories();
  }, []);

  return (
    <>
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
                aria-label={searchOpen ? "Close Search" : "Search"}
                className="flex items-center justify-center p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                {searchOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
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
                    <div className="absolute right-0 md:left-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white dark:bg-[#2d1616] rounded-lg shadow-lg border border-[#e5e7eb] dark:border-[#4a4a4a] z-20">
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

            {/* Wishlist & Cart Icons - Right */}
            <div className="flex items-center justify-end gap-2 w-1/3">
              {/* Wishlist Icon */}
              <Link
                href="/wishlist"
                aria-label="Wishlist"
                className="relative flex items-center justify-center p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#e60000] text-white text-xs font-bold">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart Icon */}
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

          {/* Navigation Links - Desktop */}
          <nav className="hidden md:flex justify-center items-center gap-8 pt-4 mt-2 border-t border-[#e5e7eb] dark:border-[#4a4a4a]">
            <Link
              href="/"
              className="text-base font-medium hover:text-[#e60000] transition-colors text-[#333333] dark:text-[#f0f0f0]"
            >
              الرئيسية
            </Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="text-base font-medium hover:text-[#e60000] transition-colors text-[#333333] dark:text-[#f0f0f0]"
              >
                {category.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Search Bar - Shows when search is open */}
        {searchOpen && (
          <div className="border-t border-[#e5e7eb] dark:border-[#4a4a4a] bg-[#f5f5f5] dark:bg-[#281313] p-4">
            <div className="container mx-auto px-4 md:px-8 lg:px-16">
              <form onSubmit={handleSearch}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch(e);
                    }
                  }}
                  placeholder="ابحث عن منتج... (اسم المنتج أو الوصف)"
                  className="w-full px-4 py-2 rounded-lg border border-[#e5e7eb] dark:border-[#4a4a4a] bg-white dark:bg-[#2d1616] focus:outline-none focus:ring-2 focus:ring-[#e60000]"
                  autoFocus
                />
              </form>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
