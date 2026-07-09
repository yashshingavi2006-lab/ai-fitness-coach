'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase/client'

type Habit = {
  id: string
  habit_name: string
  completed_dates: string[]
}

function todayString() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function calculateStreak(dates: string[]): number {
  if (!dates || dates.length === 0) return 0
  const sorted = [...dates].sort().reverse()
  const today = todayString()

  let streak = 0
  let checkDate = new Date()

  if (sorted[0] !== today) {
    checkDate.setDate(checkDate.getDate() - 1)
    const yesterday = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`
    if (sorted[0] !== yesterday) return 0
  } else {
    checkDate = new Date()
  }

  for (const dateStr of sorted) {
    const expected = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`
    if (dateStr === expected) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

const inputClass =
  'w-full rounded border border-[#1E2637] bg-[#0A0F1A] px-3 py-2 text-[#F1F5F9] focus:border-[#22D77A] focus:outline-none'
const cardStyle = { backgroundColor: '#121826', borderColor: '#1E2637' }

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [newHabitName, setNewHabitName] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  async function loadHabits() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (!error && data) {
      setHabits(data as Habit[])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadHabits()
  }, [])

  async function handleAddHabit() {
    if (!newHabitName.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('habits').insert({
      user_id: user.id,
      habit_name: newHabitName.trim(),
      completed_dates: [],
    })

    if (!error) {
      setNewHabitName('')
      await loadHabits()
    }
  }

  async function handleToggleToday(habit: Habit) {
    const today = todayString()
    const isDoneToday = habit.completed_dates?.includes(today)

    const updatedDates = isDoneToday
      ? habit.completed_dates.filter((d) => d !== today)
      : [...(habit.completed_dates || []), today]

    const { error } = await supabase
      .from('habits')
      .update({ completed_dates: updatedDates })
      .eq('id', habit.id)

    if (!error) {
      await loadHabits()
    }
  }

  async function handleDeleteHabit(id: string) {
    const { error } = await supabase.from('habits').delete().eq('id', id)
    if (!error) {
      await loadHabits()
    }
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="mb-6 text-3xl" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>
        DAILY HABITS
      </h1>

      <div className="mb-6 flex gap-2">
        <input
          type="text"
          value={newHabitName}
          onChange={(e) => setNewHabitName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddHabit()}
          placeholder="e.g. Drink 3L water"
          className={inputClass}
        />
        <button
          onClick={handleAddHabit}
          className="rounded px-4 py-2 font-semibold uppercase tracking-wide"
          style={{ backgroundColor: '#22D77A', color: '#0A0F1A', fontFamily: 'var(--font-display)' }}
        >
          Add
        </button>
      </div>

      {loading && <p className="text-sm text-[#8B96A8]">Loading...</p>}

      {!loading && habits.length === 0 && (
        <p className="text-sm text-[#8B96A8]">No habits yet — add one above to start tracking.</p>
      )}

      <div className="space-y-3">
        {habits.map((habit) => {
          const today = todayString()
          const isDoneToday = habit.completed_dates?.includes(today)
          const streak = calculateStreak(habit.completed_dates || [])

          return (
            <div
              key={habit.id}
              className="flex items-center justify-between rounded-lg border p-4"
              style={cardStyle}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggleToday(habit)}
                  className="flex h-6 w-6 items-center justify-center rounded border-2 transition-colors"
                  style={{
                    borderColor: isDoneToday ? '#22D77A' : '#1E2637',
                    backgroundColor: isDoneToday ? '#22D77A' : 'transparent',
                  }}
                >
                  {isDoneToday && <span style={{ color: '#0A0F1A' }}>✓</span>}
                </button>
                <div>
                  <p className={`font-medium ${isDoneToday ? 'text-[#8B96A8] line-through' : ''}`}>
                    {habit.habit_name}
                  </p>
                  {streak > 0 && (
                    <p className="text-xs" style={{ fontFamily: 'var(--font-data)', color: '#D9A441' }}>
                      🔥 {streak} day streak
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDeleteHabit(habit.id)}
                className="text-xs uppercase tracking-widest text-[#8B96A8] hover:text-[#E5484D]"
              >
                Delete
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}