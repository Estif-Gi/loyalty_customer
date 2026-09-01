import React from "react";
import { CheckInView } from "@/features/check-in/components/CheckInView";

export default function OrderStartPage() {
  return (
    <div className="min-h-dvh flex flex-col safe-top px-4">
      <CheckInView />
    </div>
  );
}
