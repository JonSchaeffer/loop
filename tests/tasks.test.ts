import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Status, Priority } from '@prisma/client'

// Mock dependencies before importing the module under test
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))
vi.mock('@/lib/db', () => ({
  prisma: {
    task: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    statusEvent: { create: vi.fn() },
  },
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createTask, updateTaskStatus, deleteTask } from '@/actions/tasks'

const mockAuth = vi.mocked(auth)
const mockTaskCreate = vi.mocked(prisma.task.create)
const mockTaskFindUnique = vi.mocked(prisma.task.findUnique)
const mockTaskUpdate = vi.mocked(prisma.task.update)
const mockTaskDelete = vi.mocked(prisma.task.delete)
const mockStatusEventCreate = vi.mocked(prisma.statusEvent.create)

const USER_ID = 'user-123'
const TASK_ID = 'task-456'

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.mockResolvedValue({ user: { id: USER_ID, email: 'test@test.com' } } as never)
})

describe('createTask', () => {
  it('creates a task with WAITING status and writes a StatusEvent', async () => {
    const fakeTask = { id: TASK_ID, status: Status.WAITING }
    mockTaskCreate.mockResolvedValue(fakeTask as never)
    mockStatusEventCreate.mockResolvedValue({} as never)

    await createTask({ title: 'Test task', priority: Priority.MEDIUM })

    expect(mockTaskCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: Status.WAITING, userId: USER_ID }),
      })
    )
    expect(mockStatusEventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          taskId: TASK_ID,
          toStatus: Status.WAITING,
          fromStatus: null,
        }),
      })
    )
  })

  it('throws if not authenticated', async () => {
    mockAuth.mockResolvedValue(null as never)
    await expect(createTask({ title: 'Test', priority: Priority.MEDIUM })).rejects.toThrow(
      'Unauthorized'
    )
  })
})

describe('updateTaskStatus', () => {
  it('updates status and writes a StatusEvent', async () => {
    const existing = { id: TASK_ID, userId: USER_ID, status: Status.WAITING }
    mockTaskFindUnique.mockResolvedValue(existing as never)
    mockTaskUpdate.mockResolvedValue({ ...existing, status: Status.FOLLOW_UP_DUE } as never)
    mockStatusEventCreate.mockResolvedValue({} as never)

    await updateTaskStatus(TASK_ID, Status.FOLLOW_UP_DUE)

    expect(mockTaskUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: Status.FOLLOW_UP_DUE }),
      })
    )
    expect(mockStatusEventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fromStatus: Status.WAITING,
          toStatus: Status.FOLLOW_UP_DUE,
        }),
      })
    )
  })

  it('sets completedAt when marking DONE', async () => {
    const existing = { id: TASK_ID, userId: USER_ID, status: Status.FOLLOW_UP_DUE }
    mockTaskFindUnique.mockResolvedValue(existing as never)
    mockTaskUpdate.mockResolvedValue({} as never)
    mockStatusEventCreate.mockResolvedValue({} as never)

    await updateTaskStatus(TASK_ID, Status.DONE)

    expect(mockTaskUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: Status.DONE,
          completedAt: expect.any(Date),
        }),
      })
    )
  })

  it('throws if task belongs to another user', async () => {
    mockTaskFindUnique.mockResolvedValue({ id: TASK_ID, userId: 'other-user' } as never)
    await expect(updateTaskStatus(TASK_ID, Status.DONE)).rejects.toThrow('Not found')
  })
})

describe('deleteTask', () => {
  it('deletes the task', async () => {
    mockTaskFindUnique.mockResolvedValue({ id: TASK_ID, userId: USER_ID } as never)
    mockTaskDelete.mockResolvedValue({} as never)

    await deleteTask(TASK_ID)

    expect(mockTaskDelete).toHaveBeenCalledWith({ where: { id: TASK_ID } })
  })
})
