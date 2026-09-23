import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import type { z } from "zod"
import { readPersistedParams, writePersistedParams } from "../lib/persistedParams"
import { type AnyZodObject, applyUrlParamUpdates, parseUrlParams } from "./useUrlParams"

interface Options<P> {
  /** Storage key — one per table. */
  key: string
  /** Params that are not remembered, e.g. `page`: the data may have moved on since. */
  omit?: readonly (keyof P & string)[]
  /** Adjusts the restored params before they go into the URL, e.g. recomputes "this month" to
   *  today's dates. Returns the updates to write. */
  onRestore?: (params: P) => Partial<P>
}

/**
 * useUrlParams that remembers the table's state between visits. Every change is saved; landing
 * on the page with none of the schema's params in the URL (a menu link) brings the saved ones
 * back. A URL that already carries params — a shared link, a link to a filtered view — wins and
 * is left as is. Only the schema's own keys are saved or checked, so other params on the page
 * don't interfere.
 */
export function usePersistedUrlParams<T extends AnyZodObject>(
  schema: T,
  { key, omit = [], onRestore }: Options<z.infer<T>>,
): [z.infer<T>, (updates: Partial<z.infer<T>>) => void] {
  const [searchParams, setSearchParams] = useSearchParams()
  // keyed by content, not identity — callers pass `omit` as an inline array literal
  const omitKey = omit.join(",")
  // biome-ignore lint/correctness/useExhaustiveDependencies: omitKey stands for omit
  const ownKeys = useMemo(
    () => Object.keys(schema.shape).filter((k) => !omit.includes(k)),
    [schema, omitKey],
  )

  // Computed once, on the first render, so the table's very first request already uses the
  // restored params instead of fetching the defaults and then refetching.
  const [restore] = useState(() => {
    if (ownKeys.some((k) => searchParams.has(k))) return null
    const stored = readPersistedParams(key)
    if (!stored) return null
    const saved = new URLSearchParams(stored)
    let next = new URLSearchParams(searchParams)
    for (const k of ownKeys) for (const v of saved.getAll(k)) next.append(k, v)
    if (onRestore) next = applyUrlParamUpdates(next, onRestore(parseUrlParams(schema, next)))
    const from = searchParams.toString()
    return next.toString() === from ? null : { from, to: next }
  })

  // The restored params stand in for the URL until it first changes — after that the URL is the
  // truth for good, even if the user later clears it back to what it was on landing.
  const settled = useRef(false)
  if (restore && searchParams.toString() !== restore.from) settled.current = true
  const restoring = restore !== null && !settled.current
  const effective = restoring ? restore.to : searchParams

  useLayoutEffect(() => {
    if (restoring) setSearchParams(restore.to, { replace: true })
  }, [restoring, restore, setSearchParams])

  useEffect(() => {
    if (restoring) return
    const own = new URLSearchParams()
    for (const [k, v] of searchParams) if (ownKeys.includes(k)) own.append(k, v)
    writePersistedParams(key, own.toString())
  }, [restoring, searchParams, ownKeys, key])

  const params = useMemo(() => parseUrlParams(schema, effective), [schema, effective])

  const setParams = useCallback(
    (updates: Partial<z.infer<T>>) => {
      setSearchParams((prev) => applyUrlParamUpdates(prev, updates), { replace: true })
    },
    [setSearchParams],
  )

  return [params, setParams]
}
