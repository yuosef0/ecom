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
    revenueGrowth: "+5.4%",
    ordersGrowth: "+12%",
    productsGrowth: "+2.1%",
    pendingGrowth: "-3%",
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

      // جلب آخر 5 طلبات مع معلومات العميل
      const { data: recent } = await supabase
        .from("orders")
        .select(`
          *,
          profiles:user_id (
            full_name
          )
        `)
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
        revenueGrowth: "+5.4%",
        ordersGrowth: "+12%",
        productsGrowth: "+2.1%",
        pendingGrowth: "-3%",
      });

      setRecentOrders(recent || []);
    } catch (error) {
      console.error("خطأ في جلب الإحصائيات:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return (
          <span className="inline-flex cursor-pointer items-center justify-center rounded-full bg-green-500/20 px-3 py-1 text-sm font-medium text-green-400">
            مكتمل
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex cursor-pointer items-center justify-center rounded-full bg-yellow-500/20 px-3 py-1 text-sm font-medium text-yellow-400">
            قيد التنفيذ
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex cursor-pointer items-center justify-center rounded-full bg-red-500/20 px-3 py-1 text-sm font-medium text-red-400">
            ملغي
          </span>
        );
      default:
        return (
          <span className="inline-flex cursor-pointer items-center justify-center rounded-full bg-blue-500/20 px-3 py-1 text-sm font-medium text-blue-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e60000]"></div>
          </div>
        ) : (
          <>
            {/* Page Heading */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black leading-tight tracking-tight text-white">
                  لوحة التحكم الرئيسية
                </h1>
                <p className="text-base font-normal leading-normal text-[#cc8e8e]">
                  نظرة عامة على أداء متجرك
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-6 py-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col gap-2 rounded-lg border border-[#6a2f2f] p-6">
                <p className="text-base font-medium leading-normal text-white">
                  إجمالي الإيرادات
                </p>
                <p className="text-2xl font-bold leading-tight tracking-light text-white">
                  {stats.totalRevenue.toLocaleString("ar-SA")} ر.س
                </p>
                <p className="text-base font-medium leading-normal text-[#0bda0b]">
                  {stats.revenueGrowth}
                </p>
              </div>

              <div className="flex flex-col gap-2 rounded-lg border border-[#6a2f2f] p-6">
                <p className="text-base font-medium leading-normal text-white">
                  إجمالي الطلبات
                </p>
                <p className="text-2xl font-bold leading-tight tracking-light text-white">
                  {stats.totalOrders.toLocaleString("ar-SA")}
                </p>
                <p className="text-base font-medium leading-normal text-[#0bda0b]">
                  {stats.ordersGrowth}
                </p>
              </div>

              <div className="flex flex-col gap-2 rounded-lg border border-[#6a2f2f] p-6">
                <p className="text-base font-medium leading-normal text-white">
                  إجمالي المنتجات
                </p>
                <p className="text-2xl font-bold leading-tight tracking-light text-white">
                  {stats.totalProducts.toLocaleString("ar-SA")}
                </p>
                <p className="text-base font-medium leading-normal text-[#0bda0b]">
                  {stats.productsGrowth}
                </p>
              </div>

              <div className="flex flex-col gap-2 rounded-lg border border-[#6a2f2f] p-6">
                <p className="text-base font-medium leading-normal text-white">
                  الطلبات المعلقة
                </p>
                <p className="text-2xl font-bold leading-tight tracking-light text-white">
                  {stats.pendingOrders.toLocaleString("ar-SA")}
                </p>
                <p className="text-base font-medium leading-normal text-[#fa3838]">
                  {stats.pendingGrowth}
                </p>
              </div>
            </div>

            {/* Recent Orders Section */}
            <h2 className="px-4 pb-3 pt-5 text-[22px] font-bold leading-tight tracking-tight text-white">
              آخر الطلبات
            </h2>

            {/* Table */}
            <div className="px-4 py-3">
              <div className="overflow-hidden rounded-lg border border-[#6a2f2f] bg-[#231010]">
                {recentOrders.length === 0 ? (
                  <div className="p-8 text-center text-[#cc8e8e]">
                    لا توجد طلبات حالياً
                  </div>
                ) : (
                  <table className="w-full text-right">
                    <thead className="bg-[#351818]">
                      <tr>
                        <th className="px-4 py-3 text-sm font-medium leading-normal text-white">
                          رقم الطلب
                        </th>
                        <th className="px-4 py-3 text-sm font-medium leading-normal text-white">
                          اسم العميل
                        </th>
                        <th className="px-4 py-3 text-sm font-medium leading-normal text-white">
                          المبلغ
                        </th>
                        <th className="px-4 py-3 text-sm font-medium leading-normal text-white">
                          حالة الطلب
                        </th>
                        <th className="px-4 py-3 text-sm font-medium leading-normal text-white">
                          التاريخ
                        </th>
                        <th className="px-4 py-3 text-sm font-medium leading-normal text-[#cc8e8e]">
                          إجراءات
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order) => (
                        <tr key={order.id} className="border-t border-t-[#6a2f2f]">
                          <td className="h-[72px] px-4 py-2 text-sm font-normal leading-normal text-[#cc8e8e]">
                            #{order.id.slice(0, 8)}
                          </td>
                          <td className="h-[72px] px-4 py-2 text-sm font-normal leading-normal text-white">
                            {order.profiles?.full_name || order.customer_name || "عميل"}
                          </td>
                          <td className="h-[72px] px-4 py-2 text-sm font-normal leading-normal text-[#cc8e8e]">
                            {order.total_amount.toFixed(0)} ر.س
                          </td>
                          <td className="h-[72px] px-4 py-2 text-sm font-normal leading-normal">
                            {getStatusBadge(order.order_status)}
                          </td>
                          <td className="h-[72px] px-4 py-2 text-sm font-normal leading-normal text-[#cc8e8e]">
                            {formatDate(order.created_at)}
                          </td>
                          <td className="h-[72px] px-4 py-2">
                            <Link
                              href={`/admin/orders`}
                              className="text-sm font-bold leading-normal tracking-[0.015em] text-[#cc8e8e] hover:text-white transition-colors"
                            >
                              عرض التفاصيل
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
