'use client'

import Link from 'next/link'
import { format, isToday, isYesterday, addDays, subDays, parseISO } from 'date-fns'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface DateSidebarProps {
  dates: Date[]
  dateParam?: string
}

function dateLabel(date: Date) {
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'EEE, MMM d')
}

function toParam(date: Date) {
  return format(date, 'yyyy-MM-dd')
}

export function DateSidebar({ dates, dateParam }: DateSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  // Derive selectedParam from the URL string directly — avoids a server→client
  // Date serialization bug where parseISO('YYYY-MM-DD') on the UTC server gives
  // midnight UTC, which formats to the previous calendar day in negative-offset timezones.
  const selectedParam = dateParam ?? format(new Date(), 'yyyy-MM-dd')

  // For keyboard nav we need a Date, but parse it client-side so it's in local time.
  const selectedDate = dateParam ? parseISO(dateParam) : new Date()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return
      if (e.key === '[') {
        // Go back one day
        const prev = subDays(selectedDate, 1)
        router.push(`${pathname}?date=${toParam(prev)}`)
      } else if (e.key === ']') {
        // Go forward one day, but not past today
        if (isToday(selectedDate)) return
        const next = addDays(selectedDate, 1)
        router.push(isToday(next) ? pathname : `${pathname}?date=${toParam(next)}`)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedDate, pathname, router])

  return (
    <nav className="w-36 shrink-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 px-2">
        History
      </p>
      <ul className="space-y-0.5">
        {dates.map((date) => {
          const param = toParam(date)
          const isSelected = param === selectedParam
          const href = isToday(date) ? pathname : `${pathname}?date=${param}`

          return (
            <li key={param}>
              <Link
                href={href}
                className={`block px-2 py-1.5 rounded-md text-sm transition-colors ${
                  isSelected
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {dateLabel(date)}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
