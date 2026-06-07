import Groq from 'groq-sdk';

export async function POST(req: Request) {
  const groq = new Groq({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const { customer, matchProfile } = await req.json();

    const promptData = {
      customer: {
        firstName: customer.firstName,
        age: customer.age,
        religion: customer.religion,
        city: customer.city,
        notes: customer.notes
      },
      matchProfile: {
        firstName: matchProfile.firstName,
        lastName: matchProfile.lastName,
        age: matchProfile.age,
        religion: matchProfile.religion,
        city: matchProfile.city,
        designation: matchProfile.designation,
        notes: matchProfile.notes
      }
    };

    const responseStream = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content: "You are an expert Matchmaker. Write a brief, personalized email draft to the customer introducing their match. Be highly professional yet warm. Keep it under 150 words. Do not use markdown for the email itself."
        },
        {
          role: "user",
          content: JSON.stringify(promptData)
        }
      ],
      temperature: 0.7,
      max_completion_tokens: 4000,
      top_p: 1,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
        } catch (error) {
          controller.error(error);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked'
      }
    });
  } catch (error) {
    console.error("Gemini Draft Error:", error);
    return new Response(JSON.stringify({ error: 'Failed to generate draft' }), { status: 500 });
  }
}
