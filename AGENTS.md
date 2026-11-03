# Project rules

- Manage theme state with the app-wide next-themes provider and semantic CSS tokens; shared controls must not maintain independent theme state, so preferences persist across every entry route.
- Define the PWA manifest in VitePWA only; its generated manifest must remain consistent with the branded public PNG icons.
- Use browser timer return types and schema-derived update payloads in frontend code to avoid Node-only globals and excess database properties.