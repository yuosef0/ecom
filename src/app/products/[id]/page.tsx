"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { useCart } from "../../../contexts/CartContext";
import { useAuth } from "../../../contexts/AuthContext";
import Link from "next/link";
import Footer from "../../../components/Footer";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  old_price?: number;
  images: string[];
  stock: number;
  sizes: string[];
  colors: { name: string; hex: string }[];
  category_id: string;
  category?: Category;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart, cart } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string);
    }
  }, [params.id]);

  const fetchProduct = async (slugOrId: string) => {
    try {
      // التحقق إذا كان المعرف UUID (يحتوي على شرطات) أم slug
      const isUUID = slugOrId.includes("-") && slugOrId.length > 30;

      let data = null;
      let error = null;

      if (isUUID) {
        // البحث بالـ id أولاً
        const result = await supabase
          .from("products")
          .select(`
            *,
            category:categories (
              id,
              name,
              slug
            )
          `)
          .eq("id", slugOrId)
          .single();

        data = result.data;
        error = result.error;
      } else {
        // البحث بالـ slug أولاً
        const result = await supabase
          .from("products")
          .select(`
            *,
            category:categories (
              id,
              name,
              slug
            )
          `)
          .eq("slug", slugOrId)
          .single();

        data = result.data;
        error = result.error;

        // إذا لم يُعثر على المنتج بالـ slug، جرب بالـ id
        if (error && error.code === "PGRST116") {
          const idResult = await supabase
            .from("products")
            .select(`
              *,
              category:categories (
                id,
                name,
                slug
              )
            `)
            .eq("id", slugOrId)
            .single();

          data = idResult.data;
          error = idResult.error;
        }
      }

      if (error) {
        console.error("خطأ Supabase:", error);
        throw error;
      }

      if (data) {
        setProduct(data);
      }
    } catch (error: any) {
      console.error("خطأ في جلب المنتج:", error);
      console.error("Error details:", error?.message, error?.code, error?.details);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    if (!selectedSize && product.sizes && product.sizes.length > 0) {
      setMessage("يرجى اختيار المقاس أولاً");
      return;
    }

    if (!selectedColor && product.colors && product.colors.length > 0) {
      setMessage("يرجى اختيار اللون أولاً");
      return;
    }

    addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
      image_url: images[0] || null,
      stock: product.stock,
      quantity: quantity,
      size: selectedSize,
      color: selectedColor,
    });

    setMessage("");
    router.push("/cart");
  };

  const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#f8f5f5] dark:bg-[#230f0f]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e60000] mx-auto mb-4"></div>
          <p className="text-[#666666] dark:text-[#aaaaaa]">جاري تحميل المنتج...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#f8f5f5] dark:bg-[#230f0f]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#333333] dark:text-[#f0f0f0] mb-4">المنتج غير موجود</h1>
          <Link
            href="/"
            className="text-[#e60000] hover:underline font-medium"
          >
            العودة للصفحة الرئيسية
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [];
  const hasDiscount = product.old_price && product.old_price > product.price;
  const discountPercentage = hasDiscount
    ? Math.round(((product.old_price! - product.price) / product.old_price!) * 100)
    : 0;

  return (
    <div className="relative flex w-full flex-col min-h-screen bg-[#f8f5f5] dark:bg-[#230f0f]">
      <main className="flex-grow">
        <div className="container mx-auto px-4 md:px-8 lg:px-16 py-8">
          {/* Breadcrumbs */}
          <div className="flex flex-wrap gap-2 pb-4 text-sm">
            <Link href="/" className="text-[#666666] dark:text-[#aaaaaa] hover:text-[#e60000] font-medium">
              الرئيسية
            </Link>
            <span className="text-[#666666] dark:text-[#aaaaaa]">/</span>
            {product.category && (
              <>
                <span className="text-[#666666] dark:text-[#aaaaaa] font-medium">
                  {product.category.name}
                </span>
                <span className="text-[#666666] dark:text-[#aaaaaa]">/</span>
              </>
            )}
            <span className="text-[#333333] dark:text-[#f0f0f0] font-medium truncate">
              {product.title}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Right Side: Image Gallery */}
            <div className="flex flex-col gap-4">
              {images.length > 0 ? (
                <>
                  <div className="relative w-full aspect-square bg-white dark:bg-[#2d1616] rounded-xl overflow-hidden shadow-lg">
                    <img
                      src={images[selectedImage]}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => setIsZoomed(!isZoomed)}
                      className="absolute top-4 right-4 bg-white/80 dark:bg-[#2d1616]/80 p-2 rounded-full hover:bg-white dark:hover:bg-[#2d1616] transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                      </svg>
                    </button>
                    {hasDiscount && (
                      <span className="absolute top-4 left-4 bg-[#e60000] text-white text-sm font-bold px-3 py-1 rounded-full">
                        خصم {discountPercentage}%
                      </span>
                    )}
                  </div>
                  {images.length > 1 && (
                    <div className="grid grid-cols-4 gap-3">
                      {images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedImage(idx)}
                          className={`w-full aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                            selectedImage === idx
                              ? "border-[#e60000] ring-2 ring-[#e60000]/30"
                              : "border-[#e5e7eb] dark:border-[#4a4a4a] opacity-60 hover:opacity-100"
                          }`}
                        >
                          <img
                            src={img}
                            alt={`صورة ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full aspect-square bg-[#f5f5f5] dark:bg-[#281313] rounded-xl flex items-center justify-center">
                  <span className="text-6xl">📦</span>
                </div>
              )}
            </div>

            {/* Left Side: Product Details */}
            <div className="flex flex-col gap-6">
              {/* Product Title */}
              <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tight text-[#333333] dark:text-[#f0f0f0]">
                {product.title}
              </h1>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <p className="text-[#e60000] text-3xl font-bold">{product.price.toFixed(2)} جنيه</p>
                {hasDiscount && (
                  <p className="text-[#666666] dark:text-[#aaaaaa] text-xl line-through">
                    {product.old_price!.toFixed(2)} جنيه
                  </p>
                )}
              </div>

              {/* Size Selector */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="flex flex-col gap-3">
                  <h2 className="text-lg font-bold text-[#333333] dark:text-[#f0f0f0]">المقاس:</h2>
                  <div className="flex flex-wrap gap-3">
                    {product.sizes.map((size) => {
                      const isOutOfStock = false; // يمكن إضافة منطق للتحقق من المخزون حسب المقاس
                      return (
                        <button
                          key={size}
                          onClick={() => !isOutOfStock && setSelectedSize(size)}
                          disabled={isOutOfStock}
                          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                            selectedSize === size
                              ? "bg-[#e60000] text-white"
                              : isOutOfStock
                              ? "bg-[#f5f5f5]/50 dark:bg-[#281313]/50 text-[#666666] dark:text-[#aaaaaa] cursor-not-allowed line-through"
                              : "bg-[#f5f5f5] dark:bg-[#281313] text-[#333333] dark:text-[#f0f0f0] hover:bg-[#e60000]/20"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Color Selector */}
              {product.colors && product.colors.length > 0 && (
                <div className="flex flex-col gap-3">
                  <h2 className="text-lg font-bold text-[#333333] dark:text-[#f0f0f0]">
                    اللون:{" "}
                    <span className="font-normal text-[#666666] dark:text-[#aaaaaa]">
                      {selectedColor || "اختر لون"}
                    </span>
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {product.colors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setSelectedColor(color.name)}
                        className={`size-10 rounded-full border-2 transition-all ${
                          selectedColor === color.name
                            ? "ring-2 ring-offset-2 ring-offset-[#f8f5f5] dark:ring-offset-[#230f0f] ring-[#e60000] border-[#e60000]"
                            : "border-[#e5e7eb] dark:border-[#4a4a4a] hover:border-[#e60000]"
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="flex flex-col gap-3">
                <h2 className="text-lg font-bold text-[#333333] dark:text-[#f0f0f0]">الكمية:</h2>
                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-[#e5e7eb] dark:border-[#4a4a4a] rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-4 py-2 text-[#666666] dark:text-[#aaaaaa] hover:text-[#e60000] text-xl font-bold transition-colors"
                    >
                      -
                    </button>
                    <input
                      type="text"
                      value={quantity}
                      readOnly
                      className="w-12 text-center border-x border-[#e5e7eb] dark:border-[#4a4a4a] bg-transparent text-[#333333] dark:text-[#f0f0f0] focus:ring-0 focus:outline-none"
                    />
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="px-4 py-2 text-[#666666] dark:text-[#aaaaaa] hover:text-[#e60000] text-xl font-bold transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-sm text-[#666666] dark:text-[#aaaaaa]">
                    ({product.stock} متوفر)
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 flex items-center justify-center gap-3 h-12 bg-[#e60000] text-white text-base font-bold rounded-lg hover:bg-[#cc0000] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>{product.stock === 0 ? "غير متوفر" : "إضافة إلى السلة"}</span>
                </button>
                <Link
                  href="/"
                  className="flex-1 flex items-center justify-center gap-3 h-12 bg-[#f5f5f5] dark:bg-[#281313] text-[#333333] dark:text-[#f0f0f0] text-base font-bold rounded-lg hover:bg-[#e5e7eb] dark:hover:bg-[#3a1f1f] transition-colors"
                >
                  <span>العودة للمتجر</span>
                </Link>
              </div>

              {/* Error Message */}
              {message && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-[#dc3545]/10 text-[#dc3545] border border-[#dc3545]/20">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium">{message}</p>
                </div>
              )}

              {/* Description Section */}
              <div className="border-t border-[#e5e7eb] dark:border-[#4a4a4a] pt-6 mt-2">
                <div className="flex flex-col">
                  <details className="border-b border-[#e5e7eb] dark:border-[#4a4a4a] py-4 group" open>
                    <summary className="flex justify-between items-center cursor-pointer list-none">
                      <h3 className="font-bold text-[#333333] dark:text-[#f0f0f0]">الوصف</h3>
                      <svg className="w-5 h-5 transition-transform duration-300 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="mt-4 text-[#666666] dark:text-[#aaaaaa] leading-relaxed">
                      {product.description || "لا يوجد وصف متاح لهذا المنتج."}
                    </div>
                  </details>

                  <details className="border-b border-[#e5e7eb] dark:border-[#4a4a4a] py-4 group">
                    <summary className="flex justify-between items-center cursor-pointer list-none">
                      <h3 className="font-bold text-[#333333] dark:text-[#f0f0f0]">تفاصيل المنتج</h3>
                      <svg className="w-5 h-5 transition-transform duration-300 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <ul className="mt-4 mr-5 list-disc text-[#666666] dark:text-[#aaaaaa] space-y-2">
                      <li>المخزون المتاح: {product.stock} قطعة</li>
                      {product.sizes && product.sizes.length > 0 && (
                        <li>المقاسات المتوفرة: {product.sizes.join(", ")}</li>
                      )}
                      {product.colors && product.colors.length > 0 && (
                        <li>الألوان المتوفرة: {product.colors.map(c => c.name).join(", ")}</li>
                      )}
                    </ul>
                  </details>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
