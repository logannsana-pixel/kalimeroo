# Project rules

- Manage theme state with the app-wide next-themes provider and semantic CSS tokens; shared controls must not maintain independent theme state, so preferences persist across every entry route.
- Use public/manifest.webmanifest as the single PWA manifest source and disable VitePWA manifest generation; preview and production must expose the same branded install metadata.
- Use browser timer return types and schema-derived update payloads in frontend code to avoid Node-only globals and excess database properties.