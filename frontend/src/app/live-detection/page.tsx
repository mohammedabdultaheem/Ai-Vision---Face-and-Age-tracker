"use client";

import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LiveWebcamWorkspace } from "@/components/camera/LiveWebcamWorkspace";

export default function LiveDetectionPage() {
  return (
    <DashboardLayout>
      <LiveWebcamWorkspace />
    </DashboardLayout>
  );
}

