import { dehydrate, QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import {
  lessonIndexKey,
  lessonKey,
  lessonProgressKey,
  savedLessonKey,
} from '@/features/leccion/lessonKeys'
import { progressKey } from '@/features/ruta/useProgress'
import { persistOptions } from './persistence'

describe('lo que se guarda con la caché (localStorage)', () => {
  function persistedKeys() {
    const client = new QueryClient()
    client.setQueryData(progressKey, { topics: {} })
    client.setQueryData(lessonIndexKey, {})
    client.setQueryData(lessonProgressKey, {})
    client.setQueryData(lessonKey('cl-f0-t1'), { content: 'larga' })
    client.setQueryData(savedLessonKey('cl-f0-t1'), { content: 'larga' })
    client.setQueryData(['tutor', 'messages'], [])
    client.setQueryData(['active-timer'], null)
    return dehydrate(client, persistOptions.dehydrateOptions).queries.map((query) => query.queryKey)
  }

  it('qué lecciones hay y cuáles leíste, sí', () => {
    expect(persistedKeys()).toEqual([progressKey, lessonIndexKey, lessonProgressKey])
  })

  it('el texto de las lecciones no: va en IndexedDB, para no llenarla', () => {
    expect(JSON.stringify(persistedKeys())).not.toContain('cl-f0-t1')
  })
})
