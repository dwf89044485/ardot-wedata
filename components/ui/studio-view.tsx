"use client";

import React from "react";
import StudioTree from "@/components/ui/studio-tree";
import StudioFileTable from "@/components/ui/studio-file-table";

// ── StudioView ─────────────────────────────────────────────────
// Composes the left directory tree + right file table into a full Studio panel.
export default function StudioView() {
  return (
    <div style={{
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "row",
      overflow: "hidden",
    }}>
      <StudioTree />
      <StudioFileTable />
    </div>
  );
}
