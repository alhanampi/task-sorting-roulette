# Component Guidelines

## UI Library: Material UI (MUI)

This project uses **[Material UI (MUI) v5](https://mui.com)** as its sole UI component library. All components **must** use MUI unless explicitly documented as an exception below.

---

## Rule: Use MUI, never custom components

When building UI, use MUI components directly. Do **not**:

- Create custom wrappers around MUI components
- Write CSS files or CSS-in-JS outside of MUI's `sx` prop / `styled` utility
- Import from `styled-components`, `@emotion` directly, or any other styling library
- Create hand-rolled HTML elements (`<div>`, `<button>`, etc.) where an MUI equivalent exists

### Correct

```tsx
import { Button, TextField, Stack } from "@mui/material";

<Stack spacing={2}>
  <TextField label="Título" fullWidth />
  <Button variant="contained">Guardar</Button>
</Stack>;
```

### Incorrect

```tsx
// ❌ Custom styled component
const MyButton = styled.div`background: blue`

// ❌ Raw HTML when MUI exists
<div style={{ display: 'flex', gap: 8 }}>
  <input type="text" />
  <button>Guardar</button>
</div>
```

---

## Approved MUI components

| Use case          | MUI Component                             |
| ----------------- | ----------------------------------------- |
| Layout / spacing  | `Box`, `Container`, `Stack`, `Grid`       |
| Text              | `Typography`                              |
| Buttons           | `Button`, `IconButton`, `ToggleButton`    |
| Text inputs       | `TextField`                               |
| Selection         | `Select`, `MenuItem`, `ToggleButtonGroup` |
| Cards / surfaces  | `Card`, `CardContent`, `Paper`            |
| Feedback messages | `Alert`, `Snackbar`                       |
| Loading states    | `CircularProgress`, `LinearProgress`      |
| Tags / badges     | `Chip`                                    |
| Dividers          | `Divider`                                 |
| Navigation        | `Tabs`, `Tab`                             |
| Dialogs           | `Dialog`, `DialogTitle`, `DialogContent`  |
| App bar           | `AppBar`, `Toolbar`                       |

---

## Theming

The app theme is defined in [App.tsx](../App.tsx) inside `createTheme`. Colors follow the dark design system:

| Token              | Value     |
| ------------------ | --------- |
| Primary            | `#38bdf8` |
| Background default | `#0f172a` |
| Background paper   | `#1e293b` |
| Text primary       | `#e2e8f0` |
| Text secondary     | `#94a3b8` |

Use theme tokens via the `sx` prop or `useTheme()` hook. Do **not** hardcode hex values.

```tsx
// ✅ Use theme tokens
<Typography color="text.secondary">Subtítulo</Typography>
<Box sx={{ bgcolor: 'background.paper', p: 2 }}>...</Box>

// ❌ Don't hardcode colors
<Box style={{ backgroundColor: '#1e293b' }}>...</Box>
```

---

## Exception: TaskWheel component

The [`components/TaskWheel/TaskWheel.tsx`](../components/TaskWheel/TaskWheel.tsx) component is **exempt** from MUI requirements. It renders the spin wheel via an `<iframe>` pointing to [`public/wheel.html`](../public/wheel.html), which loads the `spin-wheel-game.umd.js` UMD bundle in isolation (with its own bundled React 18 from CDN).

- The iframe wrapper (`Box` + `CircularProgress` loading state) **must** use MUI.
- The content inside `wheel.html` uses plain HTML/JS and is intentionally outside the MUI system.
- Do **not** apply MUI components inside `wheel.html`.

---

## Styling order of preference

1. **MUI `sx` prop** — for one-off overrides on any MUI component
2. **`styled()` from `@mui/material/styles`** — only when the same style is reused in 3+ places
3. **`createTheme` overrides** — for global defaults on MUI components

Avoid mixing approaches within the same component.
