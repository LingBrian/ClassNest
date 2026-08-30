// command 模块占位（Phase 0 骨架，尚未注册任何 command）。
//
// 规划（见 docs/API.md §9 / tech.md §7）：
// - file.rs    文件系统（读写/选择文件）
// - backup.rs  备份文件读写
// - system.rs  系统信息 / 原生窗口 / 托盘
//
// 落地纪律：
// - 只允许在这三个文件内新增 command 函数；
// - 新增 command 文件 / 修改 capabilities / tauri.conf.json 必须先征求用户；
// - 不为普通 DB CRUD 建 command。