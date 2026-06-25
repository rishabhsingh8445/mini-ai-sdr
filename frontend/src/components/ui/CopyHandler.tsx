"use client";

import { useEffect } from "react";

export function CopyHandler() {
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      const selection = window.getSelection();
      if (selection && selection.toString()) {
        e.preventDefault();
        // Force plain text copy to remove dark mode formatting
        e.clipboardData?.setData("text/plain", selection.toString());
      }
    };

    document.addEventListener("copy", handleCopy);
    return () => document.removeEventListener("copy", handleCopy);
  }, []);

  return null;
}
