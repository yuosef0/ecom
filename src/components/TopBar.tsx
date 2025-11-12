"use client";

import React from "react";

const TopBar = () => {
  return (
    <div className="bg-[#e60000] text-white text-sm py-2 px-4 md:px-8 lg:px-16 overflow-hidden">
      <div className="relative h-6">
        <div className="absolute inset-0 flex items-center justify-between">
          {/* Social Icons */}
          <div className="flex items-center gap-3">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
              </svg>
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.011 3.584-.069 4.85c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.85-.07c-3.252-.148-4.771-1.691-4.919-4.919-.058-1.265-.069-1.645-.069-4.85s.011-3.584.069-4.85c.149-3.225 1.664-4.771 4.919-4.919C8.416 2.175 8.796 2.163 12 2.163zm0 1.441c-3.118 0-3.486.012-4.706.068-2.61.12-3.834 1.344-3.954 3.954-.056 1.22-.067 1.588-.067 4.706s.011 3.486.067 4.706c.12 2.61 1.344 3.834 3.954 3.954 1.22.056 1.588.067 4.706.067s3.486-.011 4.706-.067c2.61-.12 3.834-1.344 3.954-3.954.056-1.22.067-1.588.067-4.706s-.011-3.486-.067-4.706c-.12-2.61-1.344-3.834-3.954-3.954-1.22-.056-1.588-.067-4.706-.067zM12 6.883c-2.827 0-5.117 2.29-5.117 5.117s2.29 5.117 5.117 5.117 5.117-2.29 5.117-5.117-2.29-5.117-5.117-5.117zm0 8.792c-2.03 0-3.675-1.645-3.675-3.675s1.645-3.675 3.675-3.675 3.675 1.645 3.675 3.675-1.645 3.675-3.675 3.675zm5.22-8.219c-.588 0-1.065.477-1.065 1.065s.477 1.065 1.065 1.065 1.065-.477 1.065-1.065-.477-1.065-1.065-1.065z"/>
              </svg>
            </a>
          </div>

          {/* Center Text */}
          <p className="font-medium text-center absolute inset-x-0">
            شحن مجاني للطلبات فوق 300 جنيه
          </p>

          {/* Empty space for balance */}
          <div className="hidden md:block w-1/4"></div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
