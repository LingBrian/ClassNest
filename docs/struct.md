# 一、技术栈

## Frontend

### 选型：

```text

Vue3 
+
Vite
+
TypeScript
+
Pinia
+
Vue Router
+
Element Plus / Naive UI
+
SCSS

```

### 目录：

```
src

├── views
│
├── components
│
├── stores
│
├── api
│
├── database
│
└── utils
```

## Tauri Backend

### 目录：
```

src-tauri

├── src
│   |
│   ├── main.rs
│   ├── commands
│   └── database
│
└── tauri.conf.json

```
## SQLite

### 使用项目

```
@tauri-apps/plugin-sql
```

### 调用：

```typescript

import Database from "@tauri-apps/plugin-sql";

const db =
await Database.load(
"sqlite:wakeup.db"
);


let courses =
await db.select(
"SELECT * FROM course"
);

```