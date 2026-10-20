import { avatarGradient, initials } from '@/lib/format';

const SIZES = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
} as const;

export function Avatar({
  id,
  name,
  size = 'md',
}: {
  id: string;
  name: string;
  size?: keyof typeof SIZES;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white shadow-inner ring-1 ring-white/10 ${avatarGradient(id)} ${SIZES[size]}`}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
