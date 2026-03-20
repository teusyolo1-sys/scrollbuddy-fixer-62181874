# AI Rules

## Tech stack
- React 18 + TypeScript powers the frontend application.
- Vite is used for development, builds, and local preview.
- React Router handles client-side routing, with routes defined in `src/App.tsx`.
- Tailwind CSS is the primary styling system for layout, spacing, typography, and responsive design.
- shadcn/ui components in `src/components/ui` are the default UI building blocks.
- Radix UI provides the accessible primitives underneath many UI components.
- Supabase is the backend platform for authentication and database access, via `src/integrations/supabase`.
- TanStack React Query is available for server-state fetching, caching, and async synchronization.
- Zustand is available for lightweight client-side/global state.
- React Hook Form + Zod are available for forms and validation.

## Library usage rules

### UI and styling
- Use **shadcn/ui** first for buttons, dialogs, forms, cards, tables, tabs, sheets, dropdowns, toasts, and other common UI.
- Use **Radix UI** only when a needed primitive is not already wrapped by an existing shadcn/ui component.
- Use **Tailwind CSS** for all styling. Prefer utility classes directly in components instead of custom CSS when possible.
- Use **`src/index.css`** only for global styles, theme tokens, and truly app-wide rules.
- Use **lucide-react** for icons. Do not introduce another icon library unless there is a strong existing requirement.
- Use **Sonner** for toast notifications.
- Use **framer-motion** only when a UI interaction clearly benefits from animation; avoid decorative overuse.

### Routing and app structure
- Keep all route definitions in **`src/App.tsx`**.
- Put pages in **`src/pages/`** and reusable components in **`src/components/`**.
- Keep new source files inside **`src/`**.
- Prefer small, focused components over large multi-purpose files.

### Data, state, and backend
- Use **Supabase** for authentication, database reads/writes, and backend-integrated app data.
- Use **TanStack React Query** for remote data fetching, caching, invalidation, and background refetching.
- Use **Zustand** for client-side shared state such as UI state or temporary workflow state.
- Do not use Zustand for server data that should be fetched and cached with React Query.
- Keep Supabase client setup inside **`src/integrations/supabase/`** and reuse the existing client.

### Forms and validation
- Use **React Hook Form** for form state management.
- Use **Zod** for schema validation, especially for user input and boundary validation.
- Prefer integrating Zod with React Hook Form through **`@hookform/resolvers/zod`**.

### Utilities and conventions
- Use **`src/lib/utils.ts`** utilities and existing helpers before adding new generic helpers.
- Reuse existing hooks from **`src/hooks/`** before creating a new one.
- Reuse existing store patterns from **`src/store/`** when shared client state is necessary.
- Follow existing aliases and imports such as **`@/`** for `src` paths.

## Implementation preferences
- Prefer existing components and patterns already present in the codebase over introducing new libraries.
- Avoid adding new dependencies when the current stack already supports the feature.
- Build accessible UI by favoring existing shadcn/ui and Radix patterns.
- Keep solutions simple, typed, and consistent with the current file structure.
