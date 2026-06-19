import { QueryClient } from "@tanstack/react-query"

/**
 * Single react-query client. The same instance is used both inside React
 * (via QueryClientProvider in main.tsx) and outside React — for example, to clear
 * the cache on forced logout on 401 in request.ts.
 */
export const queryClient = new QueryClient()
