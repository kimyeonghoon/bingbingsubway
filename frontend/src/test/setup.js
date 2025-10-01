import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// 각 테스트 후 자동 cleanup
afterEach(() => {
  cleanup()
})
