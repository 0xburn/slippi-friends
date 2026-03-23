'use client';

export function OnlineIndicator({ status, size = 'md' }: { status: 'online' | 'in-game' | 'offline'; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = { sm: 'w-2 h-2', md: 'w-3 h-3', lg: 'w-4 h-4' };
  const colorClasses = {
    online: 'bg-[#21BA45] animate-pulse',
    'in-game': 'bg-yellow-400',
    offline: 'bg-gray-500',
  };

  return (
    <span
      className={`inline-block rounded-full ${sizeClasses[size]} ${colorClasses[status]}`}
      title={status}
    />
  );
}
