import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function GlobalLoading() {
  return (
    <div className="bg-[#050507] text-slate-100 min-h-screen">
      <div className="border-b border-white/[0.08] bg-[#0c0d14] py-2 px-6">
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
        <div className="max-w-xl mx-auto text-center space-y-3">
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3 mx-auto" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
