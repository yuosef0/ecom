"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#f5f5f5] dark:bg-[#281313] mt-16 py-10">
      <div className="container mx-auto px-4 md:px-8 lg:px-16 grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-right">
        {/* About Section */}
        <div>
          <h3 className="text-xl font-bold mb-4 text-[#333333] dark:text-[#f0f0f0]">متجري</h3>
          <p className="text-[#666666] dark:text-[#aaaaaa]">
            وجهتك الأولى لأحدث صيحات الموضة. نقدم لك أفضل الملابس والأحذية بجودة
            عالية وأسعار تنافسية.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-bold mb-4 text-[#333333] dark:text-[#f0f0f0]">روابط سريعة</h3>
          <ul className="space-y-2">
            <li>
              <Link
                href="/about"
                className="hover:text-[#e60000] transition-colors text-[#666666] dark:text-[#aaaaaa]"
              >
                عنا
              </Link>
            </li>
            <li>
              <Link
                href="/privacy"
                className="hover:text-[#e60000] transition-colors text-[#666666] dark:text-[#aaaaaa]"
              >
                سياسة الخصوصية
              </Link>
            </li>
            <li>
              <Link
                href="/terms"
                className="hover:text-[#e60000] transition-colors text-[#666666] dark:text-[#aaaaaa]"
              >
                شروط الاستخدام
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="hover:text-[#e60000] transition-colors text-[#666666] dark:text-[#aaaaaa]"
              >
                تواصل معنا
              </Link>
            </li>
          </ul>
        </div>

        {/* Categories */}
        <div>
          <h3 className="text-lg font-bold mb-4 text-[#333333] dark:text-[#f0f0f0]">الأقسام</h3>
          <ul className="space-y-2">
            <li>
              <Link
                href="/"
                className="hover:text-[#e60000] transition-colors text-[#666666] dark:text-[#aaaaaa]"
              >
                رجالي
              </Link>
            </li>
            <li>
              <Link
                href="/"
                className="hover:text-[#e60000] transition-colors text-[#666666] dark:text-[#aaaaaa]"
              >
                حريمي
              </Link>
            </li>
            <li>
              <Link
                href="/"
                className="hover:text-[#e60000] transition-colors text-[#666666] dark:text-[#aaaaaa]"
              >
                أطفال
              </Link>
            </li>
            <li>
              <Link
                href="/"
                className="hover:text-[#e60000] transition-colors text-[#666666] dark:text-[#aaaaaa]"
              >
                أحذية
              </Link>
            </li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h3 className="text-lg font-bold mb-4 text-[#333333] dark:text-[#f0f0f0]">تواصل معنا</h3>
          <p className="mb-4 text-[#666666] dark:text-[#aaaaaa]">
            اشترك في نشرتنا البريدية ليصلك كل جديد.
          </p>
          <form className="flex">
            <input
              type="email"
              placeholder="بريدك الإلكتروني"
              className="flex-grow rounded-l-none rounded-r-md border-[#e5e7eb] dark:border-[#4a4a4a] bg-white dark:bg-[#2d1616] focus:ring-[#e60000] px-3 py-2 text-[#333333] dark:text-[#f0f0f0] placeholder:text-[#666666] dark:placeholder:text-[#aaaaaa]"
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
      <div className="text-center text-[#666666] dark:text-[#aaaaaa] mt-8 pt-6 border-t border-[#e5e7eb] dark:border-[#4a4a4a]">
        <p>© 2024 متجري. جميع الحقوق محفوظة.</p>
      </div>
    </footer>
  );
}
