"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_purchase_amount: number;
  max_discount_amount: number | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  valid_from: string;
  valid_until: string | null;
  created_at: string;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "expired" | "used">("all");

  // Form states
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: "",
    min_purchase_amount: "0",
    max_discount_amount: "",
    usage_limit: "",
    valid_until: "",
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // جلب الكوبونات
  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error("خطأ في جلب الكوبونات:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  // إضافة أو تحديث كوبون
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.discount_value) {
      setMessage("❌ الكود وقيمة الخصم مطلوبان");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const couponData = {
        code: formData.code.toUpperCase(),
        description: formData.description || null,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        min_purchase_amount: parseFloat(formData.min_purchase_amount),
        max_discount_amount: formData.max_discount_amount
          ? parseFloat(formData.max_discount_amount)
          : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        valid_until: formData.valid_until || null,
        is_active: formData.is_active,
      };

      if (editingCoupon) {
        // تحديث كوبون موجود
        const response = await fetch(`/api/coupons/${editingCoupon.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(couponData),
        });

        if (!response.ok) throw new Error("فشل في تحديث الكوبون");

        setMessage("✅ تم تحديث الكوبون بنجاح!");
        setEditingCoupon(null);
      } else {
        // إضافة كوبون جديد
        const response = await fetch("/api/coupons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(couponData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "فشل في إضافة الكوبون");
        }

        setMessage("✅ تم إضافة الكوبون بنجاح!");
        setIsAddingNew(false);
      }

      // إعادة تعيين النموذج
      setFormData({
        code: "",
        description: "",
        discount_type: "percentage",
        discount_value: "",
        min_purchase_amount: "0",
        max_discount_amount: "",
        usage_limit: "",
        valid_until: "",
        is_active: true,
      });
      fetchCoupons();
    } catch (err: any) {
      console.error(err);
      setMessage("❌ حدث خطأ: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // حذف كوبون
  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`هل أنت متأكد من حذف الكوبون: ${code}؟`)) return;

    try {
      const response = await fetch(`/api/coupons/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("فشل في حذف الكوبون");

      setMessage("✅ تم حذف الكوبون بنجاح!");
      fetchCoupons();
    } catch (error: any) {
      console.error("خطأ في حذف الكوبون:", error);
      setMessage("❌ فشل في حذف الكوبون");
    }
  };

  // بدء التعديل
  const startEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || "",
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      min_purchase_amount: coupon.min_purchase_amount.toString(),
      max_discount_amount: coupon.max_discount_amount?.toString() || "",
      usage_limit: coupon.usage_limit?.toString() || "",
      valid_until: coupon.valid_until
        ? new Date(coupon.valid_until).toISOString().slice(0, 16)
        : "",
      is_active: coupon.is_active,
    });
    setIsAddingNew(false);
    setMessage("");
  };

  // إلغاء التعديل
  const cancelEdit = () => {
    setEditingCoupon(null);
    setIsAddingNew(false);
    setFormData({
      code: "",
      description: "",
      discount_type: "percentage",
      discount_value: "",
      min_purchase_amount: "0",
      max_discount_amount: "",
      usage_limit: "",
      valid_until: "",
      is_active: true,
    });
    setMessage("");
  };

  // تنسيق التاريخ
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "غير محدد";
    return new Date(dateString).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // التحقق من صلاحية الكوبون
  const isExpired = (validUntil: string | null) => {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
  };

  // التحقق من استخدام الكوبون بالكامل
  const isFullyUsed = (coupon: Coupon) => {
    return coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit;
  };

  // فلترة الكوبونات
  const getFilteredCoupons = () => {
    let filtered = coupons;

    // فلترة بالبحث
    if (searchQuery) {
      filtered = filtered.filter((c) =>
        c.code.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // فلترة بالحالة
    switch (filterStatus) {
      case "active":
        filtered = filtered.filter((c) => c.is_active && !isExpired(c.valid_until) && !isFullyUsed(c));
        break;
      case "expired":
        filtered = filtered.filter((c) => isExpired(c.valid_until));
        break;
      case "used":
        filtered = filtered.filter((c) => isFullyUsed(c));
        break;
    }

    return filtered;
  };

  const filteredCoupons = getFilteredCoupons();

  // تحديد حالة الكوبون
  const getCouponStatus = (coupon: Coupon) => {
    if (isExpired(coupon.valid_until)) {
      return {
        label: "منتهي الصلاحية",
        className: "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300",
      };
    }
    if (isFullyUsed(coupon)) {
      return {
        label: "مستخدم بالكامل",
        className: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
      };
    }
    if (coupon.is_active) {
      return {
        label: "نشط",
        className: "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300",
      };
    }
    return {
      label: "غير نشط",
      className: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
    };
  };

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        {/* رسالة النجاح/الخطأ */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.includes("✅")
                ? "bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
            }`}
          >
            {message}
          </div>
        )}

        {/* Page Heading */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <h1 className="text-slate-900 dark:text-white text-3xl font-bold leading-tight tracking-tight">
            إدارة الكوبونات
          </h1>
          {!isAddingNew && !editingCoupon && (
            <button
              onClick={() => setIsAddingNew(true)}
              className="flex min-w-[84px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg h-11 px-6 bg-[#137fec] text-white text-sm font-bold leading-normal tracking-wide hover:bg-[#137fec]/90 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="truncate">إضافة كوبون جديد</span>
            </button>
          )}
        </div>

        {/* نموذج إضافة/تعديل كوبون */}
        {(isAddingNew || editingCoupon) && (
          <div className="bg-white dark:bg-[#182635] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              {editingCoupon ? "تعديل الكوبون" : "إضافة كوبون جديد"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    كود الكوبون *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    required
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#137fec] uppercase"
                    placeholder="SAVE10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    نوع الخصم *
                  </label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_type: e.target.value as "percentage" | "fixed",
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#137fec]"
                  >
                    <option value="percentage">نسبة مئوية (%)</option>
                    <option value="fixed">قيمة ثابتة (ر.س)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  الوصف
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#137fec]"
                  placeholder="وصف الكوبون..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    قيمة الخصم * ({formData.discount_type === "percentage" ? "%" : "ر.س"})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.discount_value}
                    onChange={(e) =>
                      setFormData({ ...formData, discount_value: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#137fec]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    الحد الأدنى للشراء (ر.س)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.min_purchase_amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        min_purchase_amount: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#137fec]"
                  />
                </div>

                {formData.discount_type === "percentage" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      الحد الأقصى للخصم (ر.س)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.max_discount_amount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          max_discount_amount: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#137fec]"
                      placeholder="اختياري"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    عدد مرات الاستخدام
                  </label>
                  <input
                    type="number"
                    value={formData.usage_limit}
                    onChange={(e) =>
                      setFormData({ ...formData, usage_limit: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#137fec]"
                    placeholder="غير محدود"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    تاريخ انتهاء الصلاحية
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.valid_until}
                    onChange={(e) =>
                      setFormData({ ...formData, valid_until: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#137fec]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    الحالة
                  </label>
                  <select
                    value={formData.is_active ? "true" : "false"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_active: e.target.value === "true",
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#137fec]"
                  >
                    <option value="true">نشط</option>
                    <option value="false">معطل</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#137fec] text-white px-6 py-2 rounded-lg hover:bg-[#137fec]/90 disabled:opacity-50 transition-colors"
                >
                  {submitting
                    ? "جارٍ الحفظ..."
                    : editingCoupon
                    ? "تحديث الكوبون"
                    : "إضافة الكوبون"}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-6 py-2 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Controls: Search and Filters */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          {/* SearchBar */}
          <div className="w-full md:w-1/3">
            <label className="flex flex-col min-w-40 h-12 w-full">
              <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
                <div className="text-slate-500 dark:text-slate-400 flex bg-white dark:bg-[#182635] items-center justify-center pl-4 rounded-r-lg border-r-0 border border-slate-200 dark:border-slate-800">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 dark:text-slate-100 focus:outline-0 focus:ring-2 focus:ring-[#137fec]/50 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#182635] focus:border-[#137fec]/50 h-full placeholder:text-slate-500 dark:placeholder:text-slate-400 px-4 rounded-r-none border-l-0 pr-2 text-base font-normal leading-normal"
                  placeholder="ابحث عن طريق كود الكوبون"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </label>
          </div>

          {/* Chips for filtering */}
          <div className="flex gap-2 p-1 flex-wrap justify-center md:justify-end">
            <button
              onClick={() => setFilterStatus("all")}
              className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg px-4 text-sm font-medium leading-normal transition-colors ${
                filterStatus === "all"
                  ? "bg-[#137fec] text-white"
                  : "bg-white dark:bg-[#182635] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#137fec]/10 border border-slate-200 dark:border-slate-800"
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setFilterStatus("active")}
              className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg px-4 text-sm font-medium leading-normal transition-colors ${
                filterStatus === "active"
                  ? "bg-[#137fec] text-white"
                  : "bg-white dark:bg-[#182635] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#137fec]/10 border border-slate-200 dark:border-slate-800"
              }`}
            >
              نشط
            </button>
            <button
              onClick={() => setFilterStatus("expired")}
              className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg px-4 text-sm font-medium leading-normal transition-colors ${
                filterStatus === "expired"
                  ? "bg-[#137fec] text-white"
                  : "bg-white dark:bg-[#182635] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#137fec]/10 border border-slate-200 dark:border-slate-800"
              }`}
            >
              منتهي الصلاحية
            </button>
            <button
              onClick={() => setFilterStatus("used")}
              className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg px-4 text-sm font-medium leading-normal transition-colors ${
                filterStatus === "used"
                  ? "bg-[#137fec] text-white"
                  : "bg-white dark:bg-[#182635] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#137fec]/10 border border-slate-200 dark:border-slate-800"
              }`}
            >
              مستخدم بالكامل
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="w-full">
          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#182635]">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block w-8 h-8 border-4 border-[#137fec] border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm">
                  جارٍ التحميل...
                </p>
              </div>
            ) : filteredCoupons.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                {searchQuery ? "لا توجد نتائج للبحث" : "لا توجد كوبونات حالياً"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                      <th className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        كود الكوبون
                      </th>
                      <th className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        نوع الخصم
                      </th>
                      <th className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        القيمة
                      </th>
                      <th className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        الاستخدام
                      </th>
                      <th className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        الحالة
                      </th>
                      <th className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        تاريخ الانتهاء
                      </th>
                      <th className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        إجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredCoupons.map((coupon) => {
                      const status = getCouponStatus(coupon);
                      return (
                        <tr
                          key={coupon.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {coupon.code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                            {coupon.discount_type === "percentage"
                              ? "نسبة مئوية"
                              : "مبلغ ثابت"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                            {coupon.discount_value}
                            {coupon.discount_type === "percentage" ? "%" : " ريال"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                            {coupon.used_count}/{coupon.usage_limit || "∞"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${status.className}`}
                            >
                              {status.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                            {formatDate(coupon.valid_until)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-4">
                              <button
                                onClick={() => startEdit(coupon)}
                                className="text-[#137fec] hover:text-[#137fec]/80 dark:text-[#137fec] dark:hover:text-[#137fec]/80 transition-colors"
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
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(coupon.id, coupon.code)}
                                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
