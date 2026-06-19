import { useCallback, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import type { z } from "zod"

type AnyZodObject = z.ZodObject<z.ZodRawShape>

export function useUrlParams<T extends AnyZodObject>(
  schema: T,
): [z.infer<T>, (updates: Partial<z.infer<T>>) => void] {
  const [searchParams, setSearchParams] = useSearchParams()

  const params = useMemo(() => {
    const raw = Object.fromEntries(searchParams.entries())
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
            if (value == null || value === "") {
              next.delete(key)
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
