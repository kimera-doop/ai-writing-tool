"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import CopyButton from "./CopyButton";

interface CollapsibleOutputProps {
  title: string;
  content: string;
  defaultOpen?: boolean;
  onDelete?: () => void;
}

export default function CollapsibleOutput({
  title,
  content,
  defaultOpen = false,
  onDelete,
}: CollapsibleOutputProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("この生成結果を削除しますか？")) {
      onDelete?.();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left cursor-pointer hover:bg-gray-50 rounded-xl transition-colors"
      >
        <div className="flex-1 min-w-0 mr-4">
          <p className="text-xs text-gray-400 mb-0.5">生成済み</p>
          <p className="font-semibold text-gray-900 text-sm truncate">{title}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onDelete && (
            <span
              role="button"
              onClick={handleDelete}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="削除"
            >
              <Trash2 size={14} />
            </span>
          )}
          {isOpen ? (
            <ChevronUp size={16} className="text-gray-400" />
          ) : (
            <ChevronDown size={16} className="text-gray-400" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-gray-100 px-5 pb-5 pt-4">
          <div className="flex justify-end mb-3">
            <CopyButton text={content} />
          </div>
          <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
            {content}
          </pre>
        </div>
      )}
    </div>
  );
}
