# DEVELOPMENT.md — ClassNest 开发规范与验证流程

> 权威来源：`docs/tech.md`（§59-64 阶段）、`docs/项目实施计划.md`（Phase 0-10、里程碑、MVP DoD）、`AGENTS.md`。
> 工具链结论（2026-08-29 已决策，见 `docs/DECISIONS.md` D-3/4/5）：包管理器 **pnpm**；测试 **Vitest**（Repository 单测用 test-only 依赖 `better-sqlite3`）；Lint/Format **ESLint + Prettier**。
> **当前阶段：Phase 1 进行中（2026-08-29，第一切片已落地）**，命令表已回填真实命令；未落地业务不得声称验收通过。

## 1. 当前阶段与状态

- 脚手架已落地（工具链：pnpm/Vitest/ESLint+Prettier；Tauri 2 + plugin-sql 接入；migration 0001-0004 与幂等测试）。
- Phase 1 第一切片已落地（2026-08-29）：`src/models/` 五文件、`ScheduleRepository`/`CourseRepository`/`CourseSessionRepository`（含新建课表三件套、RepositoryDb 依赖注入）、`scheduleStore`/`courseStore`，共 13 个单测通过；`pnpm build`/`test`/`lint`/`format:check` 全绿。
- UI 切片已落地（2026-08-29）：`components/schedule/ScheduleCreateDialog.vue`（新建课表三件套）、课程编辑（`components/course/` 三个组件）、主课表骨架（`components/schedule-grid/` 五个组件）与空状态；已接入 scheduleStore/courseStore。`pnpm build/test/lint/format:check` 全绿。
- 已定决策：D-1（components 目录拆分）、D-2（Hash）、D-6（strict）、D-8（PRAGMA user_version）、D-10（classnest.db）；剩余 OPEN 项见 `docs/DECISIONS.md`。
- 已知暂缓（见 DECISIONS N-4）：周数完整编辑器、今天跳转、主课表按周过滤与位置布局——均依赖 Phase 2 Engine，当前以骨架呈现。

## 2. 命令表（Todo：脚手架建立后回填）

| 用途 | 命令 | 状态 |
| --- | --- | --- |
| 前端依赖 | `pnpm install` | Phase 0 已落地 |
| 本地开发 | `pnpm dev` | Phase 0 已落地 |
| 构建（含类型检查） | `pnpm build` | Phase 0 已落地 |
| 预览产物 | `pnpm preview` | Phase 0 已落地 |
| 单元测试（单次） | `pnpm test` | Phase 0 已落地（Vitest） |
| 单测 watch | `pnpm test:watch` | Phase 0 已落地 |
| Lint | `pnpm run lint` | Phase 0 已落地（ESLint） |
| Lint 修复 | `pnpm run lint:fix` | Phase 0 已落地 |
| Format | `pnpm run format` | Phase 0 已落地（Prettier） |
| Format 检查 | `pnpm run format:check` | Phase 0 已落地 |
| Tauri 开发 | `pnpm tauri dev` | 已接入（需本机 Rust 工具链；GUI 验收属人工） |
| Tauri 构建 | `pnpm tauri build` | Phase 0 `bundle.active=false`，暂不打包，待后续决策 |

> 验证通过定义：`pnpm build` 0 错误；`pnpm test` 全绿；`pnpm run lint` 与 `pnpm run format:check` 0 报错。Tauri 窗口/视觉/交互、重启后数据仍在，属人工验收项。

## 3. 每次修改代码前的检查清单

1. 读相关现有代码与文档（tech.md / 对应规范 / DECISIONS.md 相关未定项），禁止凭记忆或猜测开发；
2. 若仓库已初始化 Git，先看 `git status`，确认没有丢失他人/未提交的改动；
3. `rg` 搜索确认该能力是否已存在实现，禁止重复造轮子；
4. 检查 `docs/tech.md` 是否已定义该功能；未定义的就是 NEEDS_DECISION，先登记 DECISIONS 再问用户；
5. 如果涉及数据库，确认是否必须新增 migration（`0005_xxx.sql` 起）以及是否影响级联删除；
6. 如果跨层（Repository/Engine/Store/Importer/Tauri command）变更接口，先改 API.md；
7. 确认当前 Phase 未完成前不做下一阶段范围的开发。

