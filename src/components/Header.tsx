"use client";

import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Header() {
  const { user, signOut, isAdmin } = useAuth();
  const { cart } = useCart();
  const [showDropdown, setShowDropdown] = useState(false);
  const [profileName, setProfileName] = useState<string>("");

  const handleSignOut = async () => {
    await signOut();
    setShowDropdown(false);
  };

  const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0);

  // جلب الاسم من جدول profiles
  useEffect(() => {
    const loadProfileName = async () => {
      if (!user) {
        setProfileName("");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();

        if (data && !error) {
          setProfileName(data.full_name || "");
        }
      } catch (error) {
        // في حالة الخطأ، لا نفعل شيء
      }
    };

    loadProfileName();
  }, [user]);

  // الحصول على الاسم من بيانات المستخدم (مع الأولوية للاسم من profiles)
  const userName = profileName || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "مستخدم";

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-3xl">🛒</span>
            <span className="text-2xl font-bold text-blue-600">متجري</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-gray-700 hover:text-blue-600 transition"
            >
              الرئيسية
            </Link>
            <Link
              href="/products"
              className="text-gray-700 hover:text-blue-600 transition"
            >
              المنتجات
            </Link>
            <Link
              href="/about"
              className="text-gray-700 hover:text-blue-600 transition"
            >
              من نحن
            </Link>
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Cart */}
            <Link
              href="/cart"
              className="relative flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
            >
              <span className="text-xl">🛒</span>
              <span className="hidden sm:inline font-medium">السلة</span>
              {cartItemsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  <span className="text-xl">👤</span>
                  <span className="hidden sm:inline">{userName}</span>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <>
                    {/* Overlay */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowDropdown(false)}
                    />

                    {/* Menu */}
                    <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-20">
                      <div className="p-4 border-b">
                        <p className="font-medium text-gray-900">{userName}</p>
                        <p className="text-sm text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                      <div className="py-2">
                        <Link
                          href="/profile"
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
                          onClick={() => setShowDropdown(false)}
                        >
                          📝 حسابي
                        </Link>
                        <Link
                          href="/orders"
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
                          onClick={() => setShowDropdown(false)}
                        >
                          📦 طلباتي
                        </Link>
                        {isAdmin && (
                          <Link
                            href="/admin"
                            className="block px-4 py-2 text-blue-600 hover:bg-blue-50 transition font-medium"
                            onClick={() => setShowDropdown(false)}
                          >
                            ⚙️ لوحة التحكم
                          </Link>
                        )}
                      </div>
                      <div className="border-t py-2">
                        <button
                          onClick={handleSignOut}
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
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  تسجيل الدخول
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  إنشاء حساب
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
