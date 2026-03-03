import { addDays, format } from 'date-fns'
import type { Category } from '@prisma/client'

export interface ParsedHints {
  categoryId?: string
  categoryName?: string
  followUpDate?: Date
  followUpLabel?: string
  dueDate?: Date
  dueDateLabel?: string
}

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

/** Resolve a short date expression (e.g. "friday", "next week", "tomorrow") to a Date. */
function resolveDate(text: string, now: Date): { date: Date; label: string } | null {
  const lower = text.toLowerCase().trim()

  if (/\btoday\b/.test(lower)) return { date: now, label: 'today' }
  if (/\btomorrow\b/.test(lower)) return { date: addDays(now, 1), label: 'tomorrow' }
  if (/\bnext week\b/.test(lower)) return { date: addDays(now, 7), label: 'next week' }

  const inDaysMatch = lower.match(/\bin (\d+) days?\b/)
  if (inDaysMatch) {
    const n = parseInt(inDaysMatch[1])
    return { date: addDays(now, n), label: `in ${n} day${n === 1 ? '' : 's'}` }
  }

  for (let i = 0; i < WEEKDAYS.length; i++) {
    const isNext = new RegExp(`\\bnext ${WEEKDAYS[i]}\\b`).test(lower)
    const isBare = new RegExp(`\\b${WEEKDAYS[i]}\\b`).test(lower)
    if (isNext || isBare) {
      const diff = (i - now.getDay() + 7) % 7 || 7
      const date = addDays(now, isNext ? diff + (diff === 7 ? 0 : 7) : diff)
      const label = isNext ? `next ${WEEKDAYS[i]}` : `${WEEKDAYS[i]} (${format(date, 'MMM d')})`
      return { date, label }
    }
  }

  return null
}

export function parseQuickTask(text: string, categories: Category[]): ParsedHints {
  const lower = text.toLowerCase()
  const result: ParsedHints = {}
  const now = new Date()

  // --- Category: longest matching name wins ---
  let bestMatch: Category | null = null
  for (const cat of categories) {
    const escaped = cat.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`\\b${escaped}\\b`, 'i')
    if (regex.test(lower)) {
      if (!bestMatch || cat.name.length > bestMatch.name.length) {
        bestMatch = cat
      }
    }
  }
  if (bestMatch) {
    result.categoryId = bestMatch.id
    result.categoryName = bestMatch.name
  }

  // --- Date parsing ---
  // Step 1: "follow up on/by <date>" or "remind [me] on/by <date>" → followUpDate
  const followUpMatch = text.match(
    /\b(?:follow.?up|remind(?:\s+me)?)\s+(?:on|by)?\s*(.+?)(?:\s+and\b|$)/i
  )
  if (followUpMatch) {
    const resolved = resolveDate(followUpMatch[1], now)
    if (resolved) {
      result.followUpDate = resolved.date
      result.followUpLabel = resolved.label
    }
  }

  // Step 2: "by <date>" (remove follow-up/remind clause first to avoid conflicts) → dueDate
  const textWithoutReminder = text.replace(/\b(?:follow.?up|remind(?:\s+me)?)\b.*/gi, '').trim()
  const byMatch = textWithoutReminder.match(/\bby\s+(.+?)(?:\s+and\b|$)/i)
  if (byMatch) {
    const resolved = resolveDate(byMatch[1], now)
    if (resolved) {
      result.dueDate = resolved.date
      result.dueDateLabel = resolved.label
    }
  }

  // Step 3: fallback — no structured dates found, grab first date anywhere → dueDate
  if (!result.followUpDate && !result.dueDate) {
    const resolved = resolveDate(lower, now)
    if (resolved) {
      result.dueDate = resolved.date
      result.dueDateLabel = resolved.label
    }
  }

  return result
}
