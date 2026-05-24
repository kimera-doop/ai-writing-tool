"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyButtonProps {
  text: string;
  className?: string;
}

export default function CopyButton({ text, className = "" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors cursor-pointer ${
        copied
          ? "bg-green-100 text-green-700"
          : "bg-gray-100 hover:bg-gray-200 text-gray-700"
      } ${className}`}
    >
      {copied ? (
        <>
          <Check size={14} />
          コピー済み
        </>
      ) : (
        <>
          <Copy size={14} />
          コピー
        </>
      )}
    </button>
  );
}