## 4. 每次修改后的验证清单

1. 运行相关单测（当前命令表 TODO，落地后必须执行）；
2. 运行 Lint / Format（落地后必须执行，保持格式一致）；
3. `npm run build` 必须通过（Phase 0 验收标准之一）；
4. Tauri dev 能正常启动、SQLite 正常创建（Phase 0）；
5. 给出受影响文件清单；
6. 验收结果如实分类上报，禁止自证通过：
   - **Agent 可自动验证**：单测 / Lint / Format / Build / 静态检查——由 Agent 执行并报告结果；
   - **需用户验收**：重启后数据仍在、Tauri 窗口与视觉、交互体验、深色/浅色 UI——Agent 只执行可执行部分，交付「已自动验证 / 待用户验收」清单。

## 5. 落地顺序（每个功能/Phase 内部）

```text
领域模型（models） → Repository（含 migration） → Engine → Pinia Store → Service → UI → 测试
```

> 例外：纯 UI 性改动（类名/样式/组件拆分）不强制走全链，但必须不写领域算法、不直连 DB。

## 6. 阶段与验收（Phase 0 → 10）

- Phase 0 项目骨架：build / Tauri dev / SQLite 创建 / migration 执行 / 重启保留数据 / Naive UI Provider 正常。
- Phase 1 Schedule Core：课表/课程/时间段 CRUD、主课表骨架、切周、空状态、删除 NDialog。
- Phase 2 Schedule Engine：WeekRule/Date/Conflict/Position/Schedule 引擎 + 九项验收（见 tech.md §59 / 项目实施计划 §5），**未过验收禁止继续大量开发 UI**。
- Phase 3 多课表：切换器、管理页、新建课表三件套、数据隔离、级联删除。
- Phase 4 外观：ScheduleStyle + 实时预览 + 保存策略（普通字段保存按钮/外观实时保存）。
- Phase 5 CSV 导入导出：统一 CourseImporter 接口 + Parse→Validate→Preview→Confirm→Commit 管线 + csvExporter。
- Phase 6 Backup/Restore/ICS：完整 JSON 备份、事务恢复回滚、ICS 不生成 VALARM。
- Phase 7 调课：CourseOverride（move/cancel/replace），原课程不被修改，只影响指定日期；**复用已内置表（0002_course_override），不新增表**。
- Phase 8 HTML 导入：GenericHtmlImporter + ImporterRegistry + ImportTypeSelector，学校适配后置。
- Phase 9 自动备份：每天首次启动检查、默认关闭、最多保留 10 个、删除旧备份。
- Phase 10 高级功能（MVP 后置）：拖拽导入/复制课表/高级调课/悬浮窗口/托盘等，每项独立 DoD。

每个 Phase 完成必须输出（Completion Rule）：

```text
1. 修改了哪些文件      2. 新增了哪些功能      3. 数据库是否变化
4. 新增了哪些测试      5. 当前验收结果        6. 已知问题
7. 下一阶段建议
```

## 7. Definition of Done

一个功能同时满足才算完成：

```text
代码完成 + UI 完成 + 数据持久化完成 + 错误处理完成 + 测试完成 + 重启验证完成
```

MVP DoD 21 项清单见 `docs/项目实施计划.md` §15。

执行边界：**“测试完成”以 Agent 可运行的自动单测结果为准**；**“重启验证完成 / UI 完成 / Tauri 窗口与视觉”由用户验收**，Agent 交付时必须附「已自动验证 / 待用户验收」清单，不得自行宣布 DoD 全部达成。

## 8. 测试范围（必测）

```text
WeekRuleEngine / DateEngine / ConflictEngine / PositionEngine
CSV Importer / Backup Importer
```

重点用例：连续周、单双周、自定义周、跨月、跨年、多时间段、冲突、调课、删除级联、自定义时间。

## 9. 跨阶段与重构纪律

- 禁止跨阶段大量开发；当前 Phase 未过验收不得进入下一阶段。
- 优先 small patch；重大架构修改必须说明原因并进 DECISIONS.md。