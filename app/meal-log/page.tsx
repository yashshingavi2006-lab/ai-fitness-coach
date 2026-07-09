'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase/client'

type MealResult = {
  food_name: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

type SavedMeal = MealResult & {
  id: string
  image_url: string
  created_at: string
}

const inputClass =
  'w-full rounded border border-[#1E2637] bg-[#0A0F1A] px-3 py-2 text-[#F1F5F9] focus:border-[#22D77A] focus:outline-none'
const labelClass = 'text-xs uppercase tracking-widest text-[#8B96A8]'
const cardStyle = { backgroundColor: '#121826', borderColor: '#1E2637' }

export default function MealLogPage() {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<MealResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [todaysMeals, setTodaysMeals] = useState<SavedMeal[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<SavedMeal | null>(null)
  const supabase = createClient()

  async function loadTodaysMeals() {
    setHistoryLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setHistoryLoading(false)
      return
    }

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startOfToday.toISOString())
      .order('created_at', { ascending: false })

    if (!error && data) {
      setTodaysMeals(data as SavedMeal[])
    }
    setHistoryLoading(false)
  }

  async function handleUpdateMeal(id: string) {
    if (!editDraft) return
    const { error } = await supabase
      .from('meals')
      .update({
        food_name: editDraft.food_name,
        calories: editDraft.calories,
        protein_g: editDraft.protein_g,
        carbs_g: editDraft.carbs_g,
        fat_g: editDraft.fat_g,
      })
      .eq('id', id)

    if (!error) {
      setEditingId(null)
      await loadTodaysMeals()
    }
  }

  async function handleDeleteMeal(id: string) {
    const { error } = await supabase.from('meals').delete().eq('id', id)
    if (!error) {
      setEditingId(null)
      await loadTodaysMeals()
    }
  }

  useEffect(() => {
    loadTodaysMeals()
  }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
    setResult(null)
    setError('')
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function handleAnalyze() {
    if (!imageFile) return
    setLoading(true)
    setError('')

    try {
      const imageBase64 = await fileToBase64(imageFile)

      const res = await fetch('/api/analyze-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      })

      if (!res.ok) throw new Error('Analysis failed')
      const data: MealResult = await res.json()
      setResult(data)
    } catch (err) {
      setError('Could not analyze this photo. Try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!result || !imageFile) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be logged in.')
      setLoading(false)
      return
    }

    const fileName = `${user.id}/${Date.now()}-${imageFile.name}`
    const { error: uploadError } = await supabase.storage
      .from('meal-photos')
      .upload(fileName, imageFile)

    if (uploadError) {
      setError('Upload failed: ' + uploadError.message)
      setLoading(false)
      return
    }

    const { data: urlData } = supabase.storage.from('meal-photos').getPublicUrl(fileName)

    const { error: insertError } = await supabase.from('meals').insert({
      user_id: user.id,
      image_url: urlData.publicUrl,
      food_name: result.food_name,
      calories: result.calories,
      protein_g: result.protein_g,
      carbs_g: result.carbs_g,
      fat_g: result.fat_g,
    })

    setLoading(false)

    if (insertError) {
      setError('Save failed: ' + insertError.message)
      return
    }

    setImageFile(null)
    setPreview(null)
    setResult(null)
    await loadTodaysMeals()
  }

  const totalCalories = todaysMeals.reduce((sum, m) => sum + (m.calories || 0), 0)

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="mb-6 text-3xl" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>
        LOG A MEAL
      </h1>

      <div className="rounded-lg border p-4" style={cardStyle}>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="mb-4 block w-full text-sm text-[#8B96A8]"
        />

        {preview && <img src={preview} alt="preview" className="mb-4 w-full rounded-lg" />}

        {imageFile && !result && (
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full rounded py-2 font-semibold uppercase tracking-wide disabled:opacity-50"
            style={{ backgroundColor: '#22D77A', color: '#0A0F1A', fontFamily: 'var(--font-display)' }}
          >
            {loading ? 'Analyzing...' : 'Analyze Meal'}
          </button>
        )}
      </div>

      {error && <p className="mt-3 text-sm" style={{ color: '#E5484D' }}>{error}</p>}

      {result && (
        <div className="mt-4 space-y-3 rounded-lg border p-4" style={cardStyle}>
          <p className="text-xs text-[#8B96A8]">AI estimate — edit anything that looks off before saving</p>

          <div>
            <label className={labelClass}>Food</label>
            <input
              type="text"
              value={result.food_name}
              onChange={(e) => setResult({ ...result, food_name: e.target.value })}
              className={`mt-1 ${inputClass}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Calories</label>
              <input
                type="number"
                value={result.calories}
                onChange={(e) => setResult({ ...result, calories: Number(e.target.value) })}
                className={`mt-1 ${inputClass}`}
              />
            </div>
            <div>
              <label className={labelClass}>Protein (g)</label>
              <input
                type="number"
                value={result.protein_g}
                onChange={(e) => setResult({ ...result, protein_g: Number(e.target.value) })}
                className={`mt-1 ${inputClass}`}
              />
            </div>
            <div>
              <label className={labelClass}>Carbs (g)</label>
              <input
                type="number"
                value={result.carbs_g}
                onChange={(e) => setResult({ ...result, carbs_g: Number(e.target.value) })}
                className={`mt-1 ${inputClass}`}
              />
            </div>
            <div>
              <label className={labelClass}>Fat (g)</label>
              <input
                type="number"
                value={result.fat_g}
                onChange={(e) => setResult({ ...result, fat_g: Number(e.target.value) })}
                className={`mt-1 ${inputClass}`}
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="mt-2 w-full rounded py-2 font-semibold uppercase tracking-wide disabled:opacity-50"
            style={{ backgroundColor: '#22D77A', color: '#0A0F1A', fontFamily: 'var(--font-display)' }}
          >
            {loading ? 'Saving...' : 'Save to Log'}
          </button>
        </div>
      )}

      <div className="mt-10 border-t pt-6" style={{ borderColor: '#1E2637' }}>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>
            TODAY
          </h2>
          {!historyLoading && (
            <span style={{ fontFamily: 'var(--font-data)', color: '#22D77A' }} className="text-sm">
              {totalCalories} kcal total
            </span>
          )}
        </div>

        {historyLoading && <p className="text-sm text-[#8B96A8]">Loading...</p>}

        {!historyLoading && todaysMeals.length === 0 && (
          <p className="text-sm text-[#8B96A8]">No meals logged today yet.</p>
        )}

        <div className="space-y-3">
          {todaysMeals.map((meal) =>
            editingId === meal.id ? (
              <div key={meal.id} className="space-y-3 rounded-lg border p-3" style={cardStyle}>
                <input
                  type="text"
                  value={editDraft?.food_name ?? ''}
                  onChange={(e) => setEditDraft({ ...editDraft!, food_name: e.target.value })}
                  className={inputClass}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={editDraft?.calories ?? 0}
                    onChange={(e) => setEditDraft({ ...editDraft!, calories: Number(e.target.value) })}
                    placeholder="Calories"
                    className={inputClass}
                  />
                  <input
                    type="number"
                    value={editDraft?.protein_g ?? 0}
                    onChange={(e) => setEditDraft({ ...editDraft!, protein_g: Number(e.target.value) })}
                    placeholder="Protein"
                    className={inputClass}
                  />
                  <input
                    type="number"
                    value={editDraft?.carbs_g ?? 0}
                    onChange={(e) => setEditDraft({ ...editDraft!, carbs_g: Number(e.target.value) })}
                    placeholder="Carbs"
                    className={inputClass}
                  />
                  <input
                    type="number"
                    value={editDraft?.fat_g ?? 0}
                    onChange={(e) => setEditDraft({ ...editDraft!, fat_g: Number(e.target.value) })}
                    placeholder="Fat"
                    className={inputClass}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateMeal(meal.id)}
                    className="flex-1 rounded py-1.5 text-sm font-semibold uppercase"
                    style={{ backgroundColor: '#22D77A', color: '#0A0F1A' }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => handleDeleteMeal(meal.id)}
                    className="flex-1 rounded py-1.5 text-sm font-semibold uppercase"
                    style={{ backgroundColor: '#E5484D', color: '#0A0F1A' }}
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="flex-1 rounded border py-1.5 text-sm"
                    style={{ borderColor: '#1E2637', color: '#8B96A8' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                key={meal.id}
                onClick={() => {
                  setEditingId(meal.id)
                  setEditDraft(meal)
                }}
                className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:border-[#22D77A]"
                style={cardStyle}
              >
                {meal.image_url && (
                  <img src={meal.image_url} alt={meal.food_name} className="h-14 w-14 rounded object-cover" />
                )}
                <div className="flex-1">
                  <p className="font-medium">{meal.food_name}</p>
                  <p className="text-sm text-[#8B96A8]">
                    <span style={{ fontFamily: 'var(--font-data)', color: '#22D77A' }}>{meal.calories} kcal</span>
                    {' · '}
                    {meal.protein_g}p · {meal.carbs_g}c · {meal.fat_g}f
                  </p>
                </div>
                <span className="text-xs text-[#8B96A8]" style={{ fontFamily: 'var(--font-data)' }}>
                  {new Date(meal.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}