"use client";

import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ImageAnalysisWorkspace } from "@/components/image/ImageAnalysisWorkspace";

export default function ImageAnalysisPage() {
  return (
    <DashboardLayout>
      <ImageAnalysisWorkspace />
    </DashboardLayout>
  );
}

