# Clean Code Guidelines

## Project Structure Conventions

### Utils Folder — Shared Definitions

All shared TypeScript definitions and constant values must live inside `src/utils/`, each in its own dedicated file.

| Category   | File                      | What goes there                                     |
|------------|---------------------------|-----------------------------------------------------|
| Interfaces | `src/utils/interfaces.ts` | `interface` declarations shared across components   |
| Types      | `src/utils/types.ts`      | `type` aliases shared across components             |
| Enums      | `src/utils/enums.ts`      | `enum` declarations used in more than one file      |
| Constants  | `src/utils/constants.ts`  | Module-level `const` values used in more than one file |

**Rules:**

- ANY type, interface, enum, or constant needs to be move it to the appropriate `utils/` file.
- Never scatter shared definitions across component files or inline them in `store/` slices — keep `utils/` as the single source of truth.
- Do not mix categories in one file (e.g., do not export both interfaces and enums from `interfaces.ts`).

### Interfaces — Separation of concerns within `interfaces.ts`

Organize `src/utils/interfaces.ts` in two clearly marked sections:

```ts
// ── Domain ────────────────────────────────────────────────────────────────────
// Entities: IUser, ITask, IPartnerRequest, IAppState, etc.

// ── Component Props ───────────────────────────────────────────────────────────
// Prop shapes: ITaskCardProps, IAppHeaderProps, etc.
```

Domain interfaces describe data that exists independently of the UI. Component prop interfaces describe what a component receives. Keep them separate so domain logic is never coupled to render concerns.

---

## Naming Conventions

| Construct  | Convention          | Example                        |
|------------|---------------------|--------------------------------|
| Interface  | `I` prefix          | `ITask`, `ITaskCardProps`      |
| Type alias | No prefix           | `Language`, `DifficultyLevel`  |
| Enum       | PascalCase          | `TaskStatus`, `UserRole`       |
| Component  | PascalCase          | `TaskCard`, `CreateTaskForm`   |
| File       | Same as export name | `TaskCard.tsx`, `types.ts`     |

---

## Component File Structure

Every component file must follow this top-to-bottom order:

1. **Imports** — external libraries first, then internal paths
2. **Helper functions** — pure functions that support the component, defined before use
3. **Component** — single default export
4. **Named exports** — only if needed

No interfaces, types, enums, or constants may be declared inside component files — all definitions live in `src/utils/`.

```tsx
// 1. Imports
import { Box, Typography } from '@mui/material'
import { ITaskCardProps } from '../../utils/interfaces'

// 2. Local helpers
function getDifficultyColor(d: number): 'success' | 'info' | 'error' { ... }

// 3. Component
export default function TaskCard({ title, difficulty }: ITaskCardProps) {
  return ( ... )
}
```

---

## Internationalisation (i18n)

- Every string visible to the user must go through `t()` from `react-i18next`. No hardcoded UI text.
- Translation keys live in `src/i18n/locales/`.
- Add the key to all locale files (`en.json`, `es.json`, `pt.json`) at the same time.

```tsx
// Bad
<Typography>Create task</Typography>

// Good
const { t } = useTranslation()
<Typography>{t('createTaskTitle')}</Typography>
```
