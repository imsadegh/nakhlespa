import { describe, expect, test } from 'bun:test'
import { resolveSidebarState } from '@/components/ui/sidebar'

describe('sidebar state', () => {
  test('expands while pinned, hovered, or focused', () => {
    expect(resolveSidebarState(true, false, false)).toBe('expanded')
    expect(resolveSidebarState(false, true, false)).toBe('expanded')
    expect(resolveSidebarState(false, false, true)).toBe('expanded')
  })

  test('collapses when unpinned and neither hovered nor focused', () => {
    expect(resolveSidebarState(false, false, false)).toBe('collapsed')
  })
})
