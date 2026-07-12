import { radius } from '@org/theme'
import {
  BookOpen,
  Briefcase,
  Dumbbell,
  Heart,
  Map,
  Mountain,
  PiggyBank,
  Sprout,
  Sword,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react-native'
import { Text, View } from 'react-native'
import { AppText } from '@/components/ui'

/**
 * Goal-type tile for mobile. The backend stores lucide icon names on goal
 * types (see convex/goalTypes.ts); the web renders authored PNG art or
 * emoji stand-ins, but here we ship lucide-react-native, so the real
 * vector icons render in a tinted tile. Unknown icons fall back to the
 * glyph itself (custom emoji) or the type's first letter.
 */
const GOAL_TYPE_ICONS: Record<string, LucideIcon> = {
  heart: Heart,
  dumbbell: Dumbbell,
  briefcase: Briefcase,
  'trending-up': TrendingUp,
  users: Users,
  'piggy-bank': PiggyBank,
  'book-open': BookOpen,
  sprout: Sprout,
  map: Map,
  sword: Sword,
  mountain: Mountain,
}

/** Goal-type color tokens (tailwind names on the backend) → hex. */
const GOAL_TYPE_COLORS: Record<string, string> = {
  amber: '#f59e0b',
  emerald: '#10b981',
  indigo: '#6366f1',
  orange: '#f97316',
  rose: '#f43f5e',
  sky: '#0ea5e9',
  slate: '#64748b',
  violet: '#8b5cf6',
}

export function GoalTypeIcon({
  name,
  color,
  icon,
  size = 44,
}: {
  name: string
  color: string
  icon: string | null
  size?: number
}) {
  const base = GOAL_TYPE_COLORS[color] ?? GOAL_TYPE_COLORS.slate
  const Icon = icon ? GOAL_TYPE_ICONS[icon] : undefined
  // '1f' hex alpha ≈ 12% tint — reads as a soft chip in both schemes.
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.lg,
        backgroundColor: `${base}1f`,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {Icon ? (
        <Icon size={size * 0.5} color={base} strokeWidth={2} />
      ) : icon && /[^\x20-\x7e]/.test(icon) ? (
        <Text style={{ fontSize: size * 0.42, lineHeight: size * 0.55 }}>
          {icon}
        </Text>
      ) : (
        <AppText variant="heading" color={base}>
          {(name.trim()[0] ?? '?').toUpperCase()}
        </AppText>
      )}
    </View>
  )
}
