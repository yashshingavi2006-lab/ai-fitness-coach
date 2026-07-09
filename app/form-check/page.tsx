'use client'

import { useState } from 'react'
import { createClient } from '../../lib/supabase/client'

type FormResult = {
  exercise_identified: string
  overall_assessment: string
  strengths: string[]
  corrections: string[]
  safety_flag: string
}

const inputClass =
  'w-full rounded border border-[#1E2637] bg-[#0A0F1A] px-3 py-2 text-[#F1F5F9] focus:border-[#22D77A] focus:outline-none'
const labelClass = 'text-xs uppercase tracking-widest text-[#8B96A8]'
const cardStyle = { backgroundColor: '#121826', borderColor: '#1E2637' }

export default function FormCheckPage() {
  const [exerciseName, setExerciseName] = useState('squat')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [result, setResult] = useState<FormResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 20 * 1024 * 1024) {
      setError('Video too large — keep clips under 20MB (roughly 15-20 seconds).')
      return
    }

    setVideoFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setResult(null)
    setError('')
    setSaved(false)
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
    if (!videoFile) return
    setLoading(true)
    setError('')

    try {
      const videoBase64 = await fileToBase64(videoFile)

      const res = await fetch('/api/analyze-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoBase64,
          mimeType: videoFile.type,
          exerciseName,
        }),
      })

      if (!res.ok) throw new Error('Analysis failed')
      const data: FormResult = await res.json()
      setResult(data)
    } catch (err) {
      setError('Could not analyze this video. Try a shorter clip or different angle.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!result || !videoFile) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be logged in.')
      setLoading(false)
      return
    }

    const fileName = `${user.id}/${Date.now()}-${videoFile.name}`
    const { error: uploadError } = await supabase.storage
      .from('form-videos')
      .upload(fileName, videoFile)

    let videoUrl = ''
    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('form-videos').getPublicUrl(fileName)
      videoUrl = urlData.publicUrl
    }

    const feedbackText = `${result.overall_assessment}\n\nStrengths: ${result.strengths.join('; ')}\n\nCorrections: ${result.corrections.join('; ')}${result.safety_flag ? '\n\n⚠️ ' + result.safety_flag : ''}`

    const { error: insertError } = await supabase.from('form_checks').insert({
      user_id: user.id,
      exercise_name: result.exercise_identified || exerciseName,
      feedback: feedbackText,
      video_url: videoUrl,
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
        FORM CHECK
      </h1>

      <div className="space-y-4 rounded-lg border p-4" style={cardStyle}>
        <div>
          <label className={labelClass}>What exercise is this?</label>
          <input
            type="text"
            value={exerciseName}
            onChange={(e) => setExerciseName(e.target.value)}
            className={`mt-1 ${inputClass}`}
          />
        </div>

        <div>
          <label className={labelClass}>Record or upload a short clip (10-15 sec, side angle works best)</label>
          <input
            type="file"
            accept="video/*"
            capture="environment"
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm text-[#8B96A8]"
          />
        </div>

        {previewUrl && <video src={previewUrl} controls className="w-full rounded-lg" />}

        {videoFile && !result && (
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full rounded py-2 font-semibold uppercase tracking-wide disabled:opacity-50"
            style={{ backgroundColor: '#22D77A', color: '#0A0F1A', fontFamily: 'var(--font-display)' }}
          >
            {loading ? 'Analyzing form... (this can take 30-60s)' : 'Analyze Form'}
          </button>
        )}
      </div>

      {error && <p className="mt-3 text-sm" style={{ color: '#E5484D' }}>{error}</p>}

      {result && (
        <div className="mt-4 space-y-3 rounded-lg border p-4" style={cardStyle}>
          <div>
            <p className={labelClass}>Identified movement</p>
            <p className="font-semibold" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.01em' }}>
              {result.exercise_identified}
            </p>
          </div>

          <p className="text-sm">{result.overall_assessment}</p>

          {result.strengths.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-widest" style={{ color: '#22D77A' }}>
                What's good
              </p>
              <ul className="list-disc pl-5 text-sm">
                {result.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}

          {result.corrections.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-widest" style={{ color: '#D9A441' }}>
                To improve
              </p>
              <ul className="list-disc pl-5 text-sm">
                {result.corrections.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}

          {result.safety_flag && (
            <div className="rounded p-2 text-sm" style={{ backgroundColor: '#2A1416', color: '#E5484D' }}>
              ⚠️ {result.safety_flag}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={loading || saved}
            className="w-full rounded py-2 font-semibold uppercase tracking-wide disabled:opacity-50"
            style={{ backgroundColor: saved ? '#1E2637' : '#22D77A', color: saved ? '#22D77A' : '#0A0F1A', fontFamily: 'var(--font-display)' }}
          >
            {saved ? 'Saved ✓' : loading ? 'Saving...' : 'Save Feedback'}
          </button>
        </div>
      )}
    </div>
  )
}