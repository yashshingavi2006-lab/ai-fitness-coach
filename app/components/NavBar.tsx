'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/meal-log', label: 'Meals' },
  { href: '/workout', label: 'Workouts' },
  { href: '/form-check', label: 'Form Check' },
  { href: '/habits', label: 'Habits' },
]

export default function NavBar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (pathname === '/login') return null

  return (
    <nav className="border-b border-[#1E2637] bg-[#0A0F1A] px-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 overflow-x-auto">
          {links.map((link) => {
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative whitespace-nowrap px-4 py-4 text-sm transition-colors"
                style={{
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '0.04em',
                  color: active ? '#F1F5F9' : '#8B96A8',
                }}
              >
                {link.label.toUpperCase()}
                {active && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-[3px]"
                    style={{ backgroundColor: '#22D77A' }}
                  />
                )}
              </Link>
            )
          })}
        </div>
        <button
          onClick={handleLogout}
          className="text-xs uppercase tracking-widest text-[#8B96A8] hover:text-[#22D77A]"
          style={{ fontFamily: 'var(--font-data)' }}
        >
          Log out
        </button>
      </div>
    </nav>
  )
}