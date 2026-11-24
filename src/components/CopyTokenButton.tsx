'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function CopyTokenButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const fullUrl = `${window.location.origin}/e/${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg font-medium transition-colors"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-green-600" /> Скопійовано
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" /> Скопіювати посилання
        </>
      )}
    </button>
  );
}
