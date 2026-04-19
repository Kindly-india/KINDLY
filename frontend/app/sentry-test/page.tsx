'use client'

import * as Sentry from '@sentry/nextjs'
import { useState } from 'react'

export default function SentryTestPage() {
  const [sent, setSent] = useState(false)

  const handleTest = () => {
    Sentry.captureException(new Error('Frontend Sentry test — delete /sentry-test after confirming'))
    setSent(true)
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Sentry Frontend Test</h1>
      <button onClick={handleTest} style={{ padding: '10px 20px', fontSize: 16 }}>
        Send test error to Sentry
      </button>
      {sent && (
        <p style={{ color: 'green', marginTop: 16 }}>
          ✓ Error sent — check Sentry kindly-frontend project
        </p>
      )}
    </div>
  )
}
