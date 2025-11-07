"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import Link from "next/link";

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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);

  // جلب الطلبات
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("خطأ في جلب الطلبات:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // تحديث حالة الطلب
  const updateOrderStatus = async (
    orderId: string,
    field: "order_status" | "payment_status",
    value: string
  ) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) throw new Error("فشل في تحديث الطلب");

      fetchOrders();
      if (selectedOrder?.id === orderId) {
        const updated = await response.json();
        setSelectedOrder(updated);
      }
    } catch (error: any) {
      console.error("خطأ في تحديث الطلب:", error);
      alert("فشل في تحديث الطلب");
    } finally {
      setUpdating(false);
    }
  };

  // حذف طلب
  const deleteOrder = async (orderId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الطلب؟")) return;

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("فشل في حذف الطلب");

      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
      alert("تم حذف الطلب بنجاح");
    } catch (error: any) {
      console.error("خطأ في حذف الطلب:", error);
      alert("فشل في حذف الطلب");
    }
  };

  // دالة لتنسيق التاريخ
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // دالة لتحديد لون الحالة
  const getStatusColor = (status: string, type: "payment" | "order") => {
    if (type === "payment") {
      switch (status) {
        case "paid":
          return "bg-green-100 text-green-800";
        case "pending":
          return "bg-yellow-100 text-yellow-800";
        case "failed":
          return "bg-red-100 text-red-800";
        case "refunded":
          return "bg-gray-100 text-gray-800";
        default:
          return "bg-gray-100 text-gray-800";
      }
    } else {
      switch (status) {
        case "delivered":
          return "bg-green-100 text-green-800";
        case "shipped":
          return "bg-blue-100 text-blue-800";
        case "processing":
          return "bg-yellow-100 text-yellow-800";
        case "cancelled":
          return "bg-red-100 text-red-800";
        default:
          return "bg-gray-100 text-gray-800";
      }
    }
  };

  // دالة لترجمة الحالات
  const translateStatus = (status: string, type: "payment" | "order") => {
    if (type === "payment") {
      const translations: { [key: string]: string } = {
        paid: "مدفوع",
        pending: "قيد الانتظار",
        failed: "فشل",
        refunded: "مسترد",
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

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-blue-600 hover:text-blue-700">
                ← العودة للمتجر
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                📋 إدارة الطلبات
              </h1>
            </div>
            <div className="flex gap-2">
              <Link
                href="/admin/products"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                إدارة المنتجات
              </Link>
              <Link
                href="/admin"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                لوحة التحكم
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">إجمالي الطلبات</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {orders.length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">قيد المعالجة</div>
            <div className="text-3xl font-bold text-yellow-600 mt-2">
              {orders.filter((o) => o.order_status === "processing").length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">تم الشحن</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">
              {orders.filter((o) => o.order_status === "shipped").length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">مكتمل</div>
            <div className="text-3xl font-bold text-green-600 mt-2">
              {orders.filter((o) => o.order_status === "delivered").length}
            </div>
          </div>
        </div>

        {/* جدول الطلبات */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-2 text-gray-600">جارٍ التحميل...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              لا توجد طلبات حالياً
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      رقم الطلب
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      العميل
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      المبلغ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      حالة الدفع
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      حالة الطلب
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      التاريخ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-mono text-gray-600">
                        #{order.id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {order.customer_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.customer_email}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {order.total_amount.toFixed(2)} ج.م
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                            order.payment_status,
                            "payment"
                          )}`}
                        >
                          {translateStatus(order.payment_status, "payment")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={order.order_status}
                          onChange={(e) =>
                            updateOrderStatus(
                              order.id,
                              "order_status",
                              e.target.value
                            )
                          }
                          disabled={updating}
                          className={`px-2 py-1 text-xs rounded-full border-0 ${getStatusColor(
                            order.order_status,
                            "order"
                          )}`}
                        >
                          <option value="processing">قيد المعالجة</option>
                          <option value="shipped">تم الشحن</option>
                          <option value="delivered">تم التوصيل</option>
                          <option value="cancelled">ملغي</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            👁️ عرض
                          </button>
                          <button
                            onClick={() => deleteOrder(order.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal تفاصيل الطلب */}
      {selectedOrder && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold">تفاصيل الطلب</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* معلومات العميل */}
              <div>
                <h3 className="text-lg font-semibold mb-3">معلومات العميل</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p>
                    <strong>الاسم:</strong> {selectedOrder.customer_name}
                  </p>
                  <p>
                    <strong>البريد الإلكتروني:</strong>{" "}
                    {selectedOrder.customer_email}
                  </p>
                  {selectedOrder.customer_phone && (
                    <p>
                      <strong>الهاتف:</strong> {selectedOrder.customer_phone}
                    </p>
                  )}
                  <p>
                    <strong>العنوان:</strong> {selectedOrder.customer_address},{" "}
                    {selectedOrder.customer_city}
                  </p>
                </div>
              </div>

              {/* المنتجات */}
              <div>
                <h3 className="text-lg font-semibold mb-3">المنتجات</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 bg-gray-50 rounded-lg p-4"
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
                        <p className="text-sm text-gray-600">
                          الكمية: {item.quantity}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">
                          {(item.price * item.quantity).toFixed(2)} ج.م
                        </p>
                        <p className="text-sm text-gray-600">
                          {item.price.toFixed(2)} ج.م × {item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* الملخص */}
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>الإجمالي:</span>
                  <span className="text-blue-600">
                    {selectedOrder.total_amount.toFixed(2)} ج.م
                  </span>
                </div>
              </div>

              {/* معلومات الدفع */}
              {selectedOrder.stripe_session_id && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">معلومات الدفع</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                    <p>
                      <strong>Session ID:</strong>{" "}
                      <code className="bg-white px-2 py-1 rounded">
                        {selectedOrder.stripe_session_id}
                      </code>
                    </p>
                    {selectedOrder.stripe_payment_intent && (
                      <p>
                        <strong>Payment Intent:</strong>{" "}
                        <code className="bg-white px-2 py-1 rounded">
                          {selectedOrder.stripe_payment_intent}
                        </code>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
