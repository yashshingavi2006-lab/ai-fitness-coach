'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ backgroundColor: '#0A0F1A' }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg border p-8"
        style={{ backgroundColor: '#121826', borderColor: '#1E2637' }}
      >
        <h1
          className="text-center text-3xl"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.03em', color: '#F1F5F9' }}
        >
          {isSignUp ? 'CREATE ACCOUNT' : 'LOG IN'}
        </h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded border border-[#1E2637] bg-[#0A0F1A] px-3 py-2 text-[#F1F5F9] placeholder-[#8B96A8] focus:border-[#22D77A] focus:outline-none"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full rounded border border-[#1E2637] bg-[#0A0F1A] px-3 py-2 text-[#F1F5F9] placeholder-[#8B96A8] focus:border-[#22D77A] focus:outline-none"
        />

        {error && <p className="text-sm" style={{ color: '#E5484D' }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded py-2 font-semibold uppercase tracking-wide disabled:opacity-50"
          style={{ backgroundColor: '#22D77A', color: '#0A0F1A', fontFamily: 'var(--font-display)' }}
        >
          {loading ? 'Please wait...' : isSignUp ? 'Sign up' : 'Log in'}
        </button>

        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full text-sm underline"
          style={{ color: '#8B96A8' }}
        >
          {isSignUp ? 'Already have an account? Log in' : "No account? Sign up"}
        </button>
      </form>
    </div>
  )
}