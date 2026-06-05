import { QueryClient } from "@tanstack/react-query"

/**
 * Единый клиент react-query. Один и тот же инстанс используется и внутри React
 * (через QueryClientProvider в main.tsx), и вне React — например, чтобы очистить
 * кеш при принудительном логауте по 401 в request.ts.
 */
export const queryClient = new QueryClient()
