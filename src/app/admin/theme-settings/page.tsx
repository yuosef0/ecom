"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";

interface ThemeSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_label: string;
  setting_description: string;
}

export default function AdminThemeSettingsPage() {
  const [settings, setSettings] = useState<ThemeSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("theme_settings")
        .select("*")
        .order("setting_key");

      if (error) throw error;
      setSettings(data || []);

      // Initialize form data with current values
      const initialData: Record<string, string> = {};
      data?.forEach((setting) => {
        initialData[setting.setting_key] = setting.setting_value;
      });
      setFormData(initialData);
    } catch (error: any) {
      console.error("خطأ في جلب الإعدادات:", error);
      setMessage("❌ فشل في جلب الإعدادات");
    } finally {
      setLoading(false);
    }
  };

  const handleColorChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      // Update each setting
      for (const [key, value] of Object.entries(formData)) {
        const { error } = await supabase
          .from("theme_settings")
          .update({ setting_value: value })
          .eq("setting_key", key);

        if (error) throw error;
      }

      setMessage("✅ تم حفظ الألوان بنجاح! قم بتحديث الصفحة لرؤية التغييرات");

      // Refresh settings
      await fetchSettings();

      // Trigger a custom event to notify ThemeProvider
      window.dispatchEvent(new Event("theme-updated"));
    } catch (error: any) {
      console.error("خطأ:", error);
      setMessage("❌ فشل في الحفظ: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    const defaults: Record<string, string> = {
      primary_color: "#e60000",
      primary_hover: "#cc0000",
      top_bar_bg: "#e60000",
      button_text: "#ffffff",
      price_color: "#e60000",
      product_card_bg: "#ffffff",
    };
    setFormData(defaults);
    setMessage("⚠️ تم إعادة تعيين الألوان الافتراضية. اضغط 'حفظ' لتطبيق التغييرات");
  };

  return (
    <div className="p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-tight">
            إعدادات ألوان الموقع
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            تحكم في الألوان الأساسية للموقع
          </p>
        </header>

        {/* Message Alert */}
        {message && (
          <div
            className={`p-4 rounded-lg mb-6 ${
              message.includes("✅")
                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                : message.includes("⚠️")
                ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400"
                : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400"
            }`}
          >
            {message}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Color Settings Grid */}
            <div className="bg-white dark:bg-[#182635] rounded-lg p-6 border border-slate-200 dark:border-slate-800 mb-6">
              <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">
                الألوان الأساسية
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {settings.map((setting) => (
                  <div
                    key={setting.id}
                    className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-[#0d1b2a]"
                  >
                    <label className="block mb-3">
                      <span className="text-slate-900 dark:text-white font-semibold text-lg">
                        {setting.setting_label}
                      </span>
                      {setting.setting_description && (
                        <span className="block text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {setting.setting_description}
                        </span>
                      )}
                    </label>

                    <div className="flex items-center gap-4">
                      {/* Color Picker */}
                      <div className="relative">
                        <input
                          type="color"
                          value={formData[setting.setting_key] || setting.setting_value}
                          onChange={(e) =>
                            handleColorChange(setting.setting_key, e.target.value)
                          }
                          className="w-20 h-20 rounded-lg cursor-pointer border-2 border-slate-300 dark:border-slate-600"
                        />
                      </div>

                      {/* Hex Input */}
                      <div className="flex-1">
                        <input
                          type="text"
                          value={formData[setting.setting_key] || setting.setting_value}
                          onChange={(e) =>
                            handleColorChange(setting.setting_key, e.target.value)
                          }
                          placeholder="#000000"
                          pattern="^#[0-9A-Fa-f]{6}$"
                          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-[#0d1b2a] text-slate-900 dark:text-white font-mono text-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Preview */}
                      <div
                        className="w-16 h-16 rounded-lg border-2 border-slate-300 dark:border-slate-600 shadow-inner"
                        style={{
                          backgroundColor: formData[setting.setting_key] || setting.setting_value,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Preview */}
            <div className="bg-white dark:bg-[#182635] rounded-lg p-6 border border-slate-200 dark:border-slate-800 mb-6">
              <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
                معاينة الألوان
              </h2>

              <div className="space-y-4">
                {/* Top Bar Preview */}
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    الشريط الأحمر:
                  </p>
                  <div
                    className="p-4 rounded-lg text-white text-center font-semibold"
                    style={{ backgroundColor: formData.top_bar_bg || "#e60000" }}
                  >
                    شحن مجاني للطلبات فوق 300 جنيه
                  </div>
                </div>

                {/* Buttons Preview */}
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    الأزرار:
                  </p>
                  <div className="flex gap-4 flex-wrap">
                    <button
                      type="button"
                      className="px-6 py-3 rounded-lg font-semibold transition-colors"
                      style={{
                        backgroundColor: formData.primary_color || "#e60000",
                        color: formData.button_text || "#ffffff",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = formData.primary_hover || "#cc0000";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = formData.primary_color || "#e60000";
                      }}
                    >
                      إضافة للسلة
                    </button>
                    <button
                      type="button"
                      className="px-6 py-3 rounded-lg font-semibold transition-colors"
                      style={{
                        backgroundColor: formData.primary_color || "#e60000",
                        color: formData.button_text || "#ffffff",
                      }}
                    >
                      شراء الآن
                    </button>
                  </div>
                </div>

                {/* Price Preview */}
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    الأسعار:
                  </p>
                  <div className="flex gap-4 items-baseline">
                    <p className="text-2xl font-bold" style={{ color: formData.price_color || "#e60000" }}>
                      299.00 جنيه
                    </p>
                    <p className="text-lg text-gray-500 line-through">
                      399.00 جنيه
                    </p>
                  </div>
                </div>

                {/* Product Card Preview */}
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    كارد المنتج:
                  </p>
                  <div
                    className="max-w-xs rounded-lg shadow-md overflow-hidden"
                    style={{ backgroundColor: formData.product_card_bg || "#ffffff" }}
                  >
                    <div className="aspect-[3/4] bg-gray-200 flex items-center justify-center">
                      <span className="text-4xl">📦</span>
                    </div>
                    <div className="p-4">
                      <p className="text-base font-medium text-gray-900 mb-2">
                        اسم المنتج
                      </p>
                      <p className="text-lg font-bold" style={{ color: formData.price_color || "#e60000" }}>
                        299.00 جنيه
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end">
              <button
                type="button"
                onClick={resetToDefaults}
                className="px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg font-medium transition-colors"
              >
                إعادة تعيين للافتراضي
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
