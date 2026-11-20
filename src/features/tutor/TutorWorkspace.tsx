import { useSearchParams } from 'react-router'
import { Alert } from '@/components/ui/Alert'
import { ErrorState } from '@/components/ui/ErrorState'
import { LoadingState } from '@/components/ui/LoadingState'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { topicStatuses } from '@/features/ruta/progressModel'
import type { RoadmapData } from '@/features/ruta/RoadmapGate'
import { nextTopic } from '@/lib/progress'
import { findPhaseIn, findTopicIn } from '@/lib/roadmap'
import { useOnline } from '@/lib/offline'
import { useKeyboardInset } from '@/lib/useKeyboardInset'
import { ChatThread } from './ChatThread'
import { ConversationBar } from './ConversationBar'
import { EmptyChat } from './EmptyChat'
import { ModeComposer } from './ModeComposer'
import { TutorTargetSelect } from './TutorTargetSelect'
import { tutorModes } from './tutorModes'
import { readTutorUrl, targetOf, writeTutorUrl, type TutorUrlState } from './tutorUrl'
import { useConversations, useMessages } from './useTutor'
import { useTutorChat } from './useTutorChat'

export function TutorWorkspace({ roadmap, progress }: RoadmapData) {
  const phases = roadmap.phases
  const [params, setParams] = useSearchParams()
  const suggestion = nextTopic(phases, topicStatuses(progress))
  const state = readTutorUrl(params, {
    topicId: suggestion?.topic.id ?? phases[0]?.topics[0]?.id ?? '',
    phaseId: suggestion?.phase.id ?? phases[0]?.id ?? '',
    isTopic: (id) => findTopicIn(phases, id) !== undefined,
    isPhase: (id) => findPhaseIn(phases, id) !== undefined,
  })
  const target = targetOf(state)
  const topic = findTopicIn(phases, state.topicId)
  const project = findPhaseIn(phases, state.phaseId)

  const conversations = useConversations(target)
  const conversationId =
    state.conversation === 'new'
      ? null
      : state.conversation === 'latest'
        ? (conversations.data?.[0]?.id ?? null)
        : state.conversation.id
  const messages = useMessages(conversationId)
  const update = (patch: Partial<TutorUrlState>, replace = false) =>
    void setParams(writeTutorUrl({ ...state, ...patch }), { replace, preventScrollReset: true })
  const chat = useTutorChat({
    target,
    conversationId,
    onConversationCreated: (id) => update({ conversation: { id } }, true),
  })
  useKeyboardInset()
  const online = useOnline()

  const subject =
    state.mode === 'project_review'
      ? (project?.project.title ?? 'tu proyecto')
      : (topic?.topic.title ?? 'el tema')
  const notesTarget =
    state.mode === 'explain' && topic
      ? { target: { topicId: topic.topic.id }, label: topic.topic.title }
      : state.mode === 'project_review' && project
        ? { target: { phaseId: project.id }, label: `Proyecto: ${project.project.title}` }
        : null
  const resolving =
    (state.conversation === 'latest' && conversations.isPending) || messages.isLoading

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <SegmentedControl
          label="Modo del tutor"
          options={tutorModes}
          value={state.mode}
          onChange={(mode) => !chat.sending && update({ mode, conversation: 'latest' })}
        />
        <p className="text-sm text-fg-muted">
          {tutorModes.find((mode) => mode.value === state.mode)?.description}
        </p>
      </div>
      {state.mode !== 'daily_plan' && (
        <TutorTargetSelect
          kind={state.mode === 'project_review' ? 'project' : 'topic'}
          phases={phases}
          value={state.mode === 'project_review' ? state.phaseId : state.topicId}
          disabled={chat.sending}
          onChange={(id) =>
            update(
              state.mode === 'project_review'
                ? { phaseId: id, conversation: 'latest' }
                : { topicId: id, conversation: 'latest' },
            )
          }
        />
      )}
      <ConversationBar
        conversations={conversations.data ?? []}
        selectedId={conversationId}
        disabled={chat.sending}
        onSelect={(id) => update({ conversation: { id } })}
        onNew={() => update({ conversation: 'new' })}
      />

      {conversations.isError || messages.isError ? (
        <ErrorState
          title="No pudimos cargar la conversación"
          onRetry={() =>
            void (conversations.isError ? conversations.refetch() : messages.refetch())
          }
        />
      ) : resolving ? (
        <LoadingState />
      ) : (
        <ChatThread
          messages={conversationId ? (messages.data ?? []) : []}
          pending={chat.pending}
          quizTopicId={state.mode === 'quiz' ? state.topicId : null}
          notesTarget={notesTarget}
          empty={<EmptyChat mode={state.mode} subject={subject} onSend={chat.send} />}
        />
      )}

      {/* -mb-10: el relleno inferior de la página es más alto que la barra del móvil; así la
          caja queda pegada a la barra también al final de la conversación. */}
      <div className="chat-composer z-20 -mx-4 -mb-10 flex flex-col gap-2 border-t border-border bg-bg px-4 pt-3 pb-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:mb-0 lg:px-8">
        {!online && (
          <Alert>
            Sin conexión: el tutor necesita internet. Tus conversaciones guardadas vuelven al
            conectarte.
          </Alert>
        )}
        {chat.error && <Alert>{chat.error}</Alert>}
        <ModeComposer
          mode={state.mode}
          subject={subject}
          sending={chat.sending}
          onSend={chat.send}
          onStop={chat.stop}
        />
        {chat.remaining !== null && chat.remaining <= 10 && (
          <p className="text-xs text-fg-muted">
            {chat.remaining === 1
              ? 'Te queda 1 mensaje hoy.'
              : `Te quedan ${chat.remaining} mensajes hoy.`}
          </p>
        )}
      </div>
    </div>
  )
}
