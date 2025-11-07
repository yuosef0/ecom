"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import Link from "next/link";

interface Review {
  id: string;
  product_id: string;
  customer_name: string;
  customer_email: string;
  rating: number;
  title: string | null;
  comment: string | null;
  is_verified_purchase: boolean;
  is_approved: boolean;
  helpful_count: number;
  created_at: string;
  products?: {
    title: string;
    slug: string;
  };
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "approved" | "pending">("all");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [message, setMessage] = useState("");

  // جلب التقييمات
  const fetchReviews = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("reviews")
        .select(`
          *,
          products:product_id (title, slug)
        `)
        .order("created_at", { ascending: false });

      // تطبيق الفلتر
      if (filter === "approved") {
        query = query.eq("is_approved", true);
      } else if (filter === "pending") {
        query = query.eq("is_approved", false);
      }

      const { data, error } = await query;

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error("خطأ في جلب التقييمات:", error);
      setMessage("❌ حدث خطأ في جلب التقييمات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [filter]);

  // تغيير حالة الموافقة
  const toggleApproval = async (reviewId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_approved: !currentStatus }),
      });

      if (!response.ok) throw new Error("فشل في تحديث التقييم");

      setMessage(`✅ تم ${!currentStatus ? "الموافقة على" : "إلغاء الموافقة على"} التقييم`);
      fetchReviews();
    } catch (error: any) {
      console.error("خطأ في تحديث التقييم:", error);
      setMessage("❌ فشل في تحديث التقييم");
    }
  };

  // حذف تقييم
  const handleDelete = async (id: string, customerName: string) => {
    if (!confirm(`هل أنت متأكد من حذف تقييم ${customerName}؟`)) return;

    try {
      const response = await fetch(`/api/reviews/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("فشل في حذف التقييم");

      setMessage("✅ تم حذف التقييم بنجاح!");
      fetchReviews();
    } catch (error: any) {
      console.error("خطأ في حذف التقييم:", error);
      setMessage("❌ فشل في حذف التقييم");
    }
  };

  // عرض النجوم
  const renderStars = (rating: number) => {
    return "⭐".repeat(rating) + "☆".repeat(5 - rating);
  };

  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
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
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-blue-600 hover:text-blue-700">
                ← لوحة التحكم
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                ⭐ إدارة التقييمات
              </h1>
            </div>
            <div className="flex gap-2">
              <Link
                href="/admin/categories"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                إدارة الفئات
              </Link>
              <Link
                href="/admin/products"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                إدارة المنتجات
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* رسالة النجاح/الخطأ */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.includes("✅")
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message}
          </div>
        )}

        {/* الفلاتر */}
        <div className="mb-6 flex gap-3">
          <button
            onClick={() => setFilter("all")}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border hover:bg-gray-50"
            }`}
          >
            الكل ({reviews.length})
          </button>
          <button
            onClick={() => setFilter("approved")}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              filter === "approved"
                ? "bg-green-600 text-white"
                : "bg-white text-gray-700 border hover:bg-gray-50"
            }`}
          >
            معتمدة
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              filter === "pending"
                ? "bg-yellow-600 text-white"
                : "bg-white text-gray-700 border hover:bg-gray-50"
            }`}
          >
            قيد المراجعة
          </button>
        </div>

        {/* جدول التقييمات */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <h2 className="text-xl font-bold p-6 border-b">
            التقييمات ({reviews.length})
          </h2>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-2 text-gray-600">جارٍ التحميل...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              لا توجد تقييمات {filter === "approved" && "معتمدة"} {filter === "pending" && "قيد المراجعة"} حالياً
            </div>
          ) : (
            <div className="divide-y">
              {reviews.map((review) => (
                <div key={review.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* معلومات المنتج */}
                      <div className="mb-3">
                        <span className="text-sm text-gray-500">منتج:</span>{" "}
                        <span className="font-semibold text-gray-900">
                          {review.products?.title || "منتج محذوف"}
                        </span>
                      </div>

                      {/* التقييم */}
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{renderStars(review.rating)}</span>
                        <span className="text-sm font-medium text-gray-700">
                          {review.rating}/5
                        </span>
                      </div>

                      {/* العنوان */}
                      {review.title && (
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          {review.title}
                        </h3>
                      )}

                      {/* التعليق */}
                      {review.comment && (
                        <p className="text-gray-700 mb-3">{review.comment}</p>
                      )}

                      {/* معلومات العميل */}
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>👤 {review.customer_name}</span>
                        <span>📧 {review.customer_email}</span>
                        <span>📅 {formatDate(review.created_at)}</span>
                        {review.is_verified_purchase && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                            ✓ عميل مؤكد
                          </span>
                        )}
                      </div>

                      {/* الحالة */}
                      <div className="mt-3">
                        <span
                          className={`px-3 py-1 text-xs rounded-full font-medium ${
                            review.is_approved
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {review.is_approved ? "✓ معتمد" : "⏳ قيد المراجعة"}
                        </span>
                      </div>
                    </div>

                    {/* الأزرار */}
                    <div className="flex flex-col gap-2 mr-4">
                      <button
                        onClick={() =>
                          toggleApproval(review.id, review.is_approved)
                        }
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                          review.is_approved
                            ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                      >
                        {review.is_approved ? "❌ إلغاء الموافقة" : "✓ موافقة"}
                      </button>
                      <button
                        onClick={() => setSelectedReview(review)}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition"
                      >
                        👁️ عرض
                      </button>
                      <button
                        onClick={() =>
                          handleDelete(review.id, review.customer_name)
                        }
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition"
                      >
                        🗑️ حذف
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal لعرض تفاصيل التقييم */}
      {selectedReview && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedReview(null)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                تفاصيل التقييم
              </h2>
              <button
                onClick={() => setSelectedReview(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">المنتج</label>
                <p className="text-lg font-semibold">
                  {selectedReview.products?.title || "منتج محذوف"}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">التقييم</label>
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{renderStars(selectedReview.rating)}</span>
                  <span className="text-lg font-medium">{selectedReview.rating}/5</span>
                </div>
              </div>

              {selectedReview.title && (
                <div>
                  <label className="text-sm font-medium text-gray-500">العنوان</label>
                  <p className="text-lg font-semibold">{selectedReview.title}</p>
                </div>
              )}

              {selectedReview.comment && (
                <div>
                  <label className="text-sm font-medium text-gray-500">التعليق</label>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedReview.comment}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">اسم العميل</label>
                  <p className="font-medium">{selectedReview.customer_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">البريد الإلكتروني</label>
                  <p className="font-medium">{selectedReview.customer_email}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">تاريخ الإنشاء</label>
                <p className="font-medium">{formatDate(selectedReview.created_at)}</p>
              </div>

              <div className="flex gap-2">
                {selectedReview.is_verified_purchase && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    ✓ عميل مؤكد
                  </span>
                )}
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedReview.is_approved
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {selectedReview.is_approved ? "✓ معتمد" : "⏳ قيد المراجعة"}
                </span>
              </div>

              <div className="pt-4 border-t flex gap-3">
                <button
                  onClick={() => {
                    toggleApproval(selectedReview.id, selectedReview.is_approved);
                    setSelectedReview(null);
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                    selectedReview.is_approved
                      ? "bg-yellow-600 text-white hover:bg-yellow-700"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {selectedReview.is_approved ? "إلغاء الموافقة" : "الموافقة"}
                </button>
                <button
                  onClick={() => setSelectedReview(null)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
