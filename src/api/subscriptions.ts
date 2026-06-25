import { request } from "@api/request"
import { usageSchema } from "@appTypes/usage"
import { API_URLS } from "@constants/apiUrls"

/**
 * Current plan usage and remaining limits — categories (lifetime total) and transactions
 * (current calendar month). Refetch (invalidate) after creating a category/transaction.
 */
export function getUsage() {
  return request(API_URLS.subscriptions.usage, { schema: usageSchema })
}
