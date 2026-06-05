# React Guidelines

## Stack

| Layer        | Library / Tool                                                    |
| ------------ | ----------------------------------------------------------------- |
| Framework    | React 18 + TypeScript (Vite PWA)                                  |
| Global state | Redux Toolkit + `react-redux`                                     |
| Auth         | Clerk (`@clerk/clerk-react`)                                      |
| i18n         | `i18next` + `react-i18next`                                       |
| UI           | MUI v5 — see [COMPONENT_GUIDELINES.md](./COMPONENT_GUIDELINES.md) |

---

## File structure

The project follows a standard Vite React layout. `public/` and config files live at the root; all source code lives inside `src/`. The backend is a separate process and never part of the Vite bundle.

```
project-root/
├── public/                   ← Static assets served as-is (not bundled)
│   ├── wheel.html            ← Isolated iframe for the spin wheel
│   ├── spin-wheel-game.umd.js
│   ├── favicon.png
│   └── icon.png
│
├── src/                      ← All frontend source (bundled by Vite)
│   ├── main.tsx              ← Vite entry point (mounts <App />)
│   ├── App.tsx               ← Root component: theme, providers
│   ├── vite-env.d.ts
│   │
│   ├── pages/                ← One file per route/view
│   │   ├── HomePage.tsx
│   │   └── AuthPage.tsx
│   │
│   ├── components/           ← Reusable UI, one folder per component
│   │   └── ComponentName/
│   │       ├── ComponentName.tsx
│   │       └── ComponentName.styles.ts   ← only if reused 3+ times
│   │
│   ├── store/                ← Redux Toolkit
│   │   ├── store.ts
│   │   ├── hooks.ts          ← useAppDispatch / useAppSelector
│   │   └── slices/
│   │       └── appSlice.ts
│   │
│   ├── db/                   ← Client→server bridge (fetch only, no SQL)
│   │   └── queries.ts        ← One typed function per API route
│   │
│   ├── i18n/                 ← i18next config and translation files
│   │   ├── index.ts
│   │   └── locales/
│   │       ├── en.json
│   │       ├── es.json
│   │       └── pt.json
│   │
│   ├── utils/
│   │   └── types.ts          ← All shared TypeScript interfaces
│   │
│   └── styles/               ← Shared MUI sx objects (use sparingly)
│
├── server/                   ← Backend: Express + Neon SQL (never imported by src/)
│   └── index.ts
│
├── docs/                     ← Claude guidelines
├── index.html                ← Vite HTML shell (references /src/main.tsx)
├── vite.config.ts
├── tsconfig.json
└── package.json
```

### Rules

- **`pages/`** orchestrates data, state, and handlers. **`components/`** receive everything via props and own no Redux or DB logic.
- The `server/` folder is a separate Node process (started with `concurrently`). Never import from it inside `src/`.
- Never add SQL or `@neondatabase/serverless` imports inside `src/`.

---

## Components

### Functional components only

```tsx
// ✅
export default function TaskCard({ title, difficulty }: TaskCardProps) { ... }

// ❌ No class components
class TaskCard extends React.Component { ... }
```

### Props typing

Never define interfaces inside component files. All interfaces live in [`utils/interfaces.ts`](../src/utils/interfaces.ts) — including component prop interfaces. Import from there.

```tsx
// ✅
import { IActiveTaskSectionProps } from "../../utils/interfaces";

export default function ActiveTaskSection({ assignedTask, onComplete }: IActiveTaskSectionProps) { ... }

// ❌ No local interface definitions inside components
interface ActiveTaskSectionProps {
  assignedTask: ITask | null;
  onComplete: () => void;
}
```

Type aliases (`type`) and constants stay in [`utils/types.ts`](../src/utils/types.ts):

```tsx
// utils/types.ts
export type Language = "en" | "es" | "pt";
export const languageOptions = [...] as const;
```

### No prop drilling beyond two levels

If a value needs to pass through more than two components, put it in Redux instead.

---

## State management

### Local UI state → `useState`

Use `useState` for ephemeral UI state: form fields, toggle visibility, feedback messages.

```tsx
const [taskTitle, setTaskTitle] = useState("");
const [message, setMessage] = useState<string | null>(null);
```

### Global app state → Redux Toolkit

Users and tasks live in [`store/slices/appSlice.ts`](../store/slices/appSlice.ts). Always use the typed hooks from [`store/hooks.ts`](../store/hooks.ts):

