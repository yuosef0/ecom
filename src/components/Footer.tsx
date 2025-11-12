"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-gray-900 mt-16 py-10">
      <div className="container mx-auto px-4 md:px-8 lg:px-16 grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-right">
        {/* About Section */}
        <div>
          <h3 className="text-xl font-bold mb-4">متجري</h3>
          <p className="text-gray-600 dark:text-gray-400">
            وجهتك الأولى لأحدث صيحات الموضة. نقدم لك أفضل الملابس والأحذية بجودة
            عالية وأسعار تنافسية.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-bold mb-4">روابط سريعة</h3>
          <ul className="space-y-2">
            <li>
              <Link
                href="/about"
                className="hover:text-[#e60000] transition-colors text-gray-600 dark:text-gray-400"
              >
                عنا
              </Link>
            </li>
            <li>
              <Link
                href="/privacy"
                className="hover:text-[#e60000] transition-colors text-gray-600 dark:text-gray-400"
              >
                سياسة الخصوصية
              </Link>
            </li>
            <li>
              <Link
                href="/terms"
                className="hover:text-[#e60000] transition-colors text-gray-600 dark:text-gray-400"
              >
                شروط الاستخدام
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="hover:text-[#e60000] transition-colors text-gray-600 dark:text-gray-400"
              >
                تواصل معنا
              </Link>
            </li>
          </ul>
        </div>

        {/* Categories */}
        <div>
          <h3 className="text-lg font-bold mb-4">الأقسام</h3>
          <ul className="space-y-2">
            <li>
              <Link
                href="/"
                className="hover:text-[#e60000] transition-colors text-gray-600 dark:text-gray-400"
              >
                رجالي
              </Link>
            </li>
            <li>
              <Link
                href="/"
                className="hover:text-[#e60000] transition-colors text-gray-600 dark:text-gray-400"
              >
                حريمي
              </Link>
            </li>
            <li>
              <Link
                href="/"
                className="hover:text-[#e60000] transition-colors text-gray-600 dark:text-gray-400"
              >
                أطفال
              </Link>
            </li>
            <li>
              <Link
                href="/"
                className="hover:text-[#e60000] transition-colors text-gray-600 dark:text-gray-400"
              >
                أحذية
              </Link>
            </li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h3 className="text-lg font-bold mb-4">تواصل معنا</h3>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            اشترك في نشرتنا البريدية ليصلك كل جديد.
          </p>
          <form className="flex">
            <input
              type="email"
              placeholder="بريدك الإلكتروني"
              className="flex-grow rounded-l-none rounded-r-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-[#e60000] px-3 py-2"
            />
            <button
              type="submit"
              className="bg-[#e60000] text-white px-4 rounded-r-none rounded-l-md hover:opacity-90 transition-opacity"
            >
              اشتراك
            </button>
          </form>
        </div>
      </div>

      {/* Copyright */}
      <div className="text-center text-gray-600 dark:text-gray-400 mt-8 pt-6 border-t border-gray-300 dark:border-gray-700">
        <p>© 2024 متجري. جميع الحقوق محفوظة.</p>
      </div>
    </footer>
  );
}
