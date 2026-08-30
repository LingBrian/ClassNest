// ClassNest 桌面入口：仅委托 lib::run()，不写业务逻辑（见 docs/API.md §9）。
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    classnest_lib::run()
}