import { request } from "@api/request"
import { contributionsSchema, goalSchema, goalsResponseSchema } from "@appTypes/goal"
import { API_URLS } from "@constants/apiUrls"
import { HttpMethods } from "@constants/httpMethods"
import { z } from "zod"

/** Active goals plus the cross-goal aggregate for the top card. */
export function getGoals() {
  return request(API_URLS.goals.goals, { schema: goalsResponseSchema })
}

export interface CreateGoalPayload {
  /** 1–100 characters. */
  name: string
  /** Up to 16 characters. */
  emoji?: string
  /** > 0, up to 2 decimals. */
  targetAmount: number
  /** ISO 4217, 3 uppercase letters. */
  currency: string
  /** ISO date; omit for an open-ended goal. */
  targetDate?: string
}

export function createGoal(payload: CreateGoalPayload) {
  return request(API_URLS.goals.goals, {
    method: HttpMethods.POST,
    body: JSON.stringify(payload),
    schema: goalSchema,
  })
}

/** Any creation field (all optional) plus `archived`. Archiving returns the money to the balance. */
export type UpdateGoalPayload = Partial<CreateGoalPayload> & { archived?: boolean }

export function updateGoal(id: string, payload: UpdateGoalPayload) {
  return request(`${API_URLS.goals.goals}/${id}`, {
    method: HttpMethods.PATCH,
    body: JSON.stringify(payload),
    schema: goalSchema,
  })
}

/** Deletes the goal with all its contributions. */
export function deleteGoal(id: string) {
  return request(`${API_URLS.goals.goals}/${id}`, { method: HttpMethods.DELETE })
}

export interface CreateContributionPayload {
  /** In the goal currency, up to 2 decimals; NEGATIVE = withdrawal/correction. */
  amount: number
  /** Up to 200 characters. */
  note?: string
  /** ISO date; defaults to today. */
  date?: string
}

/** Records a contribution (or withdrawal) and returns the recomputed goal. */
export function createContribution(goalId: string, payload: CreateContributionPayload) {
  return request(`${API_URLS.goals.goals}/${goalId}/contributions`, {
    method: HttpMethods.POST,
    body: JSON.stringify(payload),
    schema: goalSchema,
  })
}

/** Contribution history for a goal, newest first. */
export function getContributions(goalId: string) {
  return request(`${API_URLS.goals.goals}/${goalId}/contributions`, {
    schema: contributionsSchema,
  })
}

export function deleteContribution(goalId: string, contributionId: string) {
  return request(`${API_URLS.goals.goals}/${goalId}/contributions/${contributionId}`, {
    method: HttpMethods.DELETE,
    schema: z.object({ success: z.boolean() }),
  })
}
