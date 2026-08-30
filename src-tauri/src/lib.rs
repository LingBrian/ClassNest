// ClassNest Tauri 侧程序入口（Phase 0 骨架）

// 职责边界（见 docs/ARCHITECTURE.md §7、docs/API.md §11）：
// - Rust 只承担真正需要原生能力的事：文件系统 / 备份 / 系统信息 / 原生窗口 / 托盘；
// - 普通 DB CRUD 一律由前端 Repository + @tauri-apps/plugin-sql 完成，不为 CRUD 写 command；
// - command 一律返回统一 成功/失败 结构，禁止用 panic 表达业务错误。

mod commands;

use tauri_plugin_sql::Builder as SqlPluginBuilder;

pub fn run() {
    tauri::Builder::default()
        .plugin(SqlPluginBuilder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running ClassNest")
}