export interface Course {
  id: number
  scheduleId: number
  name: string
  /** hex 颜色，如 #4C8DFF */
  color: string
  credits?: number | null
  note?: string | null
  createdAt: string
  updatedAt: string
}
