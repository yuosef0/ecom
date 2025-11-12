// src/app/cart/page.tsx
"use client";

import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import Link from "next/link";
import { useState } from "react";
import TopBar from "../../components/TopBar";
import Footer from "../../components/Footer";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, totalPrice } = useCart();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Coupon states
  const [couponCode, setCouponCode] = useState("");
  const [couponValidating, setCouponValidating] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    message: string;
  } | null>(null);
  const [couponError, setCouponError] = useState("");

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!customerInfo.name.trim()) {
      newErrors.name = "الاسم مطلوب";
    }
    if (!customerInfo.email.trim()) {
      newErrors.email = "البريد الإلكتروني مطلوب";
    } else if (!/\S+@\S+\.\S+/.test(customerInfo.email)) {
      newErrors.email = "البريد الإلكتروني غير صالح";
    }
    if (!customerInfo.address.trim()) {
      newErrors.address = "العنوان مطلوب";
    }
    if (!customerInfo.city.trim()) {
      newErrors.city = "المدينة مطلوبة";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // التحقق من الكوبون
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("الرجاء إدخال كود الكوبون");
      return;
    }

    setCouponValidating(true);
    setCouponError("");

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode.trim().toUpperCase(),
          total: totalPrice,
        }),
      });

      const data = await response.json();

      if (data.valid) {
        setAppliedCoupon({
          code: couponCode.trim().toUpperCase(),
          discount: data.discount,
          message: data.message,
        });
        setCouponError("");
      } else {
        setCouponError(data.message || "الكوبون غير صالح");
        setAppliedCoupon(null);
      }
    } catch (error) {
      console.error("خطأ في التحقق من الكوبون:", error);
      setCouponError("حدث خطأ في التحقق من الكوبون");
      setAppliedCoupon(null);
    } finally {
      setCouponValidating(false);
    }
  };

  // إلغاء الكوبون
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  // حساب الشحن
  const shippingCost = 30;

  // حساب المجموع النهائي
  const subtotal = totalPrice;
  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  const finalTotal = Math.max(subtotal + shippingCost - discount, 0);

  const handleCheckout = async () => {
    if (!validateForm()) {
      alert("يرجى إكمال جميع الحقول المطلوبة");
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: cart,
          customerInfo,
          coupon: appliedCoupon
            ? {
                code: appliedCoupon.code,
                discount: appliedCoupon.discount,
              }
            : null,
        }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        // توجيه المستخدم إلى صفحة الدفع في Stripe
        window.location.href = data.url;
      } else {
        alert(data.error || "حدث خطأ في معالجة الطلب");
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("خطأ في الاتصال:", error);
      alert("حدث خطأ في الاتصال، يرجى المحاولة مرة أخرى");
      setIsProcessing(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomerInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
    // إزالة رسالة الخطأ عند الكتابة
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  if (cart.length === 0) {
    return (
      <div className="relative flex w-full flex-col min-h-screen bg-[#f8f5f5] dark:bg-[#230f0f]">
        <TopBar />

        <header className="bg-white dark:bg-[#2d1616] sticky top-0 z-40 shadow-sm">
          <div className="container mx-auto px-4 md:px-8 lg:px-16 py-4">
            <div className="flex items-center justify-center">
              <Link href="/" className="text-2xl md:text-3xl font-bold tracking-tight">
                متجري
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#333333] dark:text-[#f0f0f0] mb-2">
              السلة فارغة
            </h1>
            <p className="text-[#666666] dark:text-[#aaaaaa] mb-6">
              لم تقم بإضافة أي منتجات بعد
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center h-12 px-6 bg-[#e60000] text-white font-bold rounded-lg hover:bg-[#cc0000] transition-colors"
            >
              تصفح المنتجات
            </Link>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="relative flex w-full flex-col min-h-screen bg-[#f8f5f5] dark:bg-[#230f0f]">
      <TopBar />

      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 dark:bg-[#2d1616]/80 backdrop-blur-sm border-b border-[#e5e7eb] dark:border-[#4a4a4a]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4 text-[#e60000]">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <Link href="/" className="text-xl font-bold leading-tight tracking-tight text-[#333333] dark:text-[#f0f0f0]">
                متجري
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 py-8 lg:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Title */}
          <div className="flex flex-wrap justify-between gap-4 mb-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tight text-[#333333] dark:text-[#f0f0f0]">
                سلة التسوق الخاصة بك
              </h1>
              <p className="text-base font-normal leading-normal text-[#666666] dark:text-[#aaaaaa]">
                لديك {cart.length} {cart.length === 1 ? "منتج" : "منتجات"} في سلتك
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-8 space-y-8">
              {/* Products Table */}
              <div className="bg-white dark:bg-[#2d1616] rounded-xl shadow-sm overflow-hidden">
                {/* Table Header - Desktop only */}
                <div className="hidden md:flex items-center justify-between p-4 border-b border-[#e5e7eb] dark:border-[#4a4a4a]">
                  <div className="w-3/5">
                    <p className="text-sm font-semibold text-[#666666] dark:text-[#aaaaaa]">المنتج</p>
                  </div>
                  <div className="w-1/5 text-center">
                    <p className="text-sm font-semibold text-[#666666] dark:text-[#aaaaaa]">الكمية</p>
                  </div>
                  <div className="w-1/5 text-left">
                    <p className="text-sm font-semibold text-[#666666] dark:text-[#aaaaaa]">الإجمالي</p>
                  </div>
                  <div className="w-auto"></div>
                </div>

                {/* Cart Items */}
                <div className="divide-y divide-[#e5e7eb] dark:divide-[#4a4a4a]">
                  {cart.map((item) => (
                    <div
                      key={item.cartItemId}
                      className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4"
                    >
                      {/* Product Info */}
                      <div className="flex items-center gap-4 w-full md:w-3/5">
                        <div className="bg-[#f5f5f5] dark:bg-[#281313] rounded-lg size-20 shrink-0 overflow-hidden">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl">
                              📦
                            </div>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col justify-center">
                          <p className="text-base font-semibold leading-normal text-[#333333] dark:text-[#f0f0f0]">
                            {item.title}
                          </p>
                          <p className="text-sm font-normal leading-normal text-[#666666] dark:text-[#aaaaaa]">
                            السعر: {item.price.toFixed(2)} ريال
                          </p>
                          {(item.size || item.color) && (
                            <p className="text-sm font-normal leading-normal text-[#666666] dark:text-[#aaaaaa]">
                              {item.size && `المقاس: ${item.size}`}
                              {item.size && item.color && ", "}
                              {item.color && `اللون: ${item.color}`}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Quantity Control */}
                      <div className="w-full md:w-1/5 shrink-0 flex justify-start md:justify-center">
                        <div className="flex items-center gap-2 text-[#333333] dark:text-[#f0f0f0] border border-[#e5e7eb] dark:border-[#4a4a4a] rounded-full p-1">
                          <button
                            onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                            className="text-lg font-medium leading-normal flex h-7 w-7 items-center justify-center rounded-full hover:bg-[#e60000]/10 cursor-pointer transition-colors"
                          >
                            -
                          </button>
                          <span className="text-base font-medium leading-normal w-4 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                            className="text-lg font-medium leading-normal flex h-7 w-7 items-center justify-center rounded-full hover:bg-[#e60000]/10 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Total Price */}
                      <div className="w-full md:w-1/5 text-left font-semibold text-[#333333] dark:text-[#f0f0f0]">
                        {(item.price * item.quantity).toFixed(2)} ريال
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => removeFromCart(item.cartItemId)}
                        className="text-[#666666] dark:text-[#aaaaaa] hover:text-[#dc3545] transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Information Form */}
              <div className="bg-white dark:bg-[#2d1616] p-6 rounded-xl shadow-sm">
                <h3 className="text-xl font-bold text-[#333333] dark:text-[#f0f0f0] mb-4">
                  معلومات الشحن
                </h3>
                <p className="text-[#666666] dark:text-[#aaaaaa] mb-6">
                  أين تود استلام طلبك؟
                </p>
                <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-sm font-medium text-[#666666] dark:text-[#aaaaaa] mb-1"
                      htmlFor="name"
                    >
                      الاسم الكامل <span className="text-[#dc3545]">*</span>
                    </label>
                    <input
                      className={`w-full rounded-lg border ${
                        errors.name
                          ? "border-[#dc3545]"
                          : "border-[#e5e7eb] dark:border-[#4a4a4a]"
                      } bg-[#f8f5f5] dark:bg-[#230f0f] text-[#333333] dark:text-[#f0f0f0] px-4 py-2 focus:ring-2 focus:ring-[#e60000] focus:border-[#e60000] focus:outline-none`}
                      id="name"
                      name="name"
                      type="text"
                      value={customerInfo.name}
                      onChange={handleInputChange}
                      placeholder="أدخل اسمك الكامل"
                    />
                    {errors.name && (
                      <p className="text-[#dc3545] text-xs mt-1">{errors.name}</p>
                    )}
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium text-[#666666] dark:text-[#aaaaaa] mb-1"
                      htmlFor="phone"
                    >
                      رقم الجوال
                    </label>
                    <input
                      className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#4a4a4a] bg-[#f8f5f5] dark:bg-[#230f0f] text-[#333333] dark:text-[#f0f0f0] px-4 py-2 focus:ring-2 focus:ring-[#e60000] focus:border-[#e60000] focus:outline-none"
                      id="phone"
                      name="phone"
                      type="tel"
                      value={customerInfo.phone}
                      onChange={handleInputChange}
                      placeholder="+966 5X XXX XXXX"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label
                      className="block text-sm font-medium text-[#666666] dark:text-[#aaaaaa] mb-1"
                      htmlFor="email"
                    >
                      البريد الإلكتروني <span className="text-[#dc3545]">*</span>
                    </label>
                    <input
                      className={`w-full rounded-lg border ${
                        errors.email
                          ? "border-[#dc3545]"
                          : "border-[#e5e7eb] dark:border-[#4a4a4a]"
                      } bg-[#f8f5f5] dark:bg-[#230f0f] text-[#333333] dark:text-[#f0f0f0] px-4 py-2 focus:ring-2 focus:ring-[#e60000] focus:border-[#e60000] focus:outline-none`}
                      id="email"
                      name="email"
                      type="email"
                      value={customerInfo.email}
                      onChange={handleInputChange}
                      placeholder="example@email.com"
                    />
                    {errors.email && (
                      <p className="text-[#dc3545] text-xs mt-1">{errors.email}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label
                      className="block text-sm font-medium text-[#666666] dark:text-[#aaaaaa] mb-1"
                      htmlFor="address"
                    >
                      العنوان بالتفصيل <span className="text-[#dc3545]">*</span>
                    </label>
                    <input
                      className={`w-full rounded-lg border ${
                        errors.address
                          ? "border-[#dc3545]"
                          : "border-[#e5e7eb] dark:border-[#4a4a4a]"
                      } bg-[#f8f5f5] dark:bg-[#230f0f] text-[#333333] dark:text-[#f0f0f0] px-4 py-2 focus:ring-2 focus:ring-[#e60000] focus:border-[#e60000] focus:outline-none`}
                      id="address"
                      name="address"
                      type="text"
                      value={customerInfo.address}
                      onChange={handleInputChange}
                      placeholder="الشارع، رقم المنزل، الحي"
                    />
                    {errors.address && (
                      <p className="text-[#dc3545] text-xs mt-1">{errors.address}</p>
                    )}
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium text-[#666666] dark:text-[#aaaaaa] mb-1"
                      htmlFor="city"
                    >
                      المدينة <span className="text-[#dc3545]">*</span>
                    </label>
                    <input
                      className={`w-full rounded-lg border ${
                        errors.city
                          ? "border-[#dc3545]"
                          : "border-[#e5e7eb] dark:border-[#4a4a4a]"
                      } bg-[#f8f5f5] dark:bg-[#230f0f] text-[#333333] dark:text-[#f0f0f0] px-4 py-2 focus:ring-2 focus:ring-[#e60000] focus:border-[#e60000] focus:outline-none`}
                      id="city"
                      name="city"
                      type="text"
                      value={customerInfo.city}
                      onChange={handleInputChange}
                      placeholder="الرياض، جدة، الدمام، إلخ"
                    />
                    {errors.city && (
                      <p className="text-[#dc3545] text-xs mt-1">{errors.city}</p>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <aside className="lg:col-span-4">
              <div className="sticky top-24 bg-white dark:bg-[#2d1616] rounded-xl shadow-sm p-6">
                <h3 className="text-xl font-bold text-[#333333] dark:text-[#f0f0f0] mb-4">
                  ملخص الطلب
                </h3>

                {/* Price Summary */}
                <div className="space-y-3 text-[#666666] dark:text-[#aaaaaa]">
                  <div className="flex justify-between">
                    <span>المجموع الفرعي</span>
                    <span className="font-medium text-[#333333] dark:text-[#f0f0f0]">
                      {subtotal.toFixed(2)} ريال
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>رسوم الشحن</span>
                    <span className="font-medium text-[#333333] dark:text-[#f0f0f0]">
                      {shippingCost.toFixed(2)} ريال
                    </span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-[#28a745]">
                      <span>الخصم ({appliedCoupon.code})</span>
                      <span className="font-medium">-{appliedCoupon.discount.toFixed(2)} ريال</span>
                    </div>
                  )}
                </div>

                <hr className="my-4 border-[#e5e7eb] dark:border-[#4a4a4a]" />

                <div className="flex justify-between items-center text-lg font-bold text-[#333333] dark:text-[#f0f0f0]">
                  <span>الإجمالي</span>
                  <span>{finalTotal.toFixed(2)} ريال</span>
                </div>

                {/* Coupon Section */}
                <div className="mt-6">
                  <h4 className="font-semibold text-[#333333] dark:text-[#f0f0f0] mb-2">
                    لديك كوبون خصم؟
                  </h4>
                  {!appliedCoupon ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          className="flex-grow w-full rounded-lg border border-[#e5e7eb] dark:border-[#4a4a4a] bg-[#f8f5f5] dark:bg-[#230f0f] text-[#333333] dark:text-[#f0f0f0] px-3 py-2 focus:ring-2 focus:ring-[#e60000] focus:border-[#e60000] focus:outline-none uppercase"
                          placeholder="أدخل رمز الكوبون هنا"
                          type="text"
                          value={couponCode}
                          onChange={(e) => {
                            setCouponCode(e.target.value.toUpperCase());
                            setCouponError("");
                          }}
                        />
                        <button
                          onClick={handleApplyCoupon}
                          disabled={couponValidating || !couponCode.trim()}
                          className="px-5 py-2.5 rounded-lg bg-[#e60000]/20 text-[#e60000] hover:bg-[#e60000]/30 font-bold transition-colors disabled:opacity-50"
                        >
                          {couponValidating ? "..." : "تطبيق"}
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-sm text-[#dc3545]">{couponError}</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-[#28a745]/10 border border-[#28a745]/20 rounded-lg">
                        <div>
                          <p className="font-semibold text-[#28a745]">{appliedCoupon.code}</p>
                          <p className="text-sm text-[#28a745]">
                            خصم {appliedCoupon.discount.toFixed(2)} ريال
                          </p>
                        </div>
                        <button
                          onClick={handleRemoveCoupon}
                          className="text-[#dc3545] hover:text-[#c82333] text-sm font-medium transition-colors"
                        >
                          إلغاء
                        </button>
                      </div>
                      <p className="text-sm text-[#28a745]">✓ تم تطبيق الكوبون بنجاح!</p>
                    </div>
                  )}
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="mt-8 w-full bg-[#e60000] text-white font-bold py-3 rounded-lg hover:bg-[#cc0000] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e60000] dark:focus:ring-offset-[#230f0f] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing
                    ? "جارٍ التحويل للدفع..."
                    : "إتمام عملية الشراء عبر Stripe"}
                </button>

                <Link
                  href="/"
                  className="block text-center text-[#e60000] hover:underline mt-4 font-medium"
                >
                  متابعة التسوق
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
