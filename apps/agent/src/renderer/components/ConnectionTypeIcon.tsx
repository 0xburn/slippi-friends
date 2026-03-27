interface ConnectionTypeIconProps {
  type: 'wifi' | 'ethernet' | null;
  className?: string;
}

function WifiIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <circle cx="12" cy="20" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function EthernetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="8" width="20" height="8" rx="2" />
      <line x1="6" y1="12" x2="6" y2="12.01" />
      <line x1="10" y1="12" x2="10" y2="12.01" />
      <line x1="14" y1="12" x2="14" y2="12.01" />
      <line x1="18" y1="12" x2="18" y2="12.01" />
    </svg>
  );
}

export function ConnectionTypeIcon({ type, className }: ConnectionTypeIconProps) {
  if (!type) return null;

  const color = type === 'ethernet' ? 'text-[#21BA45]/60' : 'text-yellow-500/60';
  const label = type === 'ethernet' ? 'Ethernet' : 'Wi-Fi';

  return (
    <span className={`inline-flex items-center ${color}`} title={label}>
      {type === 'wifi' ? (
        <WifiIcon className={className || 'w-3.5 h-3.5'} />
      ) : (
        <EthernetIcon className={className || 'w-3.5 h-3.5'} />
      )}
    </span>
  );
}
