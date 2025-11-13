"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "../lib/supabaseClient";

interface ThemeColors {
  primary_color: string;
  primary_hover: string;
  top_bar_bg: string;
  button_text: string;
  price_color: string;
  product_card_bg: string;
}

interface ThemeContextType {
  colors: ThemeColors;
  loading: boolean;
  refreshTheme: () => Promise<void>;
}

const defaultColors: ThemeColors = {
  primary_color: "#e60000",
  primary_hover: "#cc0000",
  top_bar_bg: "#e60000",
  button_text: "#ffffff",
  price_color: "#e60000",
  product_card_bg: "#ffffff",
};

const ThemeContext = createContext<ThemeContextType>({
  colors: defaultColors,
  loading: true,
  refreshTheme: async () => {},
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [colors, setColors] = useState<ThemeColors>(defaultColors);
  const [loading, setLoading] = useState(true);

  const fetchThemeColors = async () => {
    try {
      const { data, error } = await supabase
        .from("theme_settings")
        .select("setting_key, setting_value");

      if (error) {
        console.error("Error fetching theme settings:", error);
        applyColorsToCSS(defaultColors);
        setColors(defaultColors);
        return;
      }

      if (data && data.length > 0) {
        const themeColors: any = {};
        data.forEach((setting) => {
          themeColors[setting.setting_key] = setting.setting_value;
        });

        const finalColors = { ...defaultColors, ...themeColors };
        setColors(finalColors);
        applyColorsToCSS(finalColors);
      } else {
        applyColorsToCSS(defaultColors);
        setColors(defaultColors);
      }
    } catch (error) {
      console.error("Error:", error);
      applyColorsToCSS(defaultColors);
      setColors(defaultColors);
    } finally {
      setLoading(false);
    }
  };

  const applyColorsToCSS = (themeColors: ThemeColors) => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.style.setProperty("--color-primary", themeColors.primary_color);
      root.style.setProperty("--color-primary-hover", themeColors.primary_hover);
      root.style.setProperty("--color-top-bar-bg", themeColors.top_bar_bg);
      root.style.setProperty("--color-button-text", themeColors.button_text);
      root.style.setProperty("--color-price", themeColors.price_color);
      root.style.setProperty("--color-product-card-bg", themeColors.product_card_bg);
    }
  };

  const refreshTheme = async () => {
    await fetchThemeColors();
  };

  useEffect(() => {
    fetchThemeColors();

    // Listen for theme updates (from admin page)
    const handleThemeUpdate = () => {
      fetchThemeColors();
    };

    window.addEventListener("theme-updated", handleThemeUpdate);

    return () => {
      window.removeEventListener("theme-updated", handleThemeUpdate);
    };
  }, []);

  return (
    <ThemeContext.Provider value={{ colors, loading, refreshTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
