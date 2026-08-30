import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default defineConfigWithVueTs(
  { name: 'app/files-to-lint', files: ['**/*.{ts,mts,tsx,vue}'] },
  { name: 'app/files-to-ignore', ignores: ['**/dist/**', '**/coverage/**', '**/src-tauri/**'] },
  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  {
    name: 'classnest/rules',
    files: ['**/*.{ts,vue}'],
    rules: {
      // 日志规范见 CONVENTIONS.md §10：正式环境统一 Logger；开发阶段只放行 debug/warn/error
      'no-console': ['error', { allow: ['debug', 'warn', 'error'] }],
    },
  },
  skipFormatting,
)
