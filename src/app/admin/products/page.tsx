"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import Link from "next/link";

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock: number;
  created_at: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    description: "",
    stock: "10",
  });
  const [image, setImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

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
    fetchProducts();
  }, []);

  // إضافة منتج جديد
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image && !editingProduct) {
      setMessage("❌ من فضلك اختر صورة للمنتج");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      let imageUrl = editingProduct?.image_url || "";

      // رفع الصورة إذا تم اختيار صورة جديدة
      if (image) {
        const bucketName = "products-imges";
        const fileName = `${Date.now()}-${image.name}`;

        const { error: imageError } = await supabase.storage
          .from(bucketName)
          .upload(fileName, image);

        if (imageError) throw imageError;

        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(fileName);

        imageUrl = urlData.publicUrl;
      }

      const slug = formData.title.toLowerCase().replace(/\s+/g, "-");
      const productData = {
        title: formData.title,
        slug,
        description: formData.description || null,
        price: Number(formData.price),
        image_url: imageUrl,
        stock: Number(formData.stock),
      };

      if (editingProduct) {
        // تحديث منتج موجود
        const { error: updateError } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingProduct.id);

        if (updateError) throw updateError;

        setMessage("✅ تم تحديث المنتج بنجاح!");
        setEditingProduct(null);
      } else {
        // إضافة منتج جديد
        const { error: insertError } = await supabase
          .from("products")
          .insert([productData]);

        if (insertError) throw insertError;

        setMessage("✅ تم إضافة المنتج بنجاح!");
        setIsAddingNew(false);
      }

      // إعادة تعيين النموذج
      setFormData({ title: "", price: "", description: "", stock: "10" });
      setImage(null);
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
    });
    setIsAddingNew(false);
    setMessage("");
  };

  // إلغاء التعديل
  const cancelEdit = () => {
    setEditingProduct(null);
    setIsAddingNew(false);
    setFormData({ title: "", price: "", description: "", stock: "10" });
    setImage(null);
    setMessage("");
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
                📦 إدارة المنتجات
              </h1>
            </div>
            <div className="flex gap-2">
              <Link
                href="/admin/orders"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                إدارة الطلبات
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
        {/* زر إضافة منتج جديد */}
        {!isAddingNew && !editingProduct && (
          <button
            onClick={() => setIsAddingNew(true)}
            className="mb-6 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            ➕ إضافة منتج جديد
          </button>
        )}

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

        {/* نموذج إضافة/تعديل منتج */}
        {(isAddingNew || editingProduct) && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">
              {editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}
            </h2>
            <form onSubmit={handleAddProduct} className="space-y-4">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  صورة المنتج {!editingProduct && "*"}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files?.[0] || null)}
                  className="w-full"
                />
                {editingProduct?.image_url && !image && (
                  <img
                    src={editingProduct.image_url}
                    alt="Current"
                    className="mt-2 w-20 h-20 object-cover rounded"
                  />
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {submitting
                    ? "جارٍ الحفظ..."
                    : editingProduct
                    ? "تحديث المنتج"
                    : "إضافة المنتج"}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

        {/* جدول المنتجات */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <h2 className="text-xl font-bold p-6 border-b">المنتجات الحالية</h2>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-2 text-gray-600">جارٍ التحميل...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              لا توجد منتجات حالياً
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      الصورة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      اسم المنتج
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      السعر
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      المخزون
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.title}
                            className="w-16 h-16 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                            📦
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {product.title}
                        </div>
                        {product.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {product.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        {product.price.toFixed(2)} ج.م
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            product.stock > 10
                              ? "bg-green-100 text-green-800"
                              : product.stock > 0
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {product.stock} قطعة
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(product)}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                          >
                            ✏️ تعديل
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(product.id, product.title)
                            }
                            className="text-red-600 hover:text-red-800 font-medium text-sm"
                          >
                            🗑️ حذف
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
    </main>
  );
}
