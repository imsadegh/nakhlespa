'use client'
import { Wind, Sun, Grape, CloudRain, Sparkles } from 'lucide-react'

const TIER_COLORS: Record<string, string> = {
  red: '#E05C5C',
  yellow: '#D4A929',
  purple: '#9B59B6',
  blue: '#4A90D9',
}

const SYMBOL_ICONS: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>> = {
  circle: Wind,
  triangle: Sun,
  quadrilateral: Grape,
  octagon: CloudRain,
}

type Props = {
  symbol: string | null
  color: string | null
  size?: number
}

export function TierIcon({ symbol, color, size = 20 }: Props) {
  const Icon = symbol ? (SYMBOL_ICONS[symbol] ?? Sparkles) : Sparkles
  const hex = color ? (TIER_COLORS[color] ?? '#C6A55B') : '#C6A55B'
  return <Icon size={size} strokeWidth={1.5} color={hex} />
}
