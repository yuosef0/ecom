"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";
import { supabase } from "../../lib/supabaseClient";

type PaymentMethod = "stripe" | "paymob";

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, clearCart } = useCart();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("paymob");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // حساب المجموع الكلي
  const totalAmount = cart.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);

  // تحميل بيانات المستخدم من profiles أو localStorage
  useEffect(() => {
    const loadUserData = async () => {
      // أولاً، حاول تحميل البيانات من localStorage (من صفحة السلة)
      const savedData = localStorage.getItem("checkoutInfo");
      if (savedData) {
        try {
          const { customerInfo, appliedCoupon, timestamp } = JSON.parse(savedData);

          // تحقق من أن البيانات لا تتجاوز 30 دقيقة
          const thirtyMinutes = 30 * 60 * 1000;
          if (Date.now() - timestamp < thirtyMinutes) {
            if (customerInfo) {
              setName(customerInfo.name || "");
              setEmail(customerInfo.email || "");
              setPhone(customerInfo.phone || "");
              setAddress(customerInfo.address || "");
              setCity(customerInfo.city || "");
            }
          } else {
            // البيانات قديمة، امسحها
            localStorage.removeItem("checkoutInfo");
          }
        } catch (error) {
          console.error("خطأ في قراءة البيانات المحفوظة:", error);
          localStorage.removeItem("checkoutInfo");
        }
      }

      // إذا لم توجد بيانات في localStorage، حاول تحميلها من profile المستخدم
      if (!savedData && user) {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (data && !error) {
            setName(data.full_name || "");
            setPhone(data.phone || "");
            setAddress(data.address || "");
            setCity(data.city || "");
            setEmail(user.email || "");
          }
        } catch (error) {
          // في حالة الخطأ، نستخدم بيانات user_metadata
          setName(user.user_metadata?.full_name || "");
          setEmail(user.email || "");
        }
      }
    };

    loadUserData();
  }, [user]);

  // معالجة الدفع
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (cart.length === 0) {
        setError("سلة التسوق فارغة");
        setLoading(false);
        return;
      }

      if (!name || !phone || !address || !city) {
        setError("يرجى ملء جميع الحقول");
        setLoading(false);
        return;
      }

      if (paymentMethod === "stripe") {
        // الدفع عبر Stripe
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: cart,
            customerInfo: {
              name,
              email,
              phone,
              address,
              city,
            },
            userId: user?.id,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "حدث خطأ في معالجة الطلب");
        }

        // حفظ orderId في localStorage
        if (data.orderId) {
          localStorage.setItem("currentOrderId", data.orderId);
        }

        // إعادة توجيه إلى صفحة الدفع Stripe
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        // الدفع عبر Paymob
        const response = await fetch("/api/paymob/payment-key", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: cart,
            customerInfo: {
              name,
              email,
              phone,
              address,
              city,
            },
            userId: user?.id,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "حدث خطأ في معالجة الطلب");
        }

        // حفظ orderId في localStorage
        localStorage.setItem("currentOrderId", data.orderId);

        // إعادة توجيه إلى صفحة الدفع Paymob
        const paymentUrl = `https://accept.paymob.com/api/acceptance/iframes/${data.iframeId}?payment_token=${data.paymentKey}`;
        window.location.href = paymentUrl;
      }
    } catch (error: any) {
      console.error("خطأ في معالجة الدفع:", error);
      setError(error.message || "حدث خطأ في معالجة الطلب");
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#1a0a0a] flex items-center justify-center">
        <div className="bg-white dark:bg-[#2d1616] p-8 rounded-lg shadow-md text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-[#333333] dark:text-[#f0f0f0]">
            يجب تسجيل الدخول أولاً
          </h2>
          <p className="text-[#666666] dark:text-[#aaaaaa] mb-6">
            قم بتسجيل الدخول لإتمام عملية الشراء
          </p>
          <button
            onClick={() => router.push("/login")}
            className="px-6 py-3 rounded-lg font-semibold transition-colors"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "var(--color-button-text)",
            }}
          >
            تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#1a0a0a] flex items-center justify-center">
        <div className="bg-white dark:bg-[#2d1616] p-8 rounded-lg shadow-md text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-[#333333] dark:text-[#f0f0f0]">
            سلة التسوق فارغة
          </h2>
          <p className="text-[#666666] dark:text-[#aaaaaa] mb-6">
            أضف بعض المنتجات إلى سلة التسوق للمتابعة
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 rounded-lg font-semibold transition-colors"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "var(--color-button-text)",
            }}
          >
            العودة للتسوق
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1a0a0a] py-8">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center text-[#333333] dark:text-[#f0f0f0]">
          إتمام الطلب
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* معلومات الشحن والدفع */}
          <div className="space-y-6">
            {/* معلومات الشحن */}
            <div className="bg-white dark:bg-[#2d1616] p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-4 text-[#333333] dark:text-[#f0f0f0]">
                معلومات الشحن
              </h2>

              {error && (
                <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handlePayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#333333] dark:text-[#f0f0f0] mb-2">
                    الاسم الكامل *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white dark:bg-[#1a0a0a] text-[#333333] dark:text-[#f0f0f0]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#333333] dark:text-[#f0f0f0] mb-2">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white dark:bg-[#1a0a0a] text-[#333333] dark:text-[#f0f0f0]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#333333] dark:text-[#f0f0f0] mb-2">
                    رقم الهاتف *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white dark:bg-[#1a0a0a] text-[#333333] dark:text-[#f0f0f0]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#333333] dark:text-[#f0f0f0] mb-2">
                    العنوان *
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white dark:bg-[#1a0a0a] text-[#333333] dark:text-[#f0f0f0]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#333333] dark:text-[#f0f0f0] mb-2">
                    المدينة *
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white dark:bg-[#1a0a0a] text-[#333333] dark:text-[#f0f0f0]"
                    required
                  />
                </div>

                {/* اختيار طريقة الدفع */}
                <div className="pt-4">
                  <h3 className="text-lg font-semibold mb-3 text-[#333333] dark:text-[#f0f0f0]">
                    طريقة الدفع *
                  </h3>
                  <div className="space-y-3">
                    {/* Paymob */}
                    <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-[#1a0a0a]"
                      style={{
                        borderColor: paymentMethod === "paymob" ? "var(--color-primary)" : "#e5e7eb",
                        backgroundColor: paymentMethod === "paymob" ? "rgba(230, 0, 0, 0.05)" : "transparent"
                      }}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="paymob"
                        checked={paymentMethod === "paymob"}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-[#333333] dark:text-[#f0f0f0]">
                          Paymob (بطاقات مصرية)
                        </p>
                        <p className="text-sm text-[#666666] dark:text-[#aaaaaa]">
                          الدفع ببطاقات الفيزا والماستركارد المصرية
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <img src="https://accept.paymob.com/portal2/media/images/Visa.svg" alt="Visa" className="h-8" />
                        <img src="https://accept.paymob.com/portal2/media/images/Mastercard.svg" alt="Mastercard" className="h-8" />
                      </div>
                    </label>

                    {/* Stripe */}
                    <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-[#1a0a0a]"
                      style={{
                        borderColor: paymentMethod === "stripe" ? "var(--color-primary)" : "#e5e7eb",
                        backgroundColor: paymentMethod === "stripe" ? "rgba(230, 0, 0, 0.05)" : "transparent"
                      }}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="stripe"
                        checked={paymentMethod === "stripe"}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-[#333333] dark:text-[#f0f0f0]">
                          Stripe (بطاقات دولية)
                        </p>
                        <p className="text-sm text-[#666666] dark:text-[#aaaaaa]">
                          الدفع بالبطاقات الدولية من جميع أنحاء العالم
                        </p>
                      </div>
                      <svg className="h-8" viewBox="0 0 60 25" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#635BFF" d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 01-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V5.57h3.76l.08 1.02a4.7 4.7 0 013.23-1.29c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 7.6-5.65 7.6zM40 8.95c-.95 0-1.54.34-1.97.81l.02 6.12c.4.44.98.78 1.95.78 1.52 0 2.54-1.65 2.54-3.87 0-2.15-1.04-3.84-2.54-3.84zM28.24 5.57h4.13v14.44h-4.13V5.57zm0-4.7L32.37 0v3.36l-4.13.88V.88zm-4.32 9.35v9.79H19.8V5.57h3.7l.12 1.22c1-1.77 3.07-1.41 3.62-1.22v3.79c-.52-.17-2.29-.43-3.32.86zm-8.55 4.72c0 2.43 2.6 1.68 3.12 1.46v3.36c-.55.3-1.54.54-2.89.54a4.15 4.15 0 01-4.27-4.24l.01-13.17 4.02-.86v3.54h3.14V9.1h-3.13v5.85zm-4.91.7c0 2.97-2.31 4.66-5.73 4.66a11.2 11.2 0 01-4.46-.93v-3.93c1.38.75 3.1 1.31 4.46 1.31.92 0 1.53-.24 1.53-1C6.26 13.77 0 14.51 0 9.95 0 7.04 2.28 5.3 5.62 5.3c1.36 0 2.72.2 4.09.75v3.88a9.23 9.23 0 00-4.1-1.06c-.86 0-1.44.25-1.44.9 0 1.85 6.29.97 6.29 5.88z"/>
                      </svg>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-6 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                  style={{
                    backgroundColor: loading ? "#cccccc" : "var(--color-primary)",
                    color: "var(--color-button-text)",
                  }}
                >
                  {loading ? "جاري المعالجة..." : `متابعة للدفع - ${totalAmount.toFixed(2)} جنيه`}
                </button>
              </form>
            </div>
          </div>

          {/* ملخص الطلب */}
          <div className="bg-white dark:bg-[#2d1616] p-6 rounded-lg shadow-md h-fit">
            <h2 className="text-xl font-bold mb-4 text-[#333333] dark:text-[#f0f0f0]">
              ملخص الطلب
            </h2>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.cartItemId} className="flex gap-4 border-b border-gray-200 dark:border-gray-700 pb-4">
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-[#1a0a0a] flex-shrink-0">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <span className="text-2xl">📦</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#333333] dark:text-[#f0f0f0]">
                      {item.title}
                    </h3>
                    <div className="text-sm text-[#666666] dark:text-[#aaaaaa] space-y-1">
                      {item.size && <p>المقاس: {item.size}</p>}
                      {item.color && <p>اللون: {item.color}</p>}
                      <p>الكمية: {item.quantity}</p>
                    </div>
                    <p className="font-bold mt-1" style={{ color: "var(--color-price)" }}>
                      {(item.quantity * item.price).toFixed(2)} جنيه
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
              <div className="flex justify-between text-[#666666] dark:text-[#aaaaaa]">
                <span>المجموع الفرعي:</span>
                <span className="font-semibold">{totalAmount.toFixed(2)} جنيه</span>
              </div>
              <div className="flex justify-between text-[#666666] dark:text-[#aaaaaa]">
                <span>الشحن:</span>
                <span className="font-semibold">مجاني</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-200 dark:border-gray-700 text-[#333333] dark:text-[#f0f0f0]">
                <span>الإجمالي:</span>
                <span style={{ color: "var(--color-price)" }}>
                  {totalAmount.toFixed(2)} جنيه
                </span>
              </div>
            </div>

            {/* أمان المعاملات */}
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-start gap-2 text-green-800 dark:text-green-400">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div className="text-sm">
                  <p className="font-semibold">معاملات آمنة ومشفرة</p>
                  <p className="text-xs mt-1 text-green-700 dark:text-green-500">
                    جميع المعاملات محمية بأعلى معايير الأمان
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
