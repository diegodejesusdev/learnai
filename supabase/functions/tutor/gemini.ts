import { ApiError, FinishReason, GoogleGenAI } from '@google/genai'
import { QUIZ_OPTIONS, QUIZ_QUESTIONS, quizJsonSchema } from '../_shared/quiz.ts'
import { errorCodeFromStatus, TutorError } from '../_shared/tutorErrors.ts'
import { MAX_OUTPUT_TOKENS, type ProviderRequest, type TutorProvider } from './providerTypes.ts'

// Gemini sí aplica minItems/maxItems en el esquema: se agregan a los del quiz.
const { items } = quizJsonSchema.properties.questions
const geminiQuizSchema = {
  ...quizJsonSchema,
  properties: {
    questions: {
      type: 'array',
      minItems: QUIZ_QUESTIONS,
      maxItems: QUIZ_QUESTIONS,
      items: {
        ...items,
        properties: {
          ...items.properties,
          options: { ...items.properties.options, minItems: QUIZ_OPTIONS, maxItems: QUIZ_OPTIONS },
        },
      },
    },
  },
}

const BLOCKED: readonly (FinishReason | undefined)[] = [
  FinishReason.SAFETY,
  FinishReason.BLOCKLIST,
  FinishReason.PROHIBITED_CONTENT,
  FinishReason.SPII,
  FinishReason.RECITATION,
]

function toTutorError(error: unknown): TutorError {
  if (error instanceof TutorError) return error
  if (error instanceof ApiError) return new TutorError(errorCodeFromStatus(error.status))
  if (error instanceof Error && error.name === 'AbortError') return new TutorError('timeout')
  if (error instanceof TypeError) return new TutorError('network')
  return new TutorError('unknown')
}

export function geminiProvider(apiKey: string, model: string): TutorProvider {
  const ai = new GoogleGenAI({ apiKey })

  return {
    name: 'gemini',
    model,
    async *stream(request: ProviderRequest) {
      try {
        const response = await ai.models.generateContentStream({
          model,
          contents: request.messages.map((message) => ({
            role: message.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: message.content }],
          })),
          config: {
            systemInstruction: request.system,
            maxOutputTokens: MAX_OUTPUT_TOKENS,
            abortSignal: request.signal,
            ...(request.json
              ? { responseMimeType: 'application/json', responseJsonSchema: geminiQuizSchema }
              : {}),
          },
        })
        let inputTokens: number | null = null
        let outputTokens: number | null = null
        for await (const chunk of response) {
          if (BLOCKED.includes(chunk.candidates?.[0]?.finishReason)) throw new TutorError('refusal')
          const text = chunk.text
          if (text) yield { type: 'text', text }
          if (chunk.usageMetadata) {
            inputTokens = chunk.usageMetadata.promptTokenCount ?? inputTokens
            outputTokens = chunk.usageMetadata.candidatesTokenCount ?? outputTokens
          }
        }
        yield { type: 'end', model, inputTokens, outputTokens }
      } catch (error) {
        throw toTutorError(error)
      }
    },
  }
}
