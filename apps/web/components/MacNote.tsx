'use client';

import { useEffect, useState } from 'react';

export function MacNote() {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.userAgent.toLowerCase().includes('mac'));
  }, []);

  if (!isMac) return null;

  return (
    <div className="mx-4 mt-6 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 text-xs text-gray-400">
      <p>
        <span className="font-medium text-yellow-400">Mac users:</span>{' '}
        Until the full release, you may need to run this after installing:
      </p>
      <code className="mt-2 block overflow-x-auto rounded bg-white/5 px-2 py-1.5 text-[11px] text-gray-300">
        xattr -cr &quot;/Applications/friendlies.app&quot;
      </code>
    </div>
  );
}
