import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { imageBase64 } = await request.json()

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

   const prompt = `You are a nutrition expert analyzing a food photo.
First, mentally list every distinct food item visible on the plate (e.g. rice, dal, curry, bread, salad, drink) — look carefully, especially for plates with multiple small items like thalis or combo meals.
Then estimate the combined nutritional content of everything visible.
Respond with ONLY valid JSON, no markdown formatting, no code fences, no extra text.
Use exactly this shape:
{"food_name": "string describing all items, e.g. Rice, dal, paneer curry, roti, and salad", "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number}
Sum all visible items into one combined estimate. These are approximate estimates, not precise measurements. Do not guess a generic dish name if multiple distinct items are visible — instead list them.`

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType: 'image/jpeg',
        },
      },
    ])

    const text = result.response.text().trim()
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
    const parsed = JSON.parse(cleaned)

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Meal analysis error:', error)
    return NextResponse.json({ error: 'Failed to analyze meal' }, { status: 500 })
  }
}