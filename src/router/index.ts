import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// 路由集合固定（见 docs/页面路由设计.md §1，tech.md §51）：
// Router 模式按 DECISIONS D-2 推荐落地为 Hash（Tauri 打包避免刷新 404），仍 OPEN 待用户确认。
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'schedule',
    component: () => import('@/views/ScheduleView.vue'),
    meta: { title: '我的课表' },
  },
  {
    path: '/schedules',
    name: 'schedule-manager',
    component: () => import('@/views/ScheduleManagerView.vue'),
    meta: { title: '课表管理' },
  },
  {
    path: '/schedule/:id/settings',
    name: 'schedule-settings',
    component: () => import('@/views/ScheduleSettingsView.vue'),
    props: true,
    meta: { title: '课表设置' },
  },
  {
    path: '/course/new',
    name: 'course-new',
    component: () => import('@/views/CourseEditorView.vue'),
    meta: { title: '新增课程' },
  },
  {
    path: '/course/:id/edit',
    name: 'course-edit',
    component: () => import('@/views/CourseEditorView.vue'),
    props: true,
    meta: { title: '编辑课程' },
  },
  {
    path: '/import',
    name: 'import',
    component: () => import('@/views/ImportView.vue'),
    meta: { title: '导入' },
  },
  {
    path: '/export',
    name: 'export',
    component: () => import('@/views/ExportView.vue'),
    meta: { title: '导出' },
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/GlobalSettingsView.vue'),
    meta: { title: '全局设置' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.afterEach((to) => {
  const title = typeof to.meta.title === 'string' ? to.meta.title : 'ClassNest'
  document.title = title === 'ClassNest' ? 'ClassNest' : `${title} · ClassNest`
})

export default router
