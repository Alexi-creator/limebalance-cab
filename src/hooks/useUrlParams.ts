import { useCallback, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import type { z } from "zod"

type AnyZodObject = z.ZodObject<z.ZodRawShape>

export function useUrlParams<T extends AnyZodObject>(
  schema: T,
): [z.infer<T>, (updates: Partial<z.infer<T>>) => void] {
  const [searchParams, setSearchParams] = useSearchParams()

  const params = useMemo(() => {
    // Keys repeated in the URL (e.g. ?categoryId=a&categoryId=b) collapse under
    // Object.fromEntries, so build the raw object via getAll: a single value stays a
    // string, repeated values become an array — the schema decides how to read each.
    const raw: Record<string, string | string[]> = {}
    for (const key of new Set(searchParams.keys())) {
      const all = searchParams.getAll(key)
      raw[key] = all.length > 1 ? all : all[0]
    }
    const result = schema.safeParse(raw)
    // safeParse with .catch()/.default() in the schema never fails
    return result.success ? result.data : schema.parse({})
  }, [searchParams, schema])

  const setParams = useCallback(
    (updates: Partial<z.infer<T>>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [key, value] of Object.entries(updates)) {
            if (value == null || value === "" || (Array.isArray(value) && value.length === 0)) {
              next.delete(key)
            } else if (Array.isArray(value)) {
              // serialize arrays as repeated params: key=a&key=b
              next.delete(key)
              for (const v of value) next.append(key, String(v))
            } else {
              next.set(key, String(value))
            }
          }
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  return [params, setParams]
}
