import { cn } from '../utils'

describe('Utils', () => {
  describe('cn (classname utility)', () => {
    it('should merge class names correctly', () => {
      const result = cn('px-4', 'py-2', 'bg-blue-500')
      expect(result).toBe('px-4 py-2 bg-blue-500')
    })

    it('should handle conditional classes', () => {
      const result = cn('px-4', true && 'py-2', false && 'bg-red-500', 'text-white')
      expect(result).toBe('px-4 py-2 text-white')
    })

    it('should handle undefined and null values', () => {
      const result = cn('px-4', undefined, null, 'py-2')
      expect(result).toBe('px-4 py-2')
    })

    it('should handle empty input', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('should handle object-style classes', () => {
      const result = cn('px-4', {
        'bg-blue-500': true,
        'bg-red-500': false,
        'text-white': true,
      })
      expect(result).toContain('px-4')
      expect(result).toContain('bg-blue-500')
      expect(result).toContain('text-white')
      expect(result).not.toContain('bg-red-500')
    })
  })
})