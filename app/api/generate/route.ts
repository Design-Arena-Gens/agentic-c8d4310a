import { NextRequest } from 'next/server'

export const runtime = 'edge'

const SYSTEM_PROMPTS: Record<string, string> = {
  professional: 'Write in a professional, polished tone suitable for business contexts.',
  casual: 'Write in a casual, conversational tone that feels friendly and approachable.',
  friendly: 'Write in a warm, friendly tone that connects with readers.',
  formal: 'Write in a formal, academic tone with proper structure.',
  creative: 'Write in a creative, imaginative tone that engages readers.',
  persuasive: 'Write in a persuasive tone that convinces and motivates readers.'
}

const LENGTH_INSTRUCTIONS: Record<string, string> = {
  short: 'Keep it concise, around 200-300 words.',
  medium: 'Write a medium-length piece, around 400-600 words.',
  long: 'Write a comprehensive piece, around 800-1000 words.',
  'very-long': 'Write an extensive, detailed piece of 1200+ words.'
}

export async function POST(req: NextRequest) {
  try {
    const { template, topic, tone, length, basePrompt } = await req.json()

    const systemPrompt = SYSTEM_PROMPTS[tone] || SYSTEM_PROMPTS.professional
    const lengthInstruction = LENGTH_INSTRUCTIONS[length] || LENGTH_INSTRUCTIONS.medium

    const fullPrompt = `${basePrompt} "${topic}". ${systemPrompt} ${lengthInstruction}

Format the content with proper markdown formatting including:
- Clear headings (use ##, ###)
- Bullet points where appropriate
- Bold text for emphasis
- Proper paragraphs with spacing

Make it engaging, well-structured, and valuable to readers.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        stream: true,
        messages: [
          {
            role: 'user',
            content: fullPrompt
          }
        ]
      })
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }

        try {
          let buffer = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)

                if (data === '[DONE]') {
                  continue
                }

                try {
                  const parsed = JSON.parse(data)

                  if (parsed.type === 'content_block_delta') {
                    const text = parsed.delta?.text || ''
                    if (text) {
                      const chunk = encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`)
                      controller.enqueue(chunk)
                    }
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        } catch (error) {
          console.error('Stream error:', error)
        } finally {
          reader.releaseLock()
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: 'Generation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
