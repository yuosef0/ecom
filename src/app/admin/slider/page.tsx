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
  const [showForm, setShowForm] = useState(false);

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
      const errorMsg =
        error?.message ||
        error?.error_description ||
        JSON.stringify(error) ||
        "خطأ غير معروف";
      setMessage("❌ خطأ في تحميل الصور: " + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `slider/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error details:", uploadError);
        throw new Error(uploadError.message || "فشل رفع الصورة");
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("product-images").getPublicUrl(filePath);

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

      resetForm();
      fetchSliderImages();
    } catch (error: any) {
      console.error("Error saving slider image:", error);
      const errorMsg =
        error?.message ||
        error?.error_description ||
        error?.hint ||
        JSON.stringify(error) ||
        "خطأ غير معروف";
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
    setPreviewUrl(image.image_url);
    setShowForm(true);
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
      const errorMsg =
        error?.message ||
        error?.error_description ||
        JSON.stringify(error) ||
        "خطأ غير معروف";
      setMessage("❌ خطأ في حذف الصورة: " + errorMsg);
    }
  };

  const moveImage = async (id: string, direction: "up" | "down") => {
    const currentIndex = images.findIndex((img) => img.id === id);
    if (
      currentIndex === -1 ||
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === images.length - 1)
    ) {
      return;
    }

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const currentImage = images[currentIndex];
    const targetImage = images[newIndex];

    try {
      await supabase
        .from("slider_images")
        .update({ display_order: targetImage.display_order })
        .eq("id", currentImage.id);

      await supabase
        .from("slider_images")
        .update({ display_order: currentImage.display_order })
        .eq("id", targetImage.id);

      fetchSliderImages();
    } catch (error) {
      console.error("Error moving image:", error);
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
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#137fec]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="w-full max-w-7xl mx-auto">
        {/* Page Heading */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <h1 className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-tight">
            إدارة السلايدر
          </h1>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center justify-center gap-2 overflow-hidden rounded-lg h-10 px-4 bg-[#137fec] text-white text-sm font-bold leading-normal tracking-wide hover:bg-[#137fec]/90 transition-colors"
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
              <span className="truncate">إضافة جديد</span>
            </button>
          )}
        </div>

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

        {/* Add/Edit Form */}
        {showForm && (
          <section className="bg-white dark:bg-[#182635] p-6 rounded-xl border border-slate-200 dark:border-slate-800 mb-8">
            <h2 className="text-slate-900 dark:text-white text-[22px] font-bold leading-tight tracking-tight pb-5 border-b border-slate-200 dark:border-slate-800">
              {editingId ? "تعديل صورة السلايدر" : "إضافة صورة جديدة للسلايدر"}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
                {/* File Uploader */}
                <div className="lg:col-span-1 flex flex-col gap-4">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    صورة السلايدر
                  </label>

                  {!previewUrl ? (
                    <div className="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 px-6 py-10 text-center">
                      <svg
                        className="w-12 h-12 text-slate-400 dark:text-slate-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <div className="flex flex-col items-center gap-1">
                        <p className="text-slate-900 dark:text-white text-base font-bold leading-tight">
                          اسحب وأفلت الصورة هنا
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-normal">
                          أو
                        </p>
                      </div>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <span className="flex items-center justify-center rounded-lg h-9 px-4 bg-[#137fec]/20 text-[#137fec] text-sm font-bold leading-normal tracking-wide hover:bg-[#137fec]/30 transition-colors">
                          تصفح الملفات
                        </span>
                      </label>
                    </div>
                  ) : (
                    <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-48 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewUrl("");
                          setImageFile(null);
                          setImageUrl("");
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  )}

                  {uploading && (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-4 justify-between">
                        <p className="text-slate-900 dark:text-white text-sm font-medium leading-normal">
                          جاري الرفع...
                        </p>
                      </div>
                      <div className="rounded-full bg-[#137fec]/20 h-2">
                        <div
                          className="h-2 rounded-full bg-[#137fec] animate-pulse"
                          style={{ width: "100%" }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Fields */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                      htmlFor="title"
                    >
                      العنوان
                    </label>
                    <input
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent focus:ring-2 focus:ring-[#137fec]/50 focus:border-[#137fec] dark:text-slate-200 transition"
                      id="title"
                      placeholder="مثال: خصومات نهاية الموسم"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                      htmlFor="description"
                    >
                      الوصف
                    </label>
                    <textarea
                      className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent focus:ring-2 focus:ring-[#137fec]/50 focus:border-[#137fec] dark:text-slate-200 transition"
                      id="description"
                      placeholder="وصف قصير وموجز للعرض"
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    ></textarea>
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                      htmlFor="order"
                    >
                      ترتيب العرض
                    </label>
                    <input
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent focus:ring-2 focus:ring-[#137fec]/50 focus:border-[#137fec] dark:text-slate-200 transition"
                      id="order"
                      type="number"
                      min="1"
                      value={displayOrder}
                      onChange={(e) => setDisplayOrder(parseInt(e.target.value))}
                    />
                  </div>

                  <div className="flex flex-col justify-start">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      الحالة
                    </label>
                    <label
                      className="inline-flex items-center cursor-pointer"
                      htmlFor="status-toggle"
                    >
                      <input
                        checked={isActive}
                        className="sr-only peer"
                        id="status-toggle"
                        type="checkbox"
                        onChange={(e) => setIsActive(e.target.checked)}
                      />
                      <div className="relative w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-[#137fec]"></div>
                      <span className="ms-3 text-sm font-medium text-slate-900 dark:text-slate-300">
                        تفعيل
                      </span>
                    </label>
                  </div>

                  {/* Action Buttons */}
                  <div className="md:col-span-2 flex justify-end items-center gap-3 pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex items-center justify-center rounded-lg h-10 px-4 bg-slate-200 dark:bg-slate-700 dark:text-slate-200 text-slate-800 text-sm font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    >
                      <span className="truncate">إلغاء</span>
                    </button>
                    <button
                      type="submit"
                      disabled={saving || uploading}
                      className="flex items-center justify-center rounded-lg h-10 px-4 bg-[#137fec] text-white text-sm font-bold hover:bg-[#137fec]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="truncate">
                        {uploading
                          ? "جاري رفع الصورة..."
                          : saving
                          ? "جاري الحفظ..."
                          : editingId
                          ? "تحديث"
                          : "حفظ"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </section>
        )}

        {/* Data Table */}
        <section className="bg-white dark:bg-[#182635] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            {images.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                لا توجد صور في السلايدر حالياً
              </div>
            ) : (
              <table className="w-full text-sm text-right text-slate-500 dark:text-slate-400">
                <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-3" scope="col">
                      معاينة
                    </th>
                    <th className="px-6 py-3" scope="col">
                      العنوان
                    </th>
                    <th className="px-6 py-3 min-w-48" scope="col">
                      الوصف
                    </th>
                    <th className="px-6 py-3" scope="col">
                      ترتيب العرض
                    </th>
                    <th className="px-6 py-3" scope="col">
                      الحالة
                    </th>
                    <th className="px-6 py-3" scope="col">
                      إجراءات
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {images.map((image, index) => (
                    <tr
                      key={image.id}
                      className="bg-white dark:bg-[#182635] border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                    >
                      <td className="p-4">
                        <img
                          className="w-24 h-12 object-cover rounded-md"
                          src={image.image_url}
                          alt={image.title || "Slider"}
                        />
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                        {image.title || "بدون عنوان"}
                      </td>
                      <td className="px-6 py-4">
                        {image.description || "لا يوجد وصف"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span>{image.display_order}</span>
                          <div className="flex flex-col">
                            <button
                              onClick={() => moveImage(image.id, "up")}
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
                              onClick={() => moveImage(image.id, "down")}
                              disabled={index === images.length - 1}
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
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {image.is_active ? (
                          <span className="inline-flex items-center bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300">
                            فعال
                          </span>
                        ) : (
                          <span className="inline-flex items-center bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-gray-700 dark:text-gray-300">
                            غير فعال
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => handleEdit(image)}
                            className="text-slate-500 hover:text-[#137fec] dark:hover:text-[#137fec] transition-colors"
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
                            onClick={() => handleDelete(image.id)}
                            className="text-slate-500 hover:text-red-600 dark:hover:text-red-500 transition-colors"
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
        </section>
      </div>
    </div>
  );
}
