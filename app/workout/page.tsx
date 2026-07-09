'use client'

import { useState } from 'react'
import { createClient } from '../../lib/supabase/client'

type Exercise = {
  name: string
  sets: number
  reps: string
  rest_seconds: number
  rpe: string
  notes: string
}

type WorkoutDay = {
  day_label: string
  warmup: string
  exercises: Exercise[]
}

type WorkoutPlan = {
  plan_name: string
  split_type: string
  days: WorkoutDay[]
}

const inputClass =
  'w-full rounded border border-[#1E2637] bg-[#0A0F1A] px-3 py-2 text-[#F1F5F9] focus:border-[#22D77A] focus:outline-none'
const labelClass = 'text-xs uppercase tracking-widest text-[#8B96A8]'
const cardStyle = { backgroundColor: '#121826', borderColor: '#1E2637' }

export default function WorkoutPage() {
  const [goal, setGoal] = useState('strength')
  const [daysPerWeek, setDaysPerWeek] = useState(3)
  const [equipment, setEquipment] = useState('dumbbells, barbell, pull-up bar')
  const [experienceLevel, setExperienceLevel] = useState('beginner')
  const [sessionDuration, setSessionDuration] = useState(45)
  const [injuries, setInjuries] = useState('')
  const [plan, setPlan] = useState<WorkoutPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  async function handleGenerate() {
    setLoading(true)
    setError('')
    setSaved(false)

    try {
      const res = await fetch('/api/generate-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, daysPerWeek, equipment, experienceLevel, sessionDuration, injuries }),
      })

      if (!res.ok) throw new Error('Generation failed')
      const data: WorkoutPlan = await res.json()
      setPlan(data)
    } catch (err) {
      setError('Could not generate a plan. Try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!plan) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be logged in.')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase.from('workouts').insert({
      user_id: user.id,
      name: plan.plan_name,
      exercises: plan.days,
    })

    setLoading(false)

    if (insertError) {
      setError('Save failed: ' + insertError.message)
      return
    }

    setSaved(true)
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="mb-6 text-3xl" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>
        WORKOUT PLANNER
      </h1>

      <div className="space-y-4 rounded-lg border p-4" style={cardStyle}>
        <div>
          <label className={labelClass}>Goal</label>
          <select value={goal} onChange={(e) => setGoal(e.target.value)} className={`mt-1 ${inputClass}`}>
            <option value="strength">Strength</option>
            <option value="hypertrophy (muscle growth)">Hypertrophy (muscle growth)</option>
            <option value="fat loss">Fat loss</option>
            <option value="general fitness">General fitness</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Experience level</label>
          <select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)} className={`mt-1 ${inputClass}`}>
            <option value="beginner">Beginner (0-1 years training)</option>
            <option value="intermediate">Intermediate (1-3 years)</option>
            <option value="advanced">Advanced (3+ years)</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Days per week</label>
          <input
            type="number"
            min={1}
            max={7}
            value={daysPerWeek}
            onChange={(e) => setDaysPerWeek(Number(e.target.value))}
            className={`mt-1 ${inputClass}`}
          />
        </div>

        <div>
          <label className={labelClass}>Session duration (minutes)</label>
          <select value={sessionDuration} onChange={(e) => setSessionDuration(Number(e.target.value))} className={`mt-1 ${inputClass}`}>
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>60 minutes</option>
            <option value={90}>90 minutes</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Available equipment</label>
          <input type="text" value={equipment} onChange={(e) => setEquipment(e.target.value)} className={`mt-1 ${inputClass}`} />
        </div>

        <div>
          <label className={labelClass}>Injuries or limitations (optional)</label>
          <input
            type="text"
            value={injuries}
            onChange={(e) => setInjuries(e.target.value)}
            placeholder="e.g. lower back pain, knee issues"
            className={`mt-1 ${inputClass}`}
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full rounded py-2 font-semibold uppercase tracking-wide disabled:opacity-50"
          style={{ backgroundColor: '#22D77A', color: '#0A0F1A', fontFamily: 'var(--font-display)' }}
        >
          {loading ? 'Generating...' : 'Generate Plan'}
        </button>
      </div>

      {error && <p className="mt-3 text-sm" style={{ color: '#E5484D' }}>{error}</p>}

      {plan && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>
                {plan.plan_name.toUpperCase()}
              </h2>
              <p className="text-sm text-[#8B96A8]">{plan.split_type}</p>
            </div>
            <button
              onClick={handleSave}
              disabled={loading || saved}
              className="rounded px-4 py-1.5 text-sm font-semibold uppercase disabled:opacity-50"
              style={{ backgroundColor: saved ? '#1E2637' : '#22D77A', color: saved ? '#22D77A' : '#0A0F1A' }}
            >
              {saved ? 'Saved ✓' : 'Save Plan'}
            </button>
          </div>

          {plan.days.map((day, i) => (
            <div key={i} className="rounded-lg border p-4" style={cardStyle}>
              <h3 className="mb-1 font-semibold" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>
                {day.day_label.toUpperCase()}
              </h3>
              {day.warmup && (
                <p className="mb-3 text-xs italic text-[#8B96A8]">Warm-up: {day.warmup}</p>
              )}
              <ul className="space-y-3">
                {day.exercises.map((ex, j) => (
                  <li key={j} className="text-sm">
                    <span className="font-medium">{ex.name}</span>
                    {' — '}
                    <span style={{ fontFamily: 'var(--font-data)', color: '#22D77A' }}>
                      {ex.sets} × {ex.reps}
                    </span>
                    {' · '}
                    <span className="text-[#8B96A8]">{ex.rpe} · rest {ex.rest_seconds}s</span>
                    {ex.notes && <p className="text-[#8B96A8]">{ex.notes}</p>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}