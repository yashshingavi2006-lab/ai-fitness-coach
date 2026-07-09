import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { videoBase64, mimeType, exerciseName } = await request.json()

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `You are a certified strength coach reviewing a client's exercise form on video.
The client says they are performing: ${exerciseName}.

Watch the movement carefully and assess:
- Joint tracking and alignment (e.g. knee tracking over toes, spine neutrality)
- Range of motion (full vs. partial reps)
- Tempo and control (rushed vs. controlled)
- Any visible safety concerns

Respond with ONLY valid JSON, no markdown formatting, no code fences, no extra text.
Use exactly this shape:
{
  "exercise_identified": "string, what you actually observed them doing, may differ from what they stated",
  "overall_assessment": "string, 1-2 sentence summary",
  "strengths": ["string", "string"],
  "corrections": ["string, specific and actionable", "string"],
  "safety_flag": "string, empty string if none, otherwise a clear warning"
}
Be specific and actionable, not generic. If the video quality or angle makes something hard to assess, say so honestly rather than guessing.`

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: videoBase64,
          mimeType: mimeType,
        },
      },
    ])

    const text = result.response.text().trim()
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
    const parsed = JSON.parse(cleaned)

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Form analysis error:', error)
    return NextResponse.json({ error: 'Failed to analyze form' }, { status: 500 })
  }
}