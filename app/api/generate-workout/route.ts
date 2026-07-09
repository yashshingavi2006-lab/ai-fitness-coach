import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { goal, daysPerWeek, equipment, experienceLevel, sessionDuration, injuries } = await request.json()

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `You are a certified strength coach (NSCA-level programming knowledge) creating a personalized, professionally structured workout plan.

Client details:
- Goal: ${goal}
- Training days per week: ${daysPerWeek}
- Available equipment: ${equipment}
- Experience level: ${experienceLevel}
- Session duration: ${sessionDuration} minutes
- Injuries or limitations: ${injuries || 'none reported'}

Follow these programming rules strictly:

1. SPLIT SELECTION (choose based on days per week, do not deviate):
   - 2-3 days/week: Full Body each session
   - 4 days/week: Upper/Lower split
   - 5 days/week: Upper/Lower/Push/Pull/Legs hybrid
   - 6 days/week: Push/Pull/Legs, repeated twice in the week

2. VOLUME LANDMARKS (working sets per muscle group per week):
   - Beginner: 10-12 sets/muscle/week total across the week
   - Intermediate: 12-16 sets/muscle/week
   - Advanced: 16-20 sets/muscle/week
   Distribute this volume across the week's sessions according to the chosen split.

3. EXERCISE ORDERING: within each day, order compound/multi-joint movements (squat, deadlift, bench press, overhead press, rows, pull-ups) FIRST while the client is fresh, then isolation/accessory work after.

4. INTENSITY: assign an RPE (Rate of Perceived Exertion, 1-10 scale) or RIR (Reps in Reserve) to each exercise appropriate for the goal — lower reps/higher RPE for strength, moderate reps/RPE 7-8 for hypertrophy, higher reps/moderate RPE for fat loss and general fitness.

5. REST: specify realistic rest periods in seconds between sets (compound lifts typically need 90-180s, isolation work 45-90s).

6. WARM-UP: include a brief warm-up protocol for each day (2-3 sentences, e.g. dynamic stretches + a light ramp-up set of the first compound movement).

7. TIME BUDGET: fit realistically within the stated session duration including warm-up and rest periods (~3-5 min per working set including rest, plus 5-10 min warm-up).

8. SAFETY: if injuries or limitations are mentioned, avoid exercises that would aggravate them and substitute safer alternatives, noting the substitution reasoning in the notes field.

9. Only use the equipment listed as available.

Respond with ONLY valid JSON, no markdown formatting, no code fences, no extra text.
Use exactly this shape:
{
  "plan_name": "string",
  "split_type": "string, e.g. Upper/Lower Split — chosen for 4-day frequency",
  "days": [
    {
      "day_label": "string, e.g. Day 1: Upper Body",
      "warmup": "string, brief warmup protocol for this day",
      "exercises": [
        {
          "name": "string",
          "sets": number,
          "reps": "string, e.g. 6-8",
          "rest_seconds": number,
          "rpe": "string, e.g. RPE 8 or RIR 2",
          "notes": "string, brief form cue or injury-safety note"
        }
      ]
    }
  ]
}`

    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
    const parsed = JSON.parse(cleaned)

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Workout generation error:', error)
    return NextResponse.json({ error: 'Failed to generate workout' }, { status: 500 })
  }
}