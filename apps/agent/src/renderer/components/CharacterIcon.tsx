import { getCharacterShortName, getCharacterImagePath } from '../lib/characters';

export function CharacterIcon({ characterId, showName = false, size = 'md' }: {
  characterId: number; showName?: boolean; size?: 'sm' | 'md' | 'lg';
}) {
  const name = getCharacterShortName(characterId);
  const imgPath = getCharacterImagePath(characterId);
  const sizes = { sm: 'h-5', md: 'h-7', lg: 'h-9' };

  if (!imgPath) {
    const hue = (characterId * 37) % 360;
    const boxSizes = { sm: 'w-5 h-5 text-[10px]', md: 'w-7 h-7 text-xs', lg: 'w-9 h-9 text-sm' };
    return (
      <div className="inline-flex items-center gap-1.5">
        <div className={`${boxSizes[size]} rounded-full flex items-center justify-center font-bold font-mono`}
          style={{ backgroundColor: `hsl(${hue}, 50%, 20%)`, color: `hsl(${hue}, 70%, 70%)`, border: `1px solid hsl(${hue}, 50%, 35%)` }}
          title={name}>
          {name.slice(0, 2)}
        </div>
        {showName && <span className="text-sm text-gray-300">{name}</span>}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 shrink-0">
      <img
        src={imgPath}
        alt={name}
        title={name}
        className={`${sizes[size]} object-contain`}
        loading="lazy"
      />
      {showName && <span className="text-sm text-gray-300">{name}</span>}
    </div>
  );
}
