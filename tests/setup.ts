import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

process.env.PAYLOAD_SECRET ??= 'test-payload-secret-min-32-chars'
process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test'

vi.mock('server-only', () => ({}))
