"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

/**
 * Custom ThemeProvider menggunakan next-themes untuk mengelola dark/light mode.
 * suppressHydrationWarning pada <html> diperlukan agar tidak flash saat SSR.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange={false} // Diaktifkan agar transisi CSS smooth bisa berjalan
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
