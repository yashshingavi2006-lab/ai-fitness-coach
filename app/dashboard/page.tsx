'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { createClient } from '../../lib/supabase/client'

type DayCalories = { day: string; calories: number }
type HabitSummary = { habit_name: string; completed_dates: string[] }

export default function DashboardPage() {
  const [calorieData, setCalorieData] = useState<DayCalories[]>([])
  const [habits, setHabits] = useState<HabitSummary[]>([])
  const [workoutCount, setWorkoutCount] = useState(0)
  const [formCheckCount, setFormCheckCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadDashboard() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
      sevenDaysAgo.setHours(0, 0, 0, 0)

      const { data: meals } = await supabase
        .from('meals')
        .select('calories, created_at')
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString())

      const dayBuckets: Record<string, number> = {}
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const label = d.toLocaleDateString('en-US', { weekday: 'short' })
        dayBuckets[label] = 0
      }
      meals?.forEach((meal) => {
        const label = new Date(meal.created_at).toLocaleDateString('en-US', { weekday: 'short' })
        if (label in dayBuckets) {
          dayBuckets[label] += meal.calories || 0
        }
      })
      setCalorieData(Object.entries(dayBuckets).map(([day, calories]) => ({ day, calories })))

      const { data: habitData } = await supabase
        .from('habits')
        .select('habit_name, completed_dates')
        .eq('user_id', user.id)
      setHabits((habitData as HabitSummary[]) || [])

      const { count: wCount } = await supabase
        .from('workouts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
      setWorkoutCount(wCount || 0)

      const { count: fCount } = await supabase
        .from('form_checks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
      setFormCheckCount(fCount || 0)

      setLoading(false)
    }

    loadDashboard()
  }, [])

  function last7Days(): string[] {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
    }
    return days
  }

  if (loading) {
    return <div className="p-6 text-sm text-[#8B96A8]">Loading dashboard...</div>
  }

  const days = last7Days()
  const cardStyle = { backgroundColor: '#121826', borderColor: '#1E2637' }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1
        className="mb-6 text-3xl"
        style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}
      >
        DASHBOARD
      </h1>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg border p-4" style={cardStyle}>
          <p className="text-xs uppercase tracking-widest text-[#8B96A8]">Saved Workouts</p>
          <p
            className="mt-1 text-3xl"
            style={{ fontFamily: 'var(--font-data)', color: '#22D77A' }}
          >
            {workoutCount}
          </p>
        </div>
        <div className="rounded-lg border p-4" style={cardStyle}>
          <p className="text-xs uppercase tracking-widest text-[#8B96A8]">Form Checks</p>
          <p
            className="mt-1 text-3xl"
            style={{ fontFamily: 'var(--font-data)', color: '#22D77A' }}
          >
            {formCheckCount}
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-lg border p-4" style={cardStyle}>
        <h2
          className="mb-3 text-lg uppercase tracking-wide"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Calories — Last 7 Days
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={calorieData}>
            <XAxis dataKey="day" fontSize={12} stroke="#8B96A8" />
            <YAxis fontSize={12} stroke="#8B96A8" />
            <Tooltip
              contentStyle={{ backgroundColor: '#0A0F1A', border: '1px solid #1E2637', borderRadius: '6px' }}
              labelStyle={{ color: '#F1F5F9' }}
            />
            <Bar dataKey="calories" fill="#22D77A" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-lg border p-4" style={cardStyle}>
        <h2
          className="mb-3 text-lg uppercase tracking-wide"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Habit Consistency — Last 7 Days
        </h2>
        {habits.length === 0 && (
          <p className="text-sm text-[#8B96A8]">No habits tracked yet.</p>
        )}
        <div className="space-y-3">
          {habits.map((habit) => (
            <div key={habit.habit_name}>
              <p className="mb-1 text-sm font-medium">{habit.habit_name}</p>
              <div className="flex gap-1">
                {days.map((day) => {
                  const done = habit.completed_dates?.includes(day)
                  return (
                    <div
                      key={day}
                      title={day}
                      className="h-6 w-6 rounded"
                      style={{ backgroundColor: done ? '#22D77A' : '#1E2637' }}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}