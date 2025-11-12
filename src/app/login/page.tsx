"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { signInWithEmail, signInWithGoogle, user } = useAuth();
  const router = useRouter();

  // إذا كان المستخدم مسجل الدخول، توجيهه للصفحة الرئيسية
  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await signInWithEmail(email, password);

    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "البريد الإلكتروني أو كلمة المرور غير صحيحة"
          : error.message
      );
      setLoading(false);
    } else {
      router.push("/");
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    const { error } = await signInWithGoogle();

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  if (user) {
    return null; // سيتم التوجيه تلقائياً
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-[#f8f5f5] dark:bg-[#230f0f] p-4">
      <div className="w-full max-w-md rounded-xl bg-white dark:bg-[#2c1a1a] p-6 shadow-sm sm:p-8 md:p-10">
        {/* Logo and Title */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#e60000]/10">
            <svg
              className="w-8 h-8 text-[#e60000]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-black leading-tight tracking-tight text-[#1d0c0c] dark:text-[#fcf8f8]">
              أهلاً بعودتك!
            </h1>
            <p className="text-base font-normal leading-normal text-[#a14545] dark:text-[#eacdcd]">
              سجّل الدخول للمتابعة إلى متجرك.
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form className="flex flex-col gap-5" onSubmit={handleEmailLogin}>
          <div className="flex flex-col gap-4">
            {/* Email Field */}
            <label className="flex flex-col">
              <p className="pb-2 text-base font-medium leading-normal text-[#1d0c0c] dark:text-[#fcf8f8]">
                البريد الإلكتروني
              </p>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input h-14 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-[#eacdcd] dark:border-[#5a4848] bg-[#fcf8f8] dark:bg-[#382626] p-[15px] text-base font-normal leading-normal text-[#1d0c0c] dark:text-[#fcf8f8] placeholder:text-[#a14545] dark:placeholder:text-[#b49898] focus:border-[#e60000] dark:focus:border-[#e60000] focus:outline-0 focus:ring-0"
                placeholder="أدخل بريدك الإلكتروني"
              />
            </label>

            {/* Password Field */}
            <div className="flex flex-col">
              <label className="flex flex-col">
                <p className="pb-2 text-base font-medium leading-normal text-[#1d0c0c] dark:text-[#fcf8f8]">
                  كلمة المرور
                </p>
                <div className="relative flex w-full flex-1 items-stretch">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input h-14 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-[#eacdcd] dark:border-[#5a4848] bg-[#fcf8f8] dark:bg-[#382626] p-[15px] pr-12 text-base font-normal leading-normal text-[#1d0c0c] dark:text-[#fcf8f8] placeholder:text-[#a14545] dark:placeholder:text-[#b49898] focus:border-[#e60000] dark:focus:border-[#e60000] focus:outline-0 focus:ring-0"
                    placeholder="أدخل كلمة المرور"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 left-0 flex items-center pl-3 pr-[15px] cursor-pointer"
                  >
                    <svg
                      className="w-6 h-6 text-[#a14545] dark:text-[#eacdcd] hover:text-[#e60000] dark:hover:text-[#e60000] transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {showPassword ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      ) : (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      )}
                    </svg>
                  </button>
                </div>
              </label>
              <Link
                href="#"
                className="mt-2 text-sm font-normal leading-normal text-[#a14545] dark:text-[#eacdcd] underline hover:text-[#e60000] dark:hover:text-white transition-colors"
              >
                هل نسيت كلمة المرور؟
              </Link>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-100 dark:bg-red-900/30 p-3 text-center text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex flex-col gap-4 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex h-12 min-w-[84px] max-w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-[#e60000] px-5 text-base font-bold leading-normal tracking-[0.015em] text-[#fcf8f8] transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="truncate">
                {loading ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
              </span>
            </button>

            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-[#eacdcd] dark:border-[#5a4848] bg-[#f8f5f5] dark:bg-[#382626] px-5 text-base font-medium text-[#1d0c0c] dark:text-[#fcf8f8] transition-colors hover:bg-gray-100 dark:hover:bg-[#432f2f] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M22.56 12.25C22.56 11.45 22.49 10.68 22.36 9.92H12V14.26H18.04C17.74 15.65 16.92 16.85 15.77 17.61V20.12H19.52C21.55 18.21 22.56 15.47 22.56 12.25Z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23C14.97 23 17.45 22.04 19.52 20.12L15.77 17.61C14.79 18.25 13.51 18.63 12 18.63C9.31 18.63 7.06 16.89 6.21 14.56H2.33V17.14C4.33 20.61 7.89 23 12 23Z"
                  fill="#34A853"
                />
                <path
                  d="M6.21 14.56C5.97 13.84 5.82 13.08 5.82 12.29C5.82 11.5 5.97 10.74 6.21 10.02V7.44H2.33C1.52 9.02 1 10.6 1 12.29C1 13.98 1.52 15.56 2.33 17.14L6.21 14.56Z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.96C13.67 5.96 15.06 6.57 16.14 7.58L19.6 4.11C17.45 2.14 14.97 1 12 1C7.89 1 4.33 3.39 2.33 7.44L6.21 10.02C7.06 7.69 9.31 5.96 12 5.96Z"
                  fill="#EA4335"
                />
              </svg>
              <span>المتابعة باستخدام Google</span>
            </button>
          </div>
        </form>

        {/* Sign Up Link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-[#a14545] dark:text-[#eacdcd]">
            ليس لديك حساب؟{" "}
            <Link
              href="/signup"
              className="font-bold text-[#e60000] underline-offset-2 hover:underline"
            >
              أنشئ حساباً جديداً
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
