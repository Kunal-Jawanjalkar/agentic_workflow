import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CanvasEmptyState } from './CanvasEmptyState'

describe('CanvasEmptyState', () => {
  it('tells the user to add the first step', () => {
    render(<CanvasEmptyState />)

    expect(screen.getByText('This workflow is empty')).toBeInTheDocument()
    expect(screen.getByText(/Add a step from the left/)).toBeInTheDocument()
  })
})