```tsx
import { useAppDispatch, useAppSelector } from "../store/hooks";

const dispatch = useAppDispatch();
const { users, tasks } = useAppSelector((state) => state.app);
```

Never read or write `users`/`tasks` from component-local state.

### Derived state → `useMemo`

Compute filtered/transformed values with `useMemo` to avoid recalculation on every render:

```tsx
const incompleteTasks = useMemo(
  () => tasks.filter((t) => t.ownerEmail === authEmail && !t.completed),
  [tasks, authEmail],
);
```

---

## Side effects

### `useEffect` rules

- One concern per `useEffect`. Do not combine unrelated side effects.
- Always list every reactive value in the dependency array.
- Use the `// eslint-disable-next-line react-hooks/exhaustive-deps` escape only for stable refs (e.g., `i18n`) when you intentionally want the effect to run once.

```tsx
// ✅ Load data on sign-in
useEffect(() => {
  if (!isSignedIn || !authEmail) return;
  loadUserData(authEmail).then(({ user, tasks }) => { ... });
}, [isSignedIn, authEmail, dispatch]);

// ❌ Multiple concerns in one effect
useEffect(() => {
  loadUserData(authEmail);
  i18n.changeLanguage(language);
}, [authEmail, language]);
```

### Async handlers

Never pass an `async` function directly to `useEffect`. Use an inner async function or a `.then()` chain:

```tsx
// ✅
useEffect(() => {
  if (!authEmail) return;
  loadUserData(authEmail).then(({ user }) => { ... });
}, [authEmail]);

// ❌
useEffect(async () => { ... }, [authEmail]);
```

---

## Event handlers

### Pattern: optimistic Redux update after DB write

Always persist to the database first, then dispatch to Redux. This keeps the store in sync with truth.

```tsx
const handleComplete = async () => {
  const completedTask = { ...assignedTask, completed: true };
  await updateTaskInDb(completedTask); // 1. persist
  dispatch(updateTask(completedTask)); // 2. update store
};
```

### Parallel writes with `Promise.all`

When two independent DB calls must succeed together, use `Promise.all`:

```tsx
await Promise.all([
  upsertUser(dbUser(updatedCurrent)),
  upsertUser(dbUser(updatedPartner)),
]);
dispatch(updateUser(updatedCurrent));
dispatch(updateUser(updatedPartner));
```

---

## Auth (Clerk)

Use Clerk hooks for all auth state. Do not store auth info in Redux.

```tsx
const { user, isLoaded, isSignedIn } = useUser();
const { signOut, openSignIn, openSignUp } = useClerk();
```

### Loading guard pattern

Always render a loading state while Clerk initializes, then a signed-out state, then the authenticated view:

```tsx
if (!isLoaded) return <CircularProgress />;
if (!isSignedIn) return <SignedOutView />;
return <AuthenticatedView />;
```

---

## Internationalization (i18n)

All user-visible strings must go through `useTranslation`. Keys are defined in [`i18n/locales/`](../i18n/locales/).

```tsx
const { t } = useTranslation();
<Typography>{t("taskCreated")}</Typography>

// ✅ Fallback for keys not yet translated
<Typography>{t("yourTasksTitle", "Tus tareas")}</Typography>

// ❌ Hardcoded strings
<Typography>Tarea creada</Typography>
```

Language preference is persisted in `localStorage` under the key `"task-sorter-language"`. Do not use Redux for this.

---

## TypeScript

- All interfaces (domain + component props) live in [`utils/interfaces.ts`](../src/utils/interfaces.ts). Never define an `interface` inside a component file.
- Type aliases and constants live in [`utils/types.ts`](../src/utils/types.ts).
- Prefer `interface` over `type` for object shapes.
- Use `Pick<T, ...>` / `Omit<T, ...>` when passing partial shapes to DB functions instead of creating duplicate interfaces.
- Never use `any`. Use `unknown` and narrow explicitly.

```tsx
// ✅
function rowToTask(row: Record<string, unknown>): ITask { ... }

// ❌
function rowToTask(row: any) { ... }
```

---

## Performance rules

- Do not pass new object/array literals as props — they create a new reference on every render. Extract to `useMemo` or define outside the component.
- Avoid anonymous inline arrow functions in JSX for handlers that are called frequently; define them as named `const` handlers.
- Keep pages lean: move any computation that depends only on props/store into `useMemo`.
