"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function AdminPage() {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) return setMessage("❌ من فضلك اختر صورة للمنتج");

    setLoading(true);
    setMessage("");

    try {
      // 🧠 استخدم اسم باكت واحد صحيح
      const bucketName = "products-imges";
      const fileName = `${Date.now()}-${image.name}`;

      // 1️⃣ رفع الصورة إلى Supabase Storage
      const { error: imageError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, image);

      if (imageError) throw imageError;

      // 2️⃣ جلب رابط الصورة العام
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      const imageUrl = urlData.publicUrl;

      // 3️⃣ إنشاء slug للمنتج وإدخاله في قاعدة البيانات
      const slug = title.toLowerCase().replace(/\s+/g, "-");

      const { error: insertError } = await supabase.from("products").insert([
        {
          title,
          slug,
          description,
          price: Number(price),
          image_url: imageUrl,
          stock: 10,
        },
      ]);

      if (insertError) throw insertError;

      // ✅ نجاح العملية
      setMessage("✅ تم إضافة المنتج بنجاح!");
      setTitle("");
      setPrice("");
      setDescription("");
      setImage(null);
    } catch (err: any) {
      console.error(err);
      setMessage("❌ حدث خطأ أثناء رفع المنتج");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-10 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">🛒 إضافة منتج جديد</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="اسم المنتج"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full p-2 border rounded"
        />
        <input
          type="number"
          placeholder="السعر"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          className="w-full p-2 border rounded"
        />
        <textarea
          placeholder="وصف المنتج"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files?.[0] || null)}
          className="w-full"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "جارٍ الحفظ..." : "إضافة المنتج"}
        </button>
      </form>

      {message && (
        <p className="mt-4 text-center font-medium text-gray-700">{message}</p>
      )}
    </main>
  );
}
