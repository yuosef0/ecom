// src/app/category/[slug]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import WishlistButton from "../../../components/WishlistButton";
import Footer from "../../../components/Footer";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
}

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  old_price?: number;
  image_url: string | null;
  images: string[];
  stock: number;
  sizes: string[];
  category_id: string;
}

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categorySlug = params?.slug as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategoryAndProducts();
  }, [categorySlug]);

  const fetchCategoryAndProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // جلب بيانات الفئة
      const { data: categoryData, error: categoryError } = await supabase
        .from("categories")
        .select("*")
        .eq("slug", categorySlug)
        .eq("is_active", true)
        .single();

      if (categoryError) {
        console.error("خطأ في جلب الفئة:", categoryError);
        setError("لم يتم العثور على هذه الفئة");
        setLoading(false);
        return;
      }

      setCategory(categoryData);

      // جلب المنتجات الخاصة بالفئة
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("category_id", categoryData.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (productsError) {
        console.error("خطأ في جلب المنتجات:", productsError);
        setError("حدث خطأ في تحميل المنتجات");
      } else {
        setProducts(productsData || []);
      }
    } catch (error) {
      console.error("خطأ:", error);
      setError("حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#e60000] border-t-transparent"></div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
        <h1 className="text-2xl font-bold text-[#333333] dark:text-[#f0f0f0]">
          {error || "الفئة غير موجودة"}
        </h1>
        <Link
          href="/"
          className="px-6 py-3 rounded-lg font-semibold transition-colors"
          style={{
            backgroundColor: "var(--color-primary)",
            color: "var(--color-button-text)",
          }}
        >
          العودة للصفحة الرئيسية
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f9f9f9] dark:bg-[#1a0a0a]">
      <main className="flex-grow">
        <div className="max-w-[1400px] mx-auto px-4 py-8">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 mb-6 text-sm">
            <Link
              href="/"
              className="text-[#666666] dark:text-[#aaaaaa] hover:text-[#e60000] font-medium"
            >
              الرئيسية
            </Link>
            <span className="text-[#666666] dark:text-[#aaaaaa]">/</span>
            <span className="text-[#333333] dark:text-[#f0f0f0] font-medium">
              {category.name}
            </span>
          </div>

          {/* Category Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-black text-[#333333] dark:text-[#f0f0f0] mb-2">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-[#666666] dark:text-[#aaaaaa]">
                {category.description}
              </p>
            )}
            <p className="text-sm text-[#666666] dark:text-[#aaaaaa] mt-2">
              {products.length} منتج
            </p>
          </div>

          {/* Products Grid */}
          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-[#666666] dark:text-[#aaaaaa] mb-4">
                لا توجد منتجات في هذه الفئة حالياً
              </p>
              <Link
                href="/"
                className="inline-block px-6 py-3 rounded-lg font-semibold transition-colors"
                style={{
                  backgroundColor: "var(--color-primary)",
                  color: "var(--color-button-text)",
                }}
              >
                تصفح جميع المنتجات
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product) => {
                const productImage =
                  product.images && product.images.length > 0
                    ? product.images[0]
                    : product.image_url || null;

                const hasDiscount =
                  product.old_price && product.old_price > product.price;
                const discountPercentage = hasDiscount
                  ? Math.round(
                      ((product.old_price! - product.price) /
                        product.old_price!) *
                        100
                    )
                  : 0;

                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug || product.id}`}
                    className="flex flex-col gap-3 pb-3 rounded-lg shadow-sm overflow-hidden group hover:shadow-md transition-shadow duration-300"
                    style={{ backgroundColor: "var(--color-product-card-bg)" }}
                  >
                    <div className="relative w-full aspect-[3/4] overflow-hidden bg-[#f5f5f5] dark:bg-[#281313]">
                      {productImage ? (
                        <img
                          src={productImage}
                          alt={product.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-[#aaaaaa]">
                          <span className="text-4xl">📦</span>
                        </div>
                      )}
                      {hasDiscount && (
                        <span
                          className="absolute top-3 right-3 text-xs font-bold px-2 py-1 rounded z-10"
                          style={{
                            backgroundColor: "var(--color-primary)",
                            color: "var(--color-button-text)",
                          }}
                        >
                          خصم {discountPercentage}%
                        </span>
                      )}
                      {/* Wishlist Button */}
                      <div className="absolute top-3 left-3 z-10">
                        <WishlistButton productId={product.id} variant="icon" />
                      </div>
                    </div>
                    <div className="px-4">
                      <p className="text-base font-medium leading-normal truncate text-[#333333] dark:text-[#f0f0f0]">
                        {product.title}
                      </p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <p
                          className="text-lg font-bold"
                          style={{ color: "var(--color-price)" }}
                        >
                          {product.price.toFixed(2)} جنيه
                        </p>
                        {hasDiscount && (
                          <p className="text-sm font-normal text-[#666666] dark:text-[#aaaaaa] line-through">
                            {product.old_price!.toFixed(2)} جنيه
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
