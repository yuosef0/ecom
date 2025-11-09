"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useAuth } from "../../../contexts/AuthContext";
import { useRouter } from "next/navigation";

interface SliderImage {
  id: string;
  image_url: string;
  title: string | null;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export default function AdminSliderPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [images, setImages] = useState<SliderImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Form states
  const [imageUrl, setImageUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [displayOrder, setDisplayOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!isAdmin) {
      router.push("/");
      return;
    }

    fetchSliderImages();
  }, [user, isAdmin, router]);

  const fetchSliderImages = async () => {
    try {
      const { data, error } = await supabase
        .from("slider_images")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setImages(data || []);
    } catch (error: any) {
      console.error("Error fetching slider images:", error);
      const errorMsg = error?.message || error?.error_description || JSON.stringify(error) || "خطأ غير معروف";
      setMessage("❌ خطأ في تحميل الصور: " + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // إنشاء معاينة للصورة
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `slider/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error("Upload error details:", uploadError);
        throw new Error(uploadError.message || "فشل رفع الصورة");
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error("Error in uploadImage:", error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      let finalImageUrl = imageUrl;

      // إذا كان هناك ملف جديد، قم برفعه
      if (imageFile) {
        setUploading(true);
        finalImageUrl = await uploadImage(imageFile);
        setUploading(false);
      }

      if (!finalImageUrl) {
        setMessage("❌ يجب اختيار صورة أو إدخال رابط");
        setSaving(false);
        return;
      }

      if (editingId) {
        // تحديث صورة موجودة
        const { error } = await supabase
          .from("slider_images")
          .update({
            image_url: finalImageUrl,
            title: title || null,
            description: description || null,
            display_order: displayOrder,
            is_active: isActive,
          })
          .eq("id", editingId);

        if (error) throw error;
        setMessage("✅ تم تحديث الصورة بنجاح");
      } else {
        // إضافة صورة جديدة
        const { error } = await supabase.from("slider_images").insert([
          {
            image_url: finalImageUrl,
            title: title || null,
            description: description || null,
            display_order: displayOrder,
            is_active: isActive,
          },
        ]);

        if (error) throw error;
        setMessage("✅ تم إضافة الصورة بنجاح");
      }

      // Reset form
      resetForm();
      fetchSliderImages();
    } catch (error: any) {
      console.error("Error saving slider image:", error);
      const errorMsg = error?.message || error?.error_description || error?.hint || JSON.stringify(error) || "خطأ غير معروف";
      setMessage("❌ خطأ في حفظ الصورة: " + errorMsg);
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleEdit = (image: SliderImage) => {
    setEditingId(image.id);
    setImageUrl(image.image_url);
    setTitle(image.title || "");
    setDescription(image.description || "");
    setDisplayOrder(image.display_order);
    setIsActive(image.is_active);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الصورة؟")) return;

    try {
      const { error } = await supabase
        .from("slider_images")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setMessage("✅ تم حذف الصورة بنجاح");
      fetchSliderImages();
    } catch (error: any) {
      console.error("Error deleting slider image:", error);
      const errorMsg = error?.message || error?.error_description || JSON.stringify(error) || "خطأ غير معروف";
      setMessage("❌ خطأ في حذف الصورة: " + errorMsg);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setImageUrl("");
    setTitle("");
    setDescription("");
    setDisplayOrder(images.length + 1);
    setIsActive(true);
    setImageFile(null);
    setPreviewUrl("");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">إدارة السلايدر</h1>
          <button
            onClick={() => router.push("/admin")}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            العودة لصفحة الأدمن
          </button>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.includes("✅")
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {message}
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">
            {editingId ? "تعديل الصورة" : "إضافة صورة جديدة"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2 font-semibold">
                رفع صورة من الجهاز
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
              <p className="text-sm text-gray-500 mt-1">
                اختر صورة من جهازك (JPG, PNG, GIF)
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">أو</span>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">
                رابط الصورة
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                placeholder="https://example.com/image.jpg"
                disabled={!!imageFile}
              />
              <p className="text-sm text-gray-500 mt-1">
                أو ضع رابط صورة من الإنترنت
              </p>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">عنوان الصورة</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                placeholder="عنوان وصفي للصورة"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">الوصف</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                rows={3}
                placeholder="وصف اختياري للصورة"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">ترتيب العرض</label>
                <input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">الحالة</label>
                <select
                  value={isActive ? "active" : "inactive"}
                  onChange={(e) => setIsActive(e.target.value === "active")}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  <option value="active">نشط</option>
                  <option value="inactive">غير نشط</option>
                </select>
              </div>
            </div>

            {/* معاينة الصورة */}
            {(previewUrl || imageUrl || title || description) && (
              <div>
                <label className="block text-gray-700 mb-2 font-semibold">معاينة السلايدر:</label>
                <div className="relative w-full aspect-[2/1] bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                  <div className="grid grid-cols-2 h-full">
                    {/* Left Side - Text Preview */}
                    <div className="bg-black flex flex-col justify-center items-start px-8 py-6 text-white">
                      <p className="text-xs font-medium mb-1 opacity-80">تشكيل</p>
                      <h2 className="text-2xl font-bold mb-2 leading-tight">
                        {title || "عنوان الصورة"}
                      </h2>
                      <p className="text-lg font-medium opacity-90">
                        {description || "الوصف سيظهر هنا"}
                      </p>
                    </div>

                    {/* Right Side - Image Preview */}
                    <div className="relative bg-gray-200">
                      {(previewUrl || imageUrl) ? (
                        <img
                          src={previewUrl || imageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src =
                              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'%3E%3Crect fill='%23ddd' width='400' height='200'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='20' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3Eخطأ في تحميل الصورة%3C/text%3E%3C/svg%3E";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <div className="text-center">
                            <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm">ارفع صورة أو أدخل رابط</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  💡 ستظهر الصورة على اليمين والنص على اليسار في الصفحة الرئيسية
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving || uploading}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {uploading
                  ? "جاري رفع الصورة..."
                  : saving
                  ? "جاري الحفظ..."
                  : editingId
                  ? "تحديث"
                  : "إضافة"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
                >
                  إلغاء التعديل
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List of Images */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">
            الصور الحالية ({images.length})
          </h2>

          {images.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              لا توجد صور في السلايدر حالياً
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="border rounded-lg overflow-hidden hover:shadow-lg transition"
                >
                  <div className="relative h-48 bg-gray-100">
                    <img
                      src={image.image_url}
                      alt={image.title || "Slider Image"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23ddd' width='400' height='300'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='20' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3Eخطأ في تحميل الصورة%3C/text%3E%3C/svg%3E";
                      }}
                    />
                    {!image.is_active && (
                      <div className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                        غير نشط
                      </div>
                    )}
                    <div className="absolute top-2 left-2 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-bold">
                      #{image.display_order}
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold mb-2">
                      {image.title || "بدون عنوان"}
                    </h3>
                    {image.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {image.description}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(image)}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDelete(image.id)}
                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
