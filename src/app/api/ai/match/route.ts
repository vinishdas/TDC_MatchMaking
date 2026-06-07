import Groq from 'groq-sdk';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const groq = new Groq({ apiKey: process.env.GEMINI_API_KEY });
  let parsedCandidates: any[] = [];
  try {
    const { customer, candidates } = await req.json();
    parsedCandidates = candidates;

    const promptData = {
      customer: {
        firstName: customer.firstName,
        gender: customer.gender,
        age: customer.age,
        city: customer.city,
        income: customer.income,
        religion: customer.religion,
        dietaryPreferences: customer.dietaryPreferences,
        lifestylePreferences: customer.lifestylePreferences,
        partnerPreferences: customer.partnerPreferences,
      },
      candidates: candidates.map((c: any) => ({
        id: c.id,
        firstName: c.firstName,
        age: c.age,
        city: c.city,
        income: c.income,
        religion: c.religion,
        dietaryPreferences: c.dietaryPreferences,
        lifestylePreferences: c.lifestylePreferences,
      }))
    };

    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content: `You are an expert Matchmaker AI. You are given a core customer and a list of candidates. 
Return a strict JSON array of objects. Each object must have:
- "id": candidate id
- "score": integer 0-100 (evaluate deep compatibility)
- "label": "High Potential Match", "Strong Compatibility", or "Good Long-Term Match"
- "reasoning": 1-2 sentence explanation.

Example Output format:
[
  {
    "id": "TDC-10021",
    "score": 95,
    "label": "Strong Compatibility",
    "reasoning": "This is a great match because..."
  }
]
Do not output any conversational text or markdown, ONLY the JSON array.`
        },
        {
          role: "user",
          content: JSON.stringify(promptData)
        }
      ],
      temperature: 0.2,
      max_completion_tokens: 4000,
      top_p: 1,
      stream: false,
    });

    const responseText = response.choices[0]?.message?.content;
    if (!responseText) {
      console.warn("Groq empty response:", JSON.stringify(response, null, 2));
      throw new Error("No response");
    }

    // Clean up markdown formatting if any
    let rawText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Extract JSON array robustly
    const arrayMatch = rawText.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      rawText = arrayMatch[0];
    }
    
    let aiScores;
    try {
      aiScores = JSON.parse(rawText);
    } catch (parseError) {
      throw new Error("AI returned malformed JSON");
    }

    // Merge AI scores back into the candidates
    const scoredMatches = parsedCandidates.map((profile: any) => {
      const aiData = aiScores.find((aiMatch: any) => aiMatch.id === profile.id);
      if (aiData) {
        return {
          profile,
          matchScore: {
            score: aiData.score,
            label: aiData.label,
            reasoning: aiData.reasoning,
            isAI: true
          }
        };
      }
      return { profile, matchScore: { score: 50, label: 'Standard Match', reasoning: '', isAI: false } };
    });

    // Sort by AI score
    scoredMatches.sort((a: any, b: any) => b.matchScore.score - a.matchScore.score);

    return NextResponse.json({ scoredMatches });
  } catch (error: any) {
    console.warn(`[AI Match Warning] AI enhancement failed (${error.message}). Using core algorithm fallback.`);
    
    // Graceful fallback if AI fails: Return the candidates with their existing engine scores
    if (parsedCandidates && parsedCandidates.length > 0) {
      const scoredMatches = parsedCandidates.map((profile: any) => ({
        profile, 
        matchScore: profile.matchScore || { score: 50, label: 'Standard Match', reasoning: 'AI temporarily unavailable. Matched by core algorithm.', isAI: false }
      }));
      return NextResponse.json({ scoredMatches });
    }
    
    return NextResponse.json({ error: 'Failed to enhance matches' }, { status: 500 });
  }
}
