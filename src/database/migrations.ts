import m0001 from './migrations/0001_initial.sql?raw'
import m0002 from './migrations/0002_course_override.sql?raw'
import m0003 from './migrations/0003_schedule_style.sql?raw'
import m0004 from './migrations/0004_app_settings.sql?raw'

export interface Migration {
  /** migration 名称（== SQL 文件名去掉 .sql 后缀），用于记账/日志 */
  name: string
  /** SQL 内容，由 runner 顺序执行 */
  sql: string
}

// 顺序即应用顺序；新增迁移一律追加到数组末尾，并与迁移文件名编号顺延（0005_xxx.sql 起）。
export const migrations: Migration[] = [
  { name: '0001_initial', sql: m0001 },
  { name: '0002_course_override', sql: m0002 },
  { name: '0003_schedule_style', sql: m0003 },
  { name: '0004_app_settings', sql: m0004 },
]
