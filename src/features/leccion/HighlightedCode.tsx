import { toJsxRuntime } from 'hast-util-to-jsx-runtime'
import { isValidElement, useMemo, type ReactNode } from 'react'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import bash from 'refractor/bash'
import { refractor } from 'refractor/core'
import diff from 'refractor/diff'
import docker from 'refractor/docker'
import hcl from 'refractor/hcl'
import http from 'refractor/http'
import ini from 'refractor/ini'
import javascript from 'refractor/javascript'
import json from 'refractor/json'
import markup from 'refractor/markup'
import nginx from 'refractor/nginx'
import powershell from 'refractor/powershell'
import python from 'refractor/python'
import sql from 'refractor/sql'
import toml from 'refractor/toml'
import typescript from 'refractor/typescript'
import yaml from 'refractor/yaml'

// Solo los lenguajes de las rutas: cada uno pesa. Para agregar otro, se importa y se suma aquí.
// Uno que no esté (o `text`) se ve igual, sin colores.
const languages = [
  bash,
  diff,
  docker,
  hcl,
  http,
  ini,
  javascript,
  json,
  markup,
  nginx,
  powershell,
  python,
  sql,
  toml,
  typescript,
  yaml,
]
for (const language of languages) refractor.register(language)
refractor.alias({ hcl: ['terraform', 'tf'], bash: ['zsh', 'console'], ini: ['env', 'dotenv'] })

function textOf(node: ReactNode): string {
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children)
  return ''
}

interface HighlightedCodeProps {
  /** react-markdown pone el lenguaje del bloque: «language-bash». */
  className?: string
  children?: ReactNode
}

/** El <code> de una lección: con colores si es un bloque de un lenguaje conocido. */
export function HighlightedCode({ className, children }: HighlightedCodeProps) {
  const language = /language-([\w-]+)/.exec(className ?? '')?.[1] ?? ''
  const text = textOf(children)
  const highlighted = useMemo(() => {
    if (!refractor.registered(language)) return null
    // Sus tipos usan el JSX global, que React 19 ya no declara.
    return toJsxRuntime(refractor.highlight(text, language), {
      Fragment,
      jsx,
      jsxs,
    }) as ReactNode
  }, [text, language])
  return <code className={className}>{highlighted ?? children}</code>
}
