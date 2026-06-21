"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TelephonyPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/dashboard?tab=settings");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-center font-sans">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4" />
        <h2 className="text-sm font-semibold text-slate-400">Redirecting to General Settings...</h2>
      </div>
    </div>
  );
}
