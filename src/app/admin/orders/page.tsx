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
  const [searchQuery, setSearchQuery] = useState("");

  // جلب الطلبات
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("خطأ Supabase:", error);
        throw error;
      }
      setOrders(data || []);
    } catch (error: any) {
      console.error("خطأ في جلب الطلبات:", error);
      console.error("Error details:", error.message, error.code, error.details);
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
      const { data, error } = await supabase
        .from("orders")
        .update({ [field]: value })
        .eq("id", orderId)
        .select()
        .single();

      if (error) throw error;

      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(data);
      }
    } catch (error: any) {
      console.error("خطأ في تحديث الطلب:", error);
      alert("فشل في تحديث الطلب: " + error.message);
    } finally {
      setUpdating(false);
    }
  };

  // حذف طلب
  const deleteOrder = async (orderId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الطلب؟")) return;

    try {
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);

      if (error) throw error;

      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
      alert("تم حذف الطلب بنجاح");
    } catch (error: any) {
      console.error("خطأ في حذف الطلب:", error);
      alert("فشل في حذف الطلب: " + error.message);
    }
  };

  // دالة لتنسيق التاريخ
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // دالة لتحديد لون الحالة
  const getStatusColor = (status: string, type: "payment" | "order") => {
    if (type === "payment") {
      switch (status) {
        case "paid":
          return "bg-green-500/20 text-green-400";
        case "pending":
          return "bg-yellow-500/20 text-yellow-400";
        case "failed":
          return "bg-red-500/20 text-red-400";
        case "refunded":
          return "bg-gray-500/20 text-gray-400";
        default:
          return "bg-gray-500/20 text-gray-400";
      }
    } else {
      switch (status) {
        case "delivered":
          return "bg-green-500/20 text-green-400";
        case "shipped":
          return "bg-blue-500/20 text-blue-400";
        case "processing":
          return "bg-yellow-500/20 text-yellow-400";
        case "cancelled":
          return "bg-gray-500/20 text-gray-400";
        default:
          return "bg-gray-500/20 text-gray-400";
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
        refunded: "مسترجع",
      };
      return translations[status] || status;
    } else {
      const translations: { [key: string]: string } = {
        processing: "قيد المعالجة",
        shipped: "تم الشحن",
        delivered: "مكتمل",
        cancelled: "ملغي",
      };
      return translations[status] || status;
    }
  };

  // فلترة الطلبات بناءً على البحث
  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.id.toLowerCase().includes(query) ||
      order.customer_name.toLowerCase().includes(query) ||
      order.customer_email.toLowerCase().includes(query)
    );
  });

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        {/* Page Heading */}
        <header className="mb-6">
          <h1 className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-tight">
            إدارة الطلبات
          </h1>
        </header>

        {/* Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="flex flex-col gap-2 rounded-lg p-6 bg-white dark:bg-[#182635] border border-slate-200 dark:border-slate-800">
            <p className="text-slate-600 dark:text-slate-400 text-base font-medium leading-normal">
              إجمالي الطلبات
            </p>
            <p className="text-slate-900 dark:text-white tracking-light text-3xl font-bold leading-tight">
              {orders.length}
            </p>
            <p className="text-green-600 dark:text-green-400 text-sm font-medium leading-normal flex items-center gap-1">
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
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
              <span>5.2%</span>
            </p>
          </div>

          <div className="flex flex-col gap-2 rounded-lg p-6 bg-white dark:bg-[#182635] border border-slate-200 dark:border-slate-800">
            <p className="text-slate-600 dark:text-slate-400 text-base font-medium leading-normal">
              طلبات قيد المعالجة
            </p>
            <p className="text-slate-900 dark:text-white tracking-light text-3xl font-bold leading-tight">
              {orders.filter((o) => o.order_status === "processing").length}
            </p>
            <p className="text-green-600 dark:text-green-400 text-sm font-medium leading-normal flex items-center gap-1">
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
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
              <span>1.8%</span>
            </p>
          </div>

          <div className="flex flex-col gap-2 rounded-lg p-6 bg-white dark:bg-[#182635] border border-slate-200 dark:border-slate-800">
            <p className="text-slate-600 dark:text-slate-400 text-base font-medium leading-normal">
              طلبات تم شحنها
            </p>
            <p className="text-slate-900 dark:text-white tracking-light text-3xl font-bold leading-tight">
              {orders.filter((o) => o.order_status === "shipped").length}
            </p>
            <p className="text-red-600 dark:text-red-400 text-sm font-medium leading-normal flex items-center gap-1">
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
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
              <span>0.5%</span>
            </p>
          </div>

          <div className="flex flex-col gap-2 rounded-lg p-6 bg-white dark:bg-[#182635] border border-slate-200 dark:border-slate-800">
            <p className="text-slate-600 dark:text-slate-400 text-base font-medium leading-normal">
              طلبات مكتملة
            </p>
            <p className="text-slate-900 dark:text-white tracking-light text-3xl font-bold leading-tight">
              {orders.filter((o) => o.order_status === "delivered").length}
            </p>
            <p className="text-green-600 dark:text-green-400 text-sm font-medium leading-normal flex items-center gap-1">
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
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
              <span>12.0%</span>
            </p>
          </div>
        </section>

        {/* ToolBar & Table Section */}
        <div className="bg-white dark:bg-[#182635] rounded-xl border border-slate-200 dark:border-slate-800">
          {/* ToolBar */}
          <div className="flex flex-wrap justify-between items-center gap-2 p-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <svg
                  className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  className="w-full h-10 px-4 pr-10 rounded-lg bg-slate-100 dark:bg-slate-900 border-transparent text-slate-900 dark:text-white focus:ring-[#137fec] focus:border-[#137fec] placeholder:text-slate-400"
                  placeholder="بحث..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="flex items-center justify-center w-10 h-10 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
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
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
              </button>
              <button className="flex items-center justify-center w-10 h-10 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>
            <button className="flex items-center justify-center overflow-hidden rounded-lg h-10 bg-[#137fec] text-white gap-2 text-sm font-bold leading-normal tracking-wide min-w-0 px-4 hover:bg-[#137fec]/90 transition-colors">
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="truncate">إضافة طلب جديد</span>
            </button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block w-8 h-8 border-4 border-[#137fec] border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm">
                جارٍ التحميل...
              </p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              {searchQuery ? "لا توجد نتائج للبحث" : "لا توجد طلبات حالياً"}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <th className="px-4 py-3 text-slate-500 dark:text-slate-400 text-sm font-medium">
                        رقم الطلب
                      </th>
                      <th className="px-4 py-3 text-slate-500 dark:text-slate-400 text-sm font-medium">
                        العميل
                      </th>
                      <th className="px-4 py-3 text-slate-500 dark:text-slate-400 text-sm font-medium">
                        المبلغ الإجمالي
                      </th>
                      <th className="px-4 py-3 text-slate-500 dark:text-slate-400 text-sm font-medium">
                        حالة الدفع
                      </th>
                      <th className="px-4 py-3 text-slate-500 dark:text-slate-400 text-sm font-medium">
                        حالة الطلب
                      </th>
                      <th className="px-4 py-3 text-slate-500 dark:text-slate-400 text-sm font-medium">
                        التاريخ
                      </th>
                      <th className="px-4 py-3 text-left text-slate-500 dark:text-slate-400 text-sm font-medium">
                        إجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-t border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                      >
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 text-sm">
                          #{order.id.slice(0, 8)}
                        </td>
                        <td className="px-4 py-3 text-slate-900 dark:text-white font-medium text-sm">
                          {order.customer_name}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 text-sm">
                          {order.total_amount.toFixed(2)} جنيه
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              order.payment_status,
                              "payment"
                            )}`}
                          >
                            {translateStatus(order.payment_status, "payment")}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              order.order_status,
                              "order"
                            )}`}
                          >
                            {translateStatus(order.order_status, "order")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 text-sm">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-4 py-3 text-left">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
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
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            </button>
                            <button className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
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
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => deleteOrder(order.id)}
                              className="text-red-400 hover:text-red-500 transition-colors"
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
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  عرض 1-{filteredOrders.length} من {orders.length} طلب
                </span>
                <div className="flex items-center gap-2">
                  <button className="flex items-center justify-center w-8 h-8 rounded text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-50">
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
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <button className="flex items-center justify-center w-8 h-8 rounded text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200">
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
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </>
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
            className="bg-white dark:bg-[#182635] rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                تفاصيل الطلب
              </h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* معلومات العميل */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                  معلومات العميل
                </h3>
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 space-y-2 text-slate-700 dark:text-slate-300">
                  <p>
                    <strong className="text-slate-900 dark:text-white">الاسم:</strong>{" "}
                    {selectedOrder.customer_name}
                  </p>
                  <p>
                    <strong className="text-slate-900 dark:text-white">
                      البريد الإلكتروني:
                    </strong>{" "}
                    {selectedOrder.customer_email}
                  </p>
                  {selectedOrder.customer_phone && (
                    <p>
                      <strong className="text-slate-900 dark:text-white">
                        الهاتف:
                      </strong>{" "}
                      {selectedOrder.customer_phone}
                    </p>
                  )}
                  <p>
                    <strong className="text-slate-900 dark:text-white">
                      العنوان:
                    </strong>{" "}
                    {selectedOrder.customer_address}, {selectedOrder.customer_city}
                  </p>
                </div>
              </div>

              {/* المنتجات */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                  المنتجات
                </h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4"
                    >
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-white">
                          {item.title}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          الكمية: {item.quantity}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {(item.price * item.quantity).toFixed(2)} جنيه
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {item.price.toFixed(2)} جنيه × {item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* الملخص */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-slate-900 dark:text-white">الإجمالي:</span>
                  <span className="text-[#137fec]">
                    {selectedOrder.total_amount.toFixed(2)} جنيه
                  </span>
                </div>
              </div>

              {/* معلومات الدفع */}
              {selectedOrder.stripe_session_id && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                    معلومات الدفع
                  </h3>
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 space-y-2 text-sm">
                    <p className="text-slate-700 dark:text-slate-300">
                      <strong className="text-slate-900 dark:text-white">
                        Session ID:
                      </strong>{" "}
                      <code className="bg-white dark:bg-slate-800 px-2 py-1 rounded text-slate-700 dark:text-slate-300">
                        {selectedOrder.stripe_session_id}
                      </code>
                    </p>
                    {selectedOrder.stripe_payment_intent && (
                      <p className="text-slate-700 dark:text-slate-300">
                        <strong className="text-slate-900 dark:text-white">
                          Payment Intent:
                        </strong>{" "}
                        <code className="bg-white dark:bg-slate-800 px-2 py-1 rounded text-slate-700 dark:text-slate-300">
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
    </div>
  );
}
