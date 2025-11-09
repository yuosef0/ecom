"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import Link from "next/link";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    lowStockProducts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // جلب إحصائيات المنتجات
      const { data: products } = await supabase.from("products").select("*");

      // جلب إحصائيات الطلبات
      const { data: orders } = await supabase.from("orders").select("*");

      // جلب آخر 5 طلبات
      const { data: recent } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      const totalRevenue =
        orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;

      const lowStock = products?.filter((p) => p.stock < 5).length || 0;

      setStats({
        totalProducts: products?.length || 0,
        totalOrders: orders?.length || 0,
        pendingOrders:
          orders?.filter((o) => o.order_status === "processing").length || 0,
        totalRevenue,
        lowStockProducts: lowStock,
      });

      setRecentOrders(recent || []);
    } catch (error) {
      console.error("خطأ في جلب الإحصائيات:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ar-EG", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">
              ⚙️ لوحة تحكم الإدارة
            </h1>
            <Link
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              العودة للمتجر
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* بطاقات الإحصائيات */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6 border-r-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">إجمالي المنتجات</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {stats.totalProducts}
                    </p>
                  </div>
                  <div className="text-4xl">📦</div>
                </div>
                <Link
                  href="/admin/products"
                  className="text-blue-600 text-sm mt-4 inline-block hover:underline"
                >
                  إدارة المنتجات ←
                </Link>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border-r-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">إجمالي الطلبات</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {stats.totalOrders}
                    </p>
                  </div>
                  <div className="text-4xl">📋</div>
                </div>
                <Link
                  href="/admin/orders"
                  className="text-green-600 text-sm mt-4 inline-block hover:underline"
                >
                  إدارة الطلبات ←
                </Link>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border-r-4 border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">طلبات معلقة</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {stats.pendingOrders}
                    </p>
                  </div>
                  <div className="text-4xl">⏳</div>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  يحتاج إلى معالجة فورية
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border-r-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">إجمالي الإيرادات</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {stats.totalRevenue.toFixed(0)}
                    </p>
                    <p className="text-xs text-gray-500">ج.م</p>
                  </div>
                  <div className="text-4xl">💰</div>
                </div>
              </div>
            </div>

            {/* تنبيه المخزون المنخفض */}
            {stats.lowStockProducts > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="font-semibold text-yellow-800">
                      تحذير: مخزون منخفض
                    </p>
                    <p className="text-sm text-yellow-700">
                      {stats.lowStockProducts} منتج بحاجة إلى إعادة تعبئة (أقل من
                      5 قطع)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* الروابط السريعة */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Link
                href="/admin/products"
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition group"
              >
                <div className="flex items-center gap-4">
                  <div className="text-4xl">📦</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                      إدارة المنتجات
                    </h3>
                    <p className="text-sm text-gray-600">
                      إضافة، تعديل، وحذف المنتجات
                    </p>
                  </div>
                </div>
              </Link>

              <Link
                href="/admin/orders"
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition group"
              >
                <div className="flex items-center gap-4">
                  <div className="text-4xl">📋</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                      إدارة الطلبات
                    </h3>
                    <p className="text-sm text-gray-600">
                      متابعة وتحديث حالة الطلبات
                    </p>
                  </div>
                </div>
              </Link>

              <Link
                href="/admin/slider"
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition group"
              >
                <div className="flex items-center gap-4">
                  <div className="text-4xl">🖼️</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                      إدارة السلايدر
                    </h3>
                    <p className="text-sm text-gray-600">
                      إضافة وتعديل صور السلايدر
                    </p>
                  </div>
                </div>
              </Link>

              <a
                href="https://dashboard.stripe.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition group"
              >
                <div className="flex items-center gap-4">
                  <div className="text-4xl">💳</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                      لوحة Stripe
                    </h3>
                    <p className="text-sm text-gray-600">
                      إدارة المدفوعات والإيرادات
                    </p>
                  </div>
                </div>
              </a>
            </div>

            {/* آخر الطلبات */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold">آخر الطلبات</h2>
                <Link
                  href="/admin/orders"
                  className="text-blue-600 text-sm hover:underline"
                >
                  عرض الكل ←
                </Link>
              </div>

              {recentOrders.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  لا توجد طلبات حالياً
                </div>
              ) : (
                <div className="divide-y">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="p-4 hover:bg-gray-50 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {order.customer_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order.items.length} منتج - {formatDate(order.created_at)}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">
                          {order.total_amount.toFixed(2)} ج.م
                        </p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            order.order_status === "delivered"
                              ? "bg-green-100 text-green-800"
                              : order.order_status === "shipped"
                              ? "bg-blue-100 text-blue-800"
                              : order.order_status === "processing"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {order.order_status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
