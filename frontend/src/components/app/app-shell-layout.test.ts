import { describe, expect, it } from 'vitest'

import { appShellHeaderClassName } from './app-shell-layout'

describe('appShellHeaderClassName', () => {
  it('fixes chrome height and border for aligned separators', () => {
    expect(appShellHeaderClassName).toContain('h-14')
    expect(appShellHeaderClassName).toContain('border-border/60')
  })
})