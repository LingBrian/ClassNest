---
name: Phase Task
about: 某个 Phase 及其验收的子任务
title: '[Phase] '
labels: phase
assignees: ''
---

## Phase编号

<!-- 例如：Phase 3 多课表 -->

## 目标

<!-- 该阶段要交付的能力与用户可见结果。 -->

## 涉及模块

<!-- 预期会创建/修改的目录与文件（models / Engine / Store / Repository / UI / migration）。 -->

## 禁止修改

<!-- 先读代码确认现状，明确列出本阶段不得触碰的内容：
未涉及功能的既有代码、旧 migration、capabilities、tauri.conf.json、docs/tech.md 等。 -->

## DoD

<!-- 一功能需同时满足六项才算完成：代码 + UI + 持久化 + 错误处理 + 测试 + 重启验证。
（重启验证 / UI / 视觉由用户验收，Agent 不得自证通过。） -->

- [ ] 代码完成
- [ ] UI 完成
- [ ] 数据持久化完成
- [ ] 错误处理完成
- [ ] 测试完成（自动单测全绿）
- [ ] 重启验证完成（用户验收）
