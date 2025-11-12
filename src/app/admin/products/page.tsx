"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  image_url: string | null;
  images: string[];
  stock: number;
  category_id: string | null;
  sizes: string[];
  colors: { name: string; hex: string }[];
  created_at: string;
}

interface ColorInput {
  name: string;
  hex: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "available" | "low" | "out">("all");
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    description: "",
    stock: "10",
    category_id: "",
  });
  const [images, setImages] = useState<File[]>([]);
  const [sizes, setSizes] = useState<string[]>(["S", "M", "L", "XL"]);
  const [colors, setColors] = useState<ColorInput[]>([
    { name: "أبيض", hex: "#FFFFFF" },
    { name: "أسود", hex: "#000000" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // جلب الأقسام
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("خطأ في جلب الأقسام:", error);
    }
  };

  // جلب المنتجات
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("خطأ في جلب المنتجات:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  // إضافة/تعديل منتج
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category_id) {
      setMessage("❌ من فضلك اختر القسم");
      return;
    }

    if (images.length === 0 && !editingProduct) {
      setMessage("❌ من فضلك اختر صورة واحدة على الأقل");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      let imageUrls: string[] = editingProduct?.images || [];

      // رفع الصور الجديدة
      if (images.length > 0) {
        const bucketName = "products-imges";
        const uploadedUrls: string[] = [];

        for (const image of images) {
          const fileName = `${Date.now()}-${Math.random()}-${image.name}`;
          const { error: imageError } = await supabase.storage
            .from(bucketName)
            .upload(fileName, image);

          if (imageError) throw imageError;

          const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);

          uploadedUrls.push(urlData.publicUrl);
        }

        imageUrls = editingProduct
          ? [...imageUrls, ...uploadedUrls]
          : uploadedUrls;
      }

      const slug = formData.title.toLowerCase().replace(/\s+/g, "-");
      const productData = {
        title: formData.title,
        slug,
        description: formData.description || null,
        price: Number(formData.price),
        image_url: imageUrls[0] || null,
        images: imageUrls,
        stock: Number(formData.stock),
        category_id: formData.category_id,
        sizes: sizes,
        colors: colors,
      };

      if (editingProduct) {
        const { error: updateError } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingProduct.id);

        if (updateError) throw updateError;
        setMessage("✅ تم تحديث المنتج بنجاح!");
        setEditingProduct(null);
      } else {
        const { error: insertError } = await supabase
          .from("products")
          .insert([productData]);

        if (insertError) throw insertError;
        setMessage("✅ تم إضافة المنتج بنجاح!");
        setIsAddingNew(false);
      }

      resetForm();
      fetchProducts();
    } catch (err: any) {
      console.error(err);
      setMessage("❌ حدث خطأ: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // حذف منتج
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`هل أنت متأكد من حذف المنتج: ${title}؟`)) return;

    try {
      const { error: deleteError } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;
      setMessage("✅ تم حذف المنتج بنجاح!");
      fetchProducts();
    } catch (error: any) {
      console.error("خطأ في حذف المنتج:", error);
      setMessage("❌ فشل في حذف المنتج: " + error.message);
    }
  };

  // بدء التعديل
  const startEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      price: product.price.toString(),
      description: product.description || "",
      stock: product.stock.toString(),
      category_id: product.category_id || "",
    });
    setSizes(product.sizes || ["S", "M", "L", "XL"]);
    setColors(product.colors || [{ name: "أبيض", hex: "#FFFFFF" }]);
    setIsAddingNew(false);
    setMessage("");
  };

  // إلغاء
  const resetForm = () => {
    setEditingProduct(null);
    setIsAddingNew(false);
    setFormData({
      title: "",
      price: "",
      description: "",
      stock: "10",
      category_id: "",
    });
    setImages([]);
    setSizes(["S", "M", "L", "XL"]);
    setColors([
      { name: "أبيض", hex: "#FFFFFF" },
      { name: "أسود", hex: "#000000" },
    ]);
    setMessage("");
  };

  // إضافة مقاس
  const addSize = () => {
    const newSize = prompt("أدخل المقاس الجديد (مثال: XL):");
    if (newSize && newSize.trim()) {
      setSizes([...sizes, newSize.trim()]);
    }
  };

  // حذف مقاس
  const removeSize = (index: number) => {
    setSizes(sizes.filter((_, i) => i !== index));
  };

  // إضافة لون
  const addColor = () => {
    setColors([...colors, { name: "", hex: "#000000" }]);
  };

  // تحديث لون
  const updateColor = (index: number, field: "name" | "hex", value: string) => {
    const newColors = [...colors];
    newColors[index][field] = value;
    setColors(newColors);
  };

  // حذف لون
  const removeColor = (index: number) => {
    setColors(colors.filter((_, i) => i !== index));
  };

  // فلترة المنتجات
  const getFilteredProducts = () => {
    let filtered = products;

    // فلترة بالبحث
    if (searchQuery) {
      filtered = filtered.filter((p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // فلترة بالتبويب
    switch (activeTab) {
      case "available":
        filtered = filtered.filter((p) => p.stock > 10);
        break;
      case "low":
        filtered = filtered.filter((p) => p.stock > 0 && p.stock <= 10);
        break;
      case "out":
        filtered = filtered.filter((p) => p.stock === 0);
        break;
    }

    return filtered;
  };

  const filteredProducts = getFilteredProducts();

  // تحديد/إلغاء تحديد منتج
  const toggleProductSelection = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  // تحديد/إلغاء تحديد الكل
  const toggleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map((p) => p.id)));
    }
  };

  // حالة المخزون
  const getStockStatus = (stock: number) => {
    if (stock > 10) {
      return {
        label: "متوفر",
        className:
          "inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300",
      };
    } else if (stock > 0) {
      return {
        label: "مخزون منخفض",
        className:
          "inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300",
      };
    } else {
      return {
        label: "غير متوفر",
        className:
          "inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300",
      };
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* رسالة */}
        {message && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${
              message.includes("✅")
                ? "bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
            }`}
          >
            {message}
          </div>
        )}

        {/* Page Heading */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div className="flex flex-col gap-1">
            <p className="text-slate-900 dark:text-white text-3xl font-bold leading-tight">
              إدارة المنتجات
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-normal">
              إضافة وتعديل وحذف المنتجات في متجرك
            </p>
          </div>
          {!isAddingNew && !editingProduct && (
            <button
              onClick={() => setIsAddingNew(true)}
              className="flex items-center justify-center gap-2 rounded-lg h-11 px-5 bg-[#137fec] text-white text-sm font-bold leading-normal tracking-wide shadow-sm hover:bg-[#137fec]/90 transition-colors"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="truncate">أضف منتج جديد</span>
            </button>
          )}
        </div>

        {/* نموذج */}
        {(isAddingNew || editingProduct) && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">
              {editingProduct ? "✏️ تعديل المنتج" : "➕ إضافة منتج جديد"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* اسم المنتج والسعر */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    اسم المنتج *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="مثال: تيشيرت قطن رجالي"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    السعر (ج.م) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="299.00"
                  />
                </div>
              </div>

              {/* القسم والكمية */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    القسم *
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) =>
                      setFormData({ ...formData, category_id: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- اختر القسم --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الكمية المتوفرة *
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="10"
                  />
                </div>
              </div>

              {/* الوصف */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الوصف
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="وصف المنتج..."
                />
              </div>

              {/* المقاسات */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    المقاسات
                  </label>
                  <button
                    type="button"
                    onClick={addSize}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    + إضافة مقاس
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-lg"
                    >
                      <span className="text-sm font-medium">{size}</span>
                      <button
                        type="button"
                        onClick={() => removeSize(index)}
                        className="text-red-600 hover:text-red-700 ml-1"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* الألوان */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    الألوان
                  </label>
                  <button
                    type="button"
                    onClick={addColor}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    + إضافة لون
                  </button>
                </div>
                <div className="space-y-2">
                  {colors.map((color, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={color.name}
                        onChange={(e) =>
                          updateColor(index, "name", e.target.value)
                        }
                        placeholder="اسم اللون"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="color"
                        value={color.hex}
                        onChange={(e) =>
                          updateColor(index, "hex", e.target.value)
                        }
                        className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => removeColor(index)}
                        className="text-red-600 hover:text-red-700 px-2"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* الصور */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  صور المنتج {!editingProduct && "*"}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setImages(files);
                  }}
                  className="w-full text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  يمكنك اختيار عدة صور (اضغط Ctrl/Cmd مع النقر)
                </p>
                {editingProduct?.images && editingProduct.images.length > 0 && (
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {editingProduct.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`صورة ${idx + 1}`}
                        className="w-20 h-20 object-cover rounded border"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* الأزرار */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium"
                >
                  {submitting
                    ? "جارٍ الحفظ..."
                    : editingProduct
                    ? "💾 تحديث"
                    : "➕ إضافة"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search Bar & Tabs */}
        <div className="bg-white dark:bg-[#182635] rounded-xl border border-slate-200 dark:border-slate-800 p-2">
          {/* Search and Actions */}
          <div className="flex flex-wrap justify-between items-center gap-4 p-4">
            <div className="flex-1 min-w-[250px]">
              <label className="flex flex-col w-full">
                <div className="flex w-full flex-1 items-stretch rounded-lg h-11">
                  <div className="text-slate-400 flex bg-slate-100 dark:bg-slate-900 items-center justify-center pr-4 rounded-r-lg">
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
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#137fec]/50 border-none bg-slate-100 dark:bg-slate-900 h-full placeholder:text-slate-400 px-4 rounded-r-none pl-2 text-base font-normal leading-normal"
                    placeholder="ابحث عن منتج بالاسم أو SKU"
                  />
                </div>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center justify-center gap-2 rounded-lg h-11 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
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
                <span>فلتر</span>
              </button>
              <button className="flex items-center justify-center gap-2 rounded-lg h-11 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
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
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                <span>تصدير</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-slate-200 dark:border-slate-800 px-4">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab("all")}
                className={`flex flex-col items-center justify-center border-b-[3px] pb-3 pt-4 ${
                  activeTab === "all"
                    ? "border-b-[#137fec] text-[#137fec]"
                    : "border-b-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <p className="text-sm font-bold">كل المنتجات</p>
              </button>
              <button
                onClick={() => setActiveTab("available")}
                className={`flex flex-col items-center justify-center border-b-[3px] pb-3 pt-4 ${
                  activeTab === "available"
                    ? "border-b-[#137fec] text-[#137fec]"
                    : "border-b-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <p className="text-sm font-bold">متوفر</p>
              </button>
              <button
                onClick={() => setActiveTab("low")}
                className={`flex flex-col items-center justify-center border-b-[3px] pb-3 pt-4 ${
                  activeTab === "low"
                    ? "border-b-[#137fec] text-[#137fec]"
                    : "border-b-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <p className="text-sm font-bold">مخزون منخفض</p>
              </button>
              <button
                onClick={() => setActiveTab("out")}
                className={`flex flex-col items-center justify-center border-b-[3px] pb-3 pt-4 ${
                  activeTab === "out"
                    ? "border-b-[#137fec] text-[#137fec]"
                    : "border-b-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <p className="text-sm font-bold">غير متوفر</p>
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block w-8 h-8 border-4 border-[#137fec] border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm">
                جارٍ التحميل...
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              {searchQuery
                ? "لا توجد نتائج للبحث"
                : "لا توجد منتجات في هذا القسم"}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <th className="px-4 py-3 w-12 text-center">
                        <input
                          type="checkbox"
                          checked={
                            filteredProducts.length > 0 &&
                            selectedProducts.size === filteredProducts.length
                          }
                          onChange={toggleSelectAll}
                          className="form-checkbox h-5 w-5 rounded-md border-slate-300 dark:border-slate-600 bg-transparent text-[#137fec] checked:bg-[#137fec] checked:border-[#137fec] focus:ring-0 focus:ring-offset-0 focus:border-[#137fec]"
                        />
                      </th>
                      <th className="px-4 py-3 text-slate-500 dark:text-slate-400 w-auto text-sm font-medium leading-normal">
                        المنتج
                      </th>
                      <th className="px-4 py-3 text-slate-500 dark:text-slate-400 w-40 text-sm font-medium leading-normal">
                        القسم
                      </th>
                      <th className="px-4 py-3 text-slate-500 dark:text-slate-400 w-32 text-sm font-medium leading-normal">
                        السعر
                      </th>
                      <th className="px-4 py-3 text-slate-500 dark:text-slate-400 w-40 text-sm font-medium leading-normal">
                        المخزون
                      </th>
                      <th className="px-4 py-3 text-slate-500 dark:text-slate-400 w-40 text-sm font-medium leading-normal">
                        المتغيرات
                      </th>
                      <th className="px-4 py-3 text-slate-500 dark:text-slate-400 w-24 text-left text-sm font-medium leading-normal">
                        إجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => {
                      const category = categories.find(
                        (c) => c.id === product.category_id
                      );
                      const stockStatus = getStockStatus(product.stock);
                      return (
                        <tr
                          key={product.id}
                          className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                        >
                          <td className="px-4 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={selectedProducts.has(product.id)}
                              onChange={() =>
                                toggleProductSelection(product.id)
                              }
                              className="form-checkbox h-5 w-5 rounded-md border-slate-300 dark:border-slate-600 bg-transparent text-[#137fec] checked:bg-[#137fec] checked:border-[#137fec] focus:ring-0 focus:ring-offset-0 focus:border-[#137fec]"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-3">
                              {product.images && product.images[0] ? (
                                <img
                                  src={product.images[0]}
                                  alt={product.title}
                                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-lg w-12"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-400">
                                  <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                    />
                                  </svg>
                                </div>
                              )}
                              <span className="font-medium text-slate-800 dark:text-slate-100">
                                {product.title}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-slate-500 dark:text-slate-400">
                            {category?.name || "غير محدد"}
                          </td>
                          <td className="px-4 py-2 text-slate-500 dark:text-slate-400">
                            {product.price.toFixed(2)} ر.س
                          </td>
                          <td className="px-4 py-2">
                            <span className={stockStatus.className}>
                              <span className="h-2 w-2 rounded-full bg-current"></span>
                              {stockStatus.label}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-slate-500 dark:text-slate-400">
                            {product.sizes?.length || 0} مقاسات,{" "}
                            {product.colors?.length || 0} ألوان
                          </td>
                          <td className="px-4 py-2 text-left">
                            <div className="flex items-center justify-start gap-1">
                              <button
                                onClick={() => startEdit(product)}
                                className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
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
                                  handleDelete(product.id, product.title)
                                }
                                className="p-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900/40 text-red-500"
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

              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  عرض {filteredProducts.length} من {products.length} منتج
                </p>
                <div className="flex items-center gap-2">
                  <button className="flex items-center justify-center rounded-lg h-9 px-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    السابق
                  </button>
                  <button className="flex items-center justify-center rounded-lg h-9 px-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    التالي
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
