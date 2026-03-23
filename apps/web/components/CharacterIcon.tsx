import { getCharacterShortName } from '@/lib/characters';

export function CharacterIcon({ characterId, showName = false, size = 'md' }: {
  characterId: number;
  showName?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const name = getCharacterShortName(characterId);
  const hue = (characterId * 37) % 360;
  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold font-mono`}
        style={{
          backgroundColor: `hsl(${hue}, 50%, 20%)`,
          color: `hsl(${hue}, 70%, 70%)`,
          border: `1px solid hsl(${hue}, 50%, 35%)`,
        }}
        title={name}
      >
        {name.slice(0, 2)}
      </div>
      {showName && <span className="text-sm text-gray-300">{name}</span>}
    </div>
  );
}
