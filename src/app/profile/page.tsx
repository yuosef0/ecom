"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import Footer from "../../components/Footer";
import { supabase } from "../../lib/supabaseClient";

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("profile");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      setEmail(user.email || "");
      loadProfile();
    }
  }, [user, loading, router]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      setProfileLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      // التعامل مع الأخطاء
      if (error) {
        // فقط استخدم البيانات من auth بدون عرض خطأ
        // لأن الجدول قد لا يكون موجوداً أو السجل غير موجود وهذا طبيعي
        setFullName(user.user_metadata?.full_name || "");
      } else if (data) {
        // تم جلب البيانات بنجاح
        setFullName(data.full_name || "");
        setPhone(data.phone || "");
        setAddress(data.address || "");
        setCity(data.city || "");
        setCountry(data.country || "");
      } else {
        // لا يوجد بيانات - استخدم من auth
        setFullName(user.user_metadata?.full_name || "");
      }
    } catch (error: any) {
      // في حالة الخطأ، استخدم البيانات من auth بدون عرض خطأ
      setFullName(user.user_metadata?.full_name || "");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setMessage("");

    try {
      if (!user) throw new Error("لا يوجد مستخدم مسجل");

      // التأكد من الـ session وتحديثها إذا لزم الأمر
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setMessage("❌ الجلسة منتهية. الرجاء تسجيل الدخول مرة أخرى");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
        return;
      }

      // حفظ البيانات في جدول profiles
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          full_name: fullName,
          phone: phone,
          address: address,
          city: city,
          country: country,
        });

      if (error) {
        // طباعة تفاصيل الخطأ للـ debugging
        console.error("Profile update error:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        console.error("Error details:", error.details);

        // التحقق من نوع الخطأ
        if (error.message?.includes("No API key")) {
          setMessage(`❌ خطأ في الاتصال بقاعدة البيانات.

الحل:
1. حاول تسجيل الخروج ثم الدخول مرة أخرى
2. إذا استمرت المشكلة، حدّث الصفحة (F5)`);
        } else if (
          error.code === "42P01" ||
          error.message?.includes("relation") ||
          error.message?.includes("does not exist") ||
          error.message?.includes("could not find") ||
          error.message?.includes("schema cache")
        ) {
          setMessage(`❌ جدول profiles غير موجود في قاعدة البيانات.

الحل:
1. افتح Supabase Dashboard → SQL Editor
2. افتح ملف: create-profiles-table.sql
3. انسخ المحتوى والصقه في SQL Editor
4. اضغط Run ▶️
5. حدّث هذه الصفحة`);
        } else {
          throw error;
        }
      } else {
        setMessage("✅ تم تحديث الملف الشخصي بنجاح");
      }
    } catch (error: any) {
      console.error("Caught error:", error);

      // التحقق مرة أخرى على مستوى catch
      if (error.message?.includes("No API key")) {
        setMessage(`❌ خطأ في الاتصال بقاعدة البيانات.

الحل:
1. حاول تسجيل الخروج ثم الدخول مرة أخرى
2. إذا استمرت المشكلة، حدّث الصفحة (F5)`);
      } else if (
        error.message?.includes("could not find") ||
        error.message?.includes("schema cache") ||
        error.message?.includes("profiles")
      ) {
        setMessage(`❌ جدول profiles غير موجود في قاعدة البيانات.

الحل:
1. افتح Supabase Dashboard → SQL Editor
2. افتح ملف: create-profiles-table.sql
3. انسخ المحتوى والصقه في SQL Editor
4. اضغط Run ▶️
5. حدّث هذه الصفحة`);
      } else {
        setMessage("❌ حدث خطأ: " + (error.message || "خطأ غير معروف"));
      }
    } finally {
      setUpdating(false);
    }
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-[#f8f5f5] dark:bg-[#230f0f] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e60000] mx-auto mb-4"></div>
          <p className="text-[#a14545] dark:text-[#eacdcd]">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f8f5f5] dark:bg-[#230f0f]">
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-[#2c1a1a] rounded-xl shadow-sm p-6">
              {/* User Info */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-[#e60000]/10 dark:bg-[#e60000]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-10 h-10 text-[#e60000]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-[#1d0c0c] dark:text-[#fcf8f8] mb-1">
                  {fullName || "مستخدم"}
                </h2>
                <p className="text-sm text-[#a14545] dark:text-[#eacdcd] break-words">
                  {user.email}
                </p>
              </div>

              {/* Navigation */}
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveSection("profile")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-right transition-colors ${
                    activeSection === "profile"
                      ? "bg-[#e60000] text-white"
                      : "text-[#1d0c0c] dark:text-[#fcf8f8] hover:bg-[#f8f5f5] dark:hover:bg-[#382626]"
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span className="font-medium">المعلومات الشخصية</span>
                </button>

                <button
                  onClick={() => setActiveSection("orders")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-right transition-colors ${
                    activeSection === "orders"
                      ? "bg-[#e60000] text-white"
                      : "text-[#1d0c0c] dark:text-[#fcf8f8] hover:bg-[#f8f5f5] dark:hover:bg-[#382626]"
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                  <span className="font-medium">طلباتي</span>
                </button>

                <button
                  onClick={() => setActiveSection("wishlist")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-right transition-colors ${
                    activeSection === "wishlist"
                      ? "bg-[#e60000] text-white"
                      : "text-[#1d0c0c] dark:text-[#fcf8f8] hover:bg-[#f8f5f5] dark:hover:bg-[#382626]"
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  <span className="font-medium">قائمة الرغبات</span>
                </button>

                <button
                  onClick={() => setActiveSection("addresses")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-right transition-colors ${
                    activeSection === "addresses"
                      ? "bg-[#e60000] text-white"
                      : "text-[#1d0c0c] dark:text-[#fcf8f8] hover:bg-[#f8f5f5] dark:hover:bg-[#382626]"
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="font-medium">العناوين</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-right transition-colors text-[#e60000] hover:bg-red-50 dark:hover:bg-[#e60000]/10"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span className="font-medium">تسجيل الخروج</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {activeSection === "profile" && (
              <>
                {/* Account Information Card */}
                <div className="bg-white dark:bg-[#2c1a1a] rounded-xl shadow-sm p-6">
                  <h3 className="text-xl font-bold text-[#1d0c0c] dark:text-[#fcf8f8] mb-6">
                    معلومات الحساب
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Registration Method */}
                    <div className="bg-[#f8f5f5] dark:bg-[#382626] rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-[#e60000]/10 dark:bg-[#e60000]/20 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-[#e60000]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-[#a14545] dark:text-[#eacdcd] mb-1">
                            طريقة التسجيل
                          </p>
                          <p className="font-semibold text-[#1d0c0c] dark:text-[#fcf8f8]">
                            {user.app_metadata?.provider === "google" ? (
                              <span className="flex items-center gap-2">
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                  <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                  />
                                  <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                  />
                                  <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                  />
                                  <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                  />
                                </svg>
                                Google
                              </span>
                            ) : (
                              "البريد الإلكتروني"
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Join Date */}
                    <div className="bg-[#f8f5f5] dark:bg-[#382626] rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-[#e60000]/10 dark:bg-[#e60000]/20 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-[#e60000]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-[#a14545] dark:text-[#eacdcd] mb-1">
                            تاريخ التسجيل
                          </p>
                          <p className="font-semibold text-[#1d0c0c] dark:text-[#fcf8f8]">
                            {new Date(user.created_at!).toLocaleDateString("ar-SA")}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Last Login */}
                    <div className="bg-[#f8f5f5] dark:bg-[#382626] rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-[#e60000]/10 dark:bg-[#e60000]/20 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-[#e60000]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-[#a14545] dark:text-[#eacdcd] mb-1">
                            آخر تسجيل دخول
                          </p>
                          <p className="font-semibold text-[#1d0c0c] dark:text-[#fcf8f8] text-sm">
                            {new Date(user.last_sign_in_at!).toLocaleDateString("ar-SA", {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Personal Information Form */}
                <div className="bg-white dark:bg-[#2c1a1a] rounded-xl shadow-sm p-6">
                  <h3 className="text-xl font-bold text-[#1d0c0c] dark:text-[#fcf8f8] mb-6">
                    المعلومات الشخصية
                  </h3>

                  {message && (
                    <div
                      className={`mb-6 p-4 rounded-lg ${
                        message.includes("✅")
                          ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
                          : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                      }`}
                    >
                      <div className="whitespace-pre-line">{message}</div>
                    </div>
                  )}

                  <form onSubmit={handleUpdateProfile} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Full Name */}
                      <div>
                        <label className="block text-base font-medium text-[#1d0c0c] dark:text-[#fcf8f8] mb-2">
                          الاسم الكامل
                        </label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full h-12 px-4 rounded-lg border border-[#eacdcd] dark:border-[#5a4848] bg-[#fcf8f8] dark:bg-[#382626] text-[#1d0c0c] dark:text-[#fcf8f8] placeholder:text-[#a14545] dark:placeholder:text-[#b49898] focus:border-[#e60000] dark:focus:border-[#e60000] focus:outline-0 focus:ring-0"
                          placeholder="أدخل اسمك الكامل"
                        />
                      </div>

                      {/* Email (Read-only) */}
                      <div>
                        <label className="block text-base font-medium text-[#1d0c0c] dark:text-[#fcf8f8] mb-2">
                          البريد الإلكتروني
                        </label>
                        <input
                          type="email"
                          value={email}
                          disabled
                          className="w-full h-12 px-4 rounded-lg border border-[#eacdcd] dark:border-[#5a4848] bg-gray-100 dark:bg-[#2c1a1a] text-[#a14545] dark:text-[#b49898] cursor-not-allowed"
                        />
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-base font-medium text-[#1d0c0c] dark:text-[#fcf8f8] mb-2">
                          رقم الهاتف
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full h-12 px-4 rounded-lg border border-[#eacdcd] dark:border-[#5a4848] bg-[#fcf8f8] dark:bg-[#382626] text-[#1d0c0c] dark:text-[#fcf8f8] placeholder:text-[#a14545] dark:placeholder:text-[#b49898] focus:border-[#e60000] dark:focus:border-[#e60000] focus:outline-0 focus:ring-0"
                          placeholder="+966 5X XXX XXXX"
                        />
                      </div>

                      {/* Country */}
                      <div>
                        <label className="block text-base font-medium text-[#1d0c0c] dark:text-[#fcf8f8] mb-2">
                          الدولة
                        </label>
                        <input
                          type="text"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="w-full h-12 px-4 rounded-lg border border-[#eacdcd] dark:border-[#5a4848] bg-[#fcf8f8] dark:bg-[#382626] text-[#1d0c0c] dark:text-[#fcf8f8] placeholder:text-[#a14545] dark:placeholder:text-[#b49898] focus:border-[#e60000] dark:focus:border-[#e60000] focus:outline-0 focus:ring-0"
                          placeholder="المملكة العربية السعودية"
                        />
                      </div>

                      {/* City */}
                      <div>
                        <label className="block text-base font-medium text-[#1d0c0c] dark:text-[#fcf8f8] mb-2">
                          المدينة
                        </label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full h-12 px-4 rounded-lg border border-[#eacdcd] dark:border-[#5a4848] bg-[#fcf8f8] dark:bg-[#382626] text-[#1d0c0c] dark:text-[#fcf8f8] placeholder:text-[#a14545] dark:placeholder:text-[#b49898] focus:border-[#e60000] dark:focus:border-[#e60000] focus:outline-0 focus:ring-0"
                          placeholder="الرياض، جدة، الدمام، إلخ"
                        />
                      </div>

                      {/* Address */}
                      <div className="md:col-span-2">
                        <label className="block text-base font-medium text-[#1d0c0c] dark:text-[#fcf8f8] mb-2">
                          العنوان
                        </label>
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="w-full h-12 px-4 rounded-lg border border-[#eacdcd] dark:border-[#5a4848] bg-[#fcf8f8] dark:bg-[#382626] text-[#1d0c0c] dark:text-[#fcf8f8] placeholder:text-[#a14545] dark:placeholder:text-[#b49898] focus:border-[#e60000] dark:focus:border-[#e60000] focus:outline-0 focus:ring-0"
                          placeholder="الشارع، رقم المنزل، الحي"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={updating}
                      className="w-full h-12 rounded-lg bg-[#e60000] text-white font-bold transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updating ? "جارٍ الحفظ..." : "حفظ التغييرات"}
                    </button>
                  </form>
                </div>
              </>
            )}

            {activeSection === "orders" && (
              <div className="bg-white dark:bg-[#2c1a1a] rounded-xl shadow-sm p-6">
                <h3 className="text-xl font-bold text-[#1d0c0c] dark:text-[#fcf8f8] mb-6">
                  طلباتي
                </h3>
                <div className="text-center py-12">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 text-[#a14545] dark:text-[#eacdcd]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                  <p className="text-[#a14545] dark:text-[#eacdcd]">لا توجد طلبات حتى الآن</p>
                </div>
              </div>
            )}

            {activeSection === "wishlist" && (
              <div className="bg-white dark:bg-[#2c1a1a] rounded-xl shadow-sm p-6">
                <h3 className="text-xl font-bold text-[#1d0c0c] dark:text-[#fcf8f8] mb-6">
                  قائمة الرغبات
                </h3>
                <div className="text-center py-12">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 text-[#a14545] dark:text-[#eacdcd]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  <p className="text-[#a14545] dark:text-[#eacdcd]">قائمة الرغبات فارغة</p>
                </div>
              </div>
            )}

            {activeSection === "addresses" && (
              <div className="bg-white dark:bg-[#2c1a1a] rounded-xl shadow-sm p-6">
                <h3 className="text-xl font-bold text-[#1d0c0c] dark:text-[#fcf8f8] mb-6">
                  العناوين
                </h3>
                <div className="text-center py-12">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 text-[#a14545] dark:text-[#eacdcd]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <p className="text-[#a14545] dark:text-[#eacdcd]">لا توجد عناوين محفوظة</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
