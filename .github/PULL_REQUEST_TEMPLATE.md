<!--
请遵循 AGENTS.md §13-15 的 Issue 驱动流程与 PR 规范。
PR 基分支为 main。合并前 pnpm build / pnpm test / pnpm run lint / pnpm run format:check 必须全绿。
禁止直接 merge 没有测试结果的 PR。
-->

## Related Issue

<!-- 关联 Issue，例如：closes #12 -->
- 

## Changes

<!-- 修改文件清单与改动摘要；只改本 Issue 相关文件，禁止顺手重构。 -->

## Database Changes

<!-- 是否涉及数据库变化：是 / 否。
若「是」须列出新增 migration 编号（自 0005_xxx.sql 起）与内容；禁止修改旧 migration。 -->

## Tests

<!-- 新增/修改的单测清单与运行结果。必须提供真实输出结论，禁止 Artifact 自证通过 UI/重启项。 -->
- `pnpm test`：
- `pnpm run lint`：
- `pnpm run format:check`：
- `pnpm build`：

## Screenshot

<!-- 涉及 UI/视觉变更时贴图；无界面改动的可填 N/A。 -->

## Checklist

- [ ] 关联 Issue 已创建或存在，PR 已在描述中引用
- [ ] 已从 `main` 切出分支，命名符合 `fix/`、`feat/`、`refactor/` 前缀
- [ ] 只修改了本 Issue 相关文件，未顺手重构 / 未改无关文件
- [ ] 未引入新依赖、未新增第 5 个 Store、未修改架构（如有需先走 DECISIONS 征求用户）
- [ ] `pnpm test` 全绿且列出了测试结果
- [ ] `pnpm run lint`、`pnpm run format:check`、`pnpm build` 均 0 报错
- [ ] 验收结果已分类：已自动验证（单测/Lint/Format/Build）/ 待用户验收（重启验证/UI/视觉）
