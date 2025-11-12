"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Footer from "../../components/Footer";

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_address: string;
  customer_city: string;
  total_amount: number;
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
  payment_status: string;
  order_status: string;
  items: any[];
  created_at: string;
  updated_at: string;
}

export default function OrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_email", user.email)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("خطأ في جلب الطلبات:", error);
        throw error;
      }
      setOrders(data || []);
    } catch (error: any) {
      console.error("خطأ في جلب الطلبات:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string, type: "payment" | "order") => {
    if (type === "payment") {
      switch (status) {
        case "paid":
          return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
        case "pending":
          return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
        case "failed":
          return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
        case "refunded":
          return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
        default:
          return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
      }
    } else {
      switch (status) {
        case "delivered":
          return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
        case "shipped":
          return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
        case "processing":
          return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
        case "cancelled":
          return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
        default:
          return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
      }
    }
  };

  const translateStatus = (status: string, type: "payment" | "order") => {
    if (type === "payment") {
      const translations: { [key: string]: string } = {
        paid: "مدفوع",
        pending: "قيد الانتظار",
        failed: "فشل",
        refunded: "مسترجع",
      };
      return translations[status] || status;
    } else {
      const translations: { [key: string]: string } = {
        processing: "قيد المعالجة",
        shipped: "تم الشحن",
        delivered: "تم التوصيل",
        cancelled: "ملغي",
      };
      return translations[status] || status;
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a1a1a] text-[#333333] dark:text-[#f0f0f0]">
      <main className="container mx-auto px-4 md:px-8 lg:px-16 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">طلباتي</h1>
          <p className="text-[#666666] dark:text-[#aaaaaa]">
            تتبع طلباتك وتحقق من حالتها
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#e60000] border-t-transparent"></div>
            <p className="mt-4 text-[#666666] dark:text-[#aaaaaa]">
              جاري تحميل الطلبات...
            </p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <svg
              className="w-24 h-24 mx-auto mb-4 text-[#666666] dark:text-[#aaaaaa]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <p className="text-xl font-medium mb-2">لا توجد طلبات بعد</p>
            <p className="text-[#666666] dark:text-[#aaaaaa] mb-6">
              ابدأ التسوق الآن واطلب منتجاتك المفضلة
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-[#e60000] text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
              تصفح المنتجات
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Orders List */}
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-[#f5f5f5] dark:bg-[#2d1616] rounded-lg p-6 border border-[#e5e7eb] dark:border-[#4a4a4a]"
              >
                {/* Order Header */}
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4 pb-4 border-b border-[#e5e7eb] dark:border-[#4a4a4a]">
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-sm text-[#666666] dark:text-[#aaaaaa] mb-1">
                      رقم الطلب
                    </p>
                    <p className="font-mono text-sm font-medium">
                      #{order.id.substring(0, 8)}
                    </p>
                    <p className="text-sm text-[#666666] dark:text-[#aaaaaa] mt-2">
                      {formatDate(order.created_at)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        order.order_status,
                        "order"
                      )}`}
                    >
                      {translateStatus(order.order_status, "order")}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        order.payment_status,
                        "payment"
                      )}`}
                    >
                      {translateStatus(order.payment_status, "payment")}
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-3 mb-4">
                  {order.items.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 bg-white dark:bg-[#1a1a1a] rounded-lg p-3"
                    >
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{item.title}</p>
                        <div className="flex flex-wrap gap-3 mt-1 text-sm text-[#666666] dark:text-[#aaaaaa]">
                          <span>الكمية: {item.quantity}</span>
                          {item.size && <span>المقاس: {item.size}</span>}
                          {item.color && <span>اللون: {item.color}</span>}
                        </div>
                      </div>
                      <p className="font-bold text-[#e60000]">
                        {item.price} جنيه
                      </p>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#e5e7eb] dark:border-[#4a4a4a]">
                  <div className="text-sm text-[#666666] dark:text-[#aaaaaa]">
                    <p>العنوان: {order.customer_address}</p>
                    <p>المدينة: {order.customer_city}</p>
                    {order.customer_phone && (
                      <p>الهاتف: {order.customer_phone}</p>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-[#666666] dark:text-[#aaaaaa] mb-1">
                      المبلغ الإجمالي
                    </p>
                    <p className="text-2xl font-bold text-[#e60000]">
                      {order.total_amount} جنيه
                    </p>
                  </div>
                </div>

                {/* View Details Button */}
                <button
                  onClick={() =>
                    setSelectedOrder(
                      selectedOrder?.id === order.id ? null : order
                    )
                  }
                  className="mt-4 w-full py-2 text-sm text-[#e60000] hover:bg-[#e60000]/10 rounded-lg transition-colors font-medium"
                >
                  {selectedOrder?.id === order.id
                    ? "إخفاء التفاصيل"
                    : "عرض التفاصيل"}
                </button>

                {/* Expanded Details */}
                {selectedOrder?.id === order.id && (
                  <div className="mt-4 pt-4 border-t border-[#e5e7eb] dark:border-[#4a4a4a]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium mb-2">معلومات العميل:</p>
                        <p className="text-[#666666] dark:text-[#aaaaaa]">
                          الاسم: {order.customer_name}
                        </p>
                        <p className="text-[#666666] dark:text-[#aaaaaa]">
                          البريد: {order.customer_email}
                        </p>
                        {order.customer_phone && (
                          <p className="text-[#666666] dark:text-[#aaaaaa]">
                            الهاتف: {order.customer_phone}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="font-medium mb-2">معلومات الدفع:</p>
                        {order.stripe_payment_intent && (
                          <p className="text-[#666666] dark:text-[#aaaaaa] break-all">
                            معرف الدفع:{" "}
                            {order.stripe_payment_intent.substring(0, 20)}...
                          </p>
                        )}
                        <p className="text-[#666666] dark:text-[#aaaaaa]">
                          آخر تحديث: {formatDate(order.updated_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
