"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    parent_id: "",
    display_order: "0",
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // جلب الفئات
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("خطأ في جلب الفئات:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // إضافة أو تحديث فئة
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) {
      setMessage("❌ الاسم والـ slug مطلوبان");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const categoryData = {
        name: formData.name,
        slug: formData.slug.toLowerCase().replace(/\s+/g, "-"),
        description: formData.description || null,
        parent_id: formData.parent_id || null,
        display_order: Number(formData.display_order),
        is_active: formData.is_active,
      };

      if (editingCategory) {
        // تحديث فئة موجودة
        const response = await fetch(`/api/categories/${editingCategory.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(categoryData),
        });

        if (!response.ok) throw new Error("فشل في تحديث الفئة");

        setMessage("✅ تم تحديث الفئة بنجاح!");
        setEditingCategory(null);
      } else {
        // إضافة فئة جديدة
        const response = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(categoryData),
        });

        if (!response.ok) throw new Error("فشل في إضافة الفئة");

        setMessage("✅ تم إضافة الفئة بنجاح!");
        setIsAddingNew(false);
      }

      // إعادة تعيين النموذج
      setFormData({
        name: "",
        slug: "",
        description: "",
        parent_id: "",
        display_order: "0",
        is_active: true,
      });
      fetchCategories();
    } catch (err: any) {
      console.error(err);
      setMessage("❌ حدث خطأ: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // حذف فئة
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف الفئة: ${name}؟`)) return;

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("فشل في حذف الفئة");

      setMessage("✅ تم حذف الفئة بنجاح!");
      fetchCategories();
    } catch (error: any) {
      console.error("خطأ في حذف الفئة:", error);
      setMessage("❌ فشل في حذف الفئة");
    }
  };

  // بدء التعديل
  const startEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      parent_id: category.parent_id || "",
      display_order: category.display_order.toString(),
      is_active: category.is_active,
    });
    setIsAddingNew(false);
    setMessage("");
  };

  // إلغاء التعديل
  const cancelEdit = () => {
    setEditingCategory(null);
    setIsAddingNew(false);
    setFormData({
      name: "",
      slug: "",
      description: "",
      parent_id: "",
      display_order: "0",
      is_active: true,
    });
    setMessage("");
  };

  // تحديد/إلغاء تحديد فئة
  const toggleCategorySelection = (categoryId: string) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(categoryId)) {
      newSelected.delete(categoryId);
    } else {
      newSelected.add(categoryId);
    }
    setSelectedCategories(newSelected);
  };

  // تحديد/إلغاء تحديد الكل
  const toggleSelectAll = () => {
    if (selectedCategories.size === categories.length) {
      setSelectedCategories(new Set());
    } else {
      setSelectedCategories(new Set(categories.map((c) => c.id)));
    }
  };

  // نقل الفئة للأعلى أو للأسفل
  const moveCategory = async (id: string, direction: "up" | "down") => {
    const currentIndex = categories.findIndex((c) => c.id === id);
    if (
      currentIndex === -1 ||
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === categories.length - 1)
    ) {
      return;
    }

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const currentCategory = categories[currentIndex];
    const targetCategory = categories[newIndex];

    try {
      await supabase
        .from("categories")
        .update({ display_order: targetCategory.display_order })
        .eq("id", currentCategory.id);

      await supabase
        .from("categories")
        .update({ display_order: currentCategory.display_order })
        .eq("id", targetCategory.id);

      fetchCategories();
    } catch (error) {
      console.error("Error moving category:", error);
    }
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

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Section: Table and Header */}
          <div className="lg:col-span-2">
            {/* Page Heading */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6">
              <div className="flex flex-col">
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  إدارة الأقسام
                </p>
                <p className="text-base text-slate-500 dark:text-slate-400">
                  إدارة أقسام متجرك الإلكتروني
                </p>
              </div>
            </div>

            {/* Table */}
            <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#182635]">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="inline-block w-8 h-8 border-4 border-[#137fec] border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm">
                    جارٍ التحميل...
                  </p>
                </div>
              ) : categories.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                  لا توجد أقسام حالياً
                </div>
              ) : (
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50">
                      <th className="w-12 p-4 text-center text-sm font-medium text-slate-600 dark:text-slate-400">
                        <input
                          type="checkbox"
                          checked={
                            categories.length > 0 &&
                            selectedCategories.size === categories.length
                          }
                          onChange={toggleSelectAll}
                          className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-[#137fec] focus:ring-2 focus:ring-[#137fec]/50"
                        />
                      </th>
                      <th className="w-12 p-4 text-center text-sm font-medium text-slate-600 dark:text-slate-400">
                        #
                      </th>
                      <th className="p-4 text-right text-sm font-medium text-slate-600 dark:text-slate-400">
                        اسم القسم
                      </th>
                      <th className="p-4 text-right text-sm font-medium text-slate-600 dark:text-slate-400">
                        الاسم اللطيف (Slug)
                      </th>
                      <th className="p-4 text-right text-sm font-medium text-slate-600 dark:text-slate-400">
                        الحالة
                      </th>
                      <th className="p-4 text-center text-sm font-medium text-slate-600 dark:text-slate-400">
                        إجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {categories.map((category, index) => (
                      <tr
                        key={category.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-900/50"
                      >
                        <td className="p-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedCategories.has(category.id)}
                            onChange={() => toggleCategorySelection(category.id)}
                            className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-[#137fec] focus:ring-2 focus:ring-[#137fec]/50"
                          />
                        </td>
                        <td className="p-4 text-center text-slate-500 dark:text-slate-400">
                          <div className="flex flex-col items-center">
                            <button
                              onClick={() => moveCategory(category.id, "up")}
                              disabled={index === 0}
                              className="text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
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
                                  d="M5 15l7-7 7 7"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => moveCategory(category.id, "down")}
                              disabled={index === categories.length - 1}
                              className="text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
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
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                        <td className="p-4 text-sm font-medium text-slate-800 dark:text-slate-200">
                          {category.name}
                        </td>
                        <td className="p-4 text-sm text-slate-500 dark:text-slate-400">
                          {category.slug}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                              category.is_active
                                ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300"
                                : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {category.is_active ? "نشط" : "غير نشط"}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => startEdit(category)}
                              className="rounded-lg p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
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
                              onClick={() =>
                                handleDelete(category.id, category.name)
                              }
                              className="rounded-lg p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50"
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
              )}
            </div>
          </div>

          {/* Right Section: Add/Edit Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#182635]">
              {/* Section Header */}
              <h2 className="pb-6 text-xl font-bold text-slate-900 dark:text-white">
                {editingCategory ? "تعديل قسم" : "إضافة قسم جديد"}
              </h2>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* اسم القسم */}
                <label className="flex flex-col">
                  <p className="pb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    اسم القسم
                  </p>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setFormData({
                        ...formData,
                        name: newName,
                        slug: !editingCategory
                          ? newName
                              .toLowerCase()
                              .replace(/\s+/g, "-")
                              .replace(/[^a-z0-9-]/g, "")
                          : formData.slug,
                      });
                    }}
                    required
                    className="form-input w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#137fec] focus:ring-[#137fec] dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-[#137fec] dark:focus:ring-[#137fec]"
                    placeholder="أدخل اسم القسم هنا"
                  />
                </label>

                {/* الاسم اللطيف */}
                <label className="flex flex-col">
                  <p className="pb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    الاسم اللطيف (Slug)
                  </p>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    required
                    className="form-input w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#137fec] focus:ring-[#137fec] dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-[#137fec] dark:focus:ring-[#137fec]"
                    placeholder="مثال: men-clothing"
                  />
                </label>

                {/* الوصف */}
                <label className="flex flex-col">
                  <p className="pb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    الوصف
                  </p>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={4}
                    className="form-textarea w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#137fec] focus:ring-[#137fec] dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-[#137fec] dark:focus:ring-[#137fec]"
                    placeholder="أدخل وصفًا موجزًا للقسم"
                  />
                </label>

                {/* Toggle Switch */}
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    تفعيل القسم
                  </p>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({ ...formData, is_active: e.target.checked })
                      }
                      className="peer sr-only"
                      type="checkbox"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#137fec] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#137fec]/30 dark:border-slate-600 dark:bg-slate-700 dark:peer-focus:ring-[#137fec]/80 rtl:peer-checked:after:-translate-x-full"></div>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 cursor-pointer items-center justify-center rounded-lg bg-[#137fec] px-5 py-3 text-sm font-semibold text-white hover:bg-[#137fec]/90 focus:outline-none focus:ring-4 focus:ring-[#137fec]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting
                      ? "جارٍ الحفظ..."
                      : editingCategory
                      ? "حفظ التغييرات"
                      : "حفظ القسم"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex-1 cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-700 dark:focus:ring-slate-700"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
