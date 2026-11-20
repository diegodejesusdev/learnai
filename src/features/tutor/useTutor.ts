import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { progressKey } from '@/features/ruta/useProgress'
import {
  appendNotes,
  fetchConversations,
  fetchMessages,
  fetchQuizResults,
  saveQuizResult,
  type TutorTarget,
} from './tutorApi'

export const tutorKey = ['tutor'] as const

export const conversationsKey = (target: TutorTarget) =>
  [...tutorKey, 'conversations', target.mode, target.topicId, target.phaseId] as const

export const messagesKey = (conversationId: string) =>
  [...tutorKey, 'messages', conversationId] as const

/** Conversaciones del tema (o proyecto) y modo elegidos; la más reciente primero. */
export function useConversations(target: TutorTarget) {
  return useQuery({
    queryKey: conversationsKey(target),
    queryFn: () => fetchConversations(target),
    staleTime: 0,
  })
}

export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: messagesKey(conversationId ?? ''),
    queryFn: () => fetchMessages(conversationId ?? ''),
    enabled: conversationId !== null,
    staleTime: 0,
  })
}

export function useQuizResults(messageIds: readonly string[]) {
  return useQuery({
    queryKey: [...tutorKey, 'quiz-results', ...messageIds],
    queryFn: () => fetchQuizResults(messageIds),
    enabled: messageIds.length > 0,
  })
}

export function useSaveQuizResult() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: saveQuizResult,
    onSettled: () => queryClient.invalidateQueries({ queryKey: [...tutorKey, 'quiz-results'] }),
  })
}

export function useAppendNotes() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { target: { topicId: string } | { phaseId: string }; text: string }) =>
      appendNotes(input.target, input.text),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: progressKey }),
  })
}
