"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-navy-950">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-10 h-10 border-3 border-electric-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 tracking-wider uppercase font-semibold">
          Initializing AI VISION Workspace...
        </p>
      </div>
    </div>
  );
}
