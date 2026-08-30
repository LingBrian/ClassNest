import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { CourseRepository, type CreateCourseInput } from '@/repositories/CourseRepository'
import {
  CourseSessionRepository,
  type CreateCourseSessionInput,
} from '@/repositories/CourseSessionRepository'
import type { Course } from '@/models/course'
import type { CourseSession } from '@/models/session'

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** 课程 Store：当前课表的课程 + 时间段（加载一次进缓存，切周不重查，docs/tech.md §54）。 */
export const useCourseStore = defineStore('course', () => {
  const courses = ref<Course[]>([])
  const sessions = ref<CourseSession[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const courseRepo = new CourseRepository()
  const sessionRepo = new CourseSessionRepository()

  const sessionsByCourse = computed(() => {
    const map = new Map<number, CourseSession[]>()
    for (const session of sessions.value) {
      const list = map.get(session.courseId) ?? []
      list.push(session)
      map.set(session.courseId, list)
    }
    return map
  })

  function sessionsOf(courseId: number): CourseSession[] {
    return sessionsByCourse.value.get(courseId) ?? []
  }

  async function loadBySchedule(scheduleId: number): Promise<void> {
    loading.value = true
    error.value = null
    try {
      courses.value = await courseRepo.findByScheduleId(scheduleId)
      sessions.value = await sessionRepo.findByScheduleId(scheduleId)
    } catch (e) {
      error.value = toErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function refresh(courseId: number): Promise<void> {
    const index = courses.value.findIndex((c) => c.id === courseId)
    if (index < 0) return
    courses.value[index] = {
      ...(courses.value[index] ?? {}),
      ...(await courseRepo.findById(courseId)),
    }
  }

  async function ensureCourse(courseId: number): Promise<void> {
    if (courses.value.some((c) => c.id === courseId)) return
    const course = await courseRepo.findById(courseId)
    if (course) courses.value = [...courses.value, course]
  }

  async function ensureSessions(courseId: number): Promise<void> {
    if (sessions.value.some((s) => s.courseId === courseId)) return
    const list = await sessionRepo.findByCourseId(courseId)
    sessions.value = [...sessions.value, ...list]
  }

  async function createCourse(input: CreateCourseInput): Promise<Course> {
    error.value = null
    try {
      const created = await courseRepo.create(input)
      courses.value = [...courses.value, created]
      return created
    } catch (e) {
      error.value = toErrorMessage(e)
      throw e
    }
  }

  async function updateCourse(id: number, patch: Partial<Course>): Promise<void> {
    error.value = null
    try {
      await courseRepo.update(id, patch)
      const index = courses.value.findIndex((c) => c.id === id)
      if (index >= 0) courses.value[index] = { ...courses.value[index], ...patch, id }
    } catch (e) {
      error.value = toErrorMessage(e)
      throw e
    }
  }

  async function deleteCourse(id: number): Promise<void> {
    error.value = null
    try {
      await courseRepo.delete(id)
      courses.value = courses.value.filter((c) => c.id !== id)
      sessions.value = sessions.value.filter((s) => s.courseId !== id)
    } catch (e) {
      error.value = toErrorMessage(e)
      throw e
    }
  }

  async function createSession(input: CreateCourseSessionInput): Promise<CourseSession> {
    error.value = null
    try {
      const created = await sessionRepo.create(input)
      sessions.value = [...sessions.value, created]
      return created
    } catch (e) {
      error.value = toErrorMessage(e)
      throw e
    }
  }

  async function updateSession(id: number, patch: Partial<CourseSession>): Promise<void> {
    error.value = null
    try {
      await sessionRepo.update(id, patch)
      const index = sessions.value.findIndex((s) => s.id === id)
      if (index >= 0) sessions.value[index] = { ...sessions.value[index], ...patch, id }
    } catch (e) {
      error.value = toErrorMessage(e)
      throw e
    }
  }

  async function deleteSession(id: number): Promise<void> {
    error.value = null
    try {
      await sessionRepo.delete(id)
      sessions.value = sessions.value.filter((s) => s.id !== id)
    } catch (e) {
      error.value = toErrorMessage(e)
      throw e
    }
  }

  return {
    courses,
    sessions,
    sessionsOf,
    loading,
    error,
    loadBySchedule,
    refresh,
    ensureCourse,
    ensureSessions,
    createCourse,
    updateCourse,
    deleteCourse,
    createSession,
    updateSession,
    deleteSession,
  }
})
