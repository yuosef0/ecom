"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";

export default function ConditionalHeader() {
  const pathname = usePathname();

  // إخفاء الـ Header في صفحات الأدمن و Login و Signup و الصفحة الرئيسية
  const hideHeader =
    pathname?.startsWith("/admin") ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/";

  if (hideHeader) {
    return null;
  }

  return <Header />;
}
