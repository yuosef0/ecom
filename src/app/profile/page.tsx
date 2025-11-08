"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import { supabase } from "../../lib/supabaseClient";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);

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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setMessage("");

    try {
      if (!user) throw new Error("لا يوجد مستخدم مسجل");

      // حفظ البيانات في جدول profiles
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          full_name: fullName,
          phone: phone,
          address: address,
          city: city,
        });

      if (error) {
        // التحقق من نوع الخطأ
        if (
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
      // التحقق مرة أخرى على مستوى catch
      if (
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">حسابي</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">👤</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {fullName || "مستخدم"}
              </h2>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>

            <nav className="space-y-2">
              <a
                href="#profile"
                className="block px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium"
              >
                📝 الملف الشخصي
              </a>
              <a
                href="#orders"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                📦 طلباتي
              </a>
              <a
                href="#wishlist"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                ❤️ المفضلة
              </a>
              <a
                href="#settings"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                ⚙️ الإعدادات
              </a>
            </nav>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Profile Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                المعلومات الشخصية
              </h3>

              {message && (
                <div
                  className={`mb-4 p-4 rounded-lg ${
                    message.includes("✅")
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {message}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الاسم الكامل
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="أدخل اسمك الكامل"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    لا يمكن تغيير البريد الإلكتروني
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    رقم الهاتف
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+20 123 456 7890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    العنوان
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="الشارع، رقم المنزل، الحي"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    المدينة
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="القاهرة، الإسكندرية، إلخ"
                  />
                </div>

                <button
                  type="submit"
                  disabled={updating}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {updating ? "جارٍ التحديث..." : "حفظ التغييرات"}
                </button>
              </form>
            </div>

            {/* Account Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                معلومات الحساب
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-gray-700">طريقة التسجيل</span>
                  <span className="font-medium">
                    {user.app_metadata?.provider === "google" ? (
                      <span className="flex items-center gap-2">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                  </span>
                </div>

                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-gray-700">تاريخ التسجيل</span>
                  <span className="font-medium">
                    {new Date(user.created_at!).toLocaleDateString("ar-EG")}
                  </span>
                </div>

                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-700">آخر تسجيل دخول</span>
                  <span className="font-medium">
                    {new Date(user.last_sign_in_at!).toLocaleDateString(
                      "ar-EG",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
