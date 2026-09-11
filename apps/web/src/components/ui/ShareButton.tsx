'use client';

import { useState } from 'react';

interface ShareButtonProps {
  url?: string;
  label?: string;
}

export function ShareButton({ url, label = 'Share' }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copyUrl() {
    const shareUrl = url ?? window.location.href;
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      window.prompt('Copy this tournament URL', shareUrl);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      className={`btn btn-secondary share-button${copied ? ' share-button--copied' : ''}`}
      onClick={() => void copyUrl()}
    >
      {copied ? 'Copied!' : label}
    </button>
  );
}
