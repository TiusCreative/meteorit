"use client";

import axios from "axios";
import { useState } from "react";
import Script from "next/script";

interface DonationButtonProps {
  amount: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function DonationButton({ amount, onSuccess, onError }: DonationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDonation = async () => {
    setIsLoading(true);
    try {
      // 1. Kirim request ke backend untuk mendapatkan Snap Token
      const response = await axios.post("/api/donations", {
        amount,
        email: "user@example.com", // Ganti dengan email pengguna yang login
      });

      const { snapToken } = response.data;

      // 2. Buka popup Midtrans Snap.js
      if ((window as any).snap) {
        (window as any).snap.pay(snapToken, {
          onSuccess: () => {
            setIsLoading(false);
            if (onSuccess) onSuccess();
          },
          onPending: () => {
            setIsLoading(false);
            if (onError) onError("Pembayaran tertunda.");
          },
          onError: (error: any) => {
            setIsLoading(false);
            if (onError) onError(error.message || "Pembayaran gagal.");
          },
        });
      } else {
        throw new Error("Midtrans Snap.js tidak terload.");
      }
    } catch (error) {
      setIsLoading(false);
      if (onError) onError("Gagal memulai pembayaran.");
      console.error("Error:", error);
    }
  };

  return (
    <>
      <Script
        src="https://app.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="afterInteractive"
      />
      <button
        onClick={handleDonation}
        disabled={isLoading}
        className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded"
      >
        {isLoading ? "Memproses..." : `Donasi Rp${amount}`}
      </button>
    </>
  );
}