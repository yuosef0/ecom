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

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-blue-600 hover:text-blue-700 text-sm">
                ← المتجر
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                📦 إدارة المنتجات
              </h1>
            </div>
            <div className="flex gap-2">
              <Link
                href="/admin"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
              >
                لوحة التحكم
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* زر إضافة */}
        {!isAddingNew && !editingProduct && (
          <button
            onClick={() => setIsAddingNew(true)}
            className="mb-4 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            ➕ إضافة منتج جديد
          </button>
        )}

        {/* رسالة */}
        {message && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${
              message.includes("✅")
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message}
          </div>
        )}

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

        {/* جدول المنتجات */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-bold">المنتجات ({products.length})</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-2 text-gray-600 text-sm">جارٍ التحميل...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              لا توجد منتجات حالياً
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">
                      الصورة
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">
                      المنتج
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">
                      القسم
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">
                      السعر
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">
                      المخزون
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map((product) => {
                    const category = categories.find(
                      (c) => c.id === product.category_id
                    );
                    return (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          {product.images && product.images[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.title}
                              className="w-12 h-12 object-cover rounded"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                              📦
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">
                            {product.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {product.sizes?.length || 0} مقاس ·{" "}
                            {product.colors?.length || 0} لون ·{" "}
                            {product.images?.length || 0} صورة
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {category?.name || "غير محدد"}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {product.price.toFixed(2)} ج.م
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              product.stock > 10
                                ? "bg-green-100 text-green-800"
                                : product.stock > 0
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEdit(product)}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() =>
                                handleDelete(product.id, product.title)
                              }
                              className="text-red-600 hover:text-red-800 font-medium"
                            >
                              🗑️
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
    </main>
  );
}
