# UI Components: [Project Name]

**Framework**: React 19
**Component Library**: shadcn/ui (Radix UI primitives)
**Styling**: Tailwind v4
**Forms**: React Hook Form + Zod
**State**: TanStack Query (server) + Zustand (client)
**Last Updated**: [Date]

---

## Overview

This document outlines the component hierarchy, reusable components, forms, and UI patterns.

**Component Philosophy**:
- **Composition over configuration** - Build complex UIs from simple parts
- **Accessibility first** - All components keyboard navigable, ARIA compliant
- **shadcn/ui ownership** - Components copied to codebase, not npm dependency
- **Tailwind utility classes** - Minimal custom CSS
- **Dark mode support** - All components adapt to theme

---

## Component Hierarchy

```
App
├── Providers
│   ├── ClerkProvider (auth)
│   ├── ThemeProvider (dark/light mode)
│   └── QueryClientProvider (TanStack Query)
│
├── Layout
│   ├── Header
│   │   ├── Logo
│   │   ├── Navigation
│   │   └── UserMenu
│   ├── Main (page content)
│   └── Footer (optional)
│
└── Pages (routes)
    ├── HomePage
    │   ├── HeroSection
    │   ├── FeaturesSection
    │   └── CTASection
    │
    ├── DashboardPage
    │   ├── Sidebar
    │   │   └── NavLinks
    │   └── DashboardContent
    │       ├── StatsCards
    │       └── [ResourceList]
    │
    ├── [Resource]Page
    │   ├── [Resource]List
    │   │   ├── [Resource]Card (for each item)
    │   │   └── Pagination
    │   └── [Resource]CreateDialog
    │
    └── [Resource]DetailPage
        ├── [Resource]Header
        ├── [Resource]Info
        └── [Resource]Actions
```

---

## Core Layout Components

### `App.tsx`
**Purpose**: Root component with providers

**Structure**:
```tsx
import { ClerkProvider } from '@clerk/clerk-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/components/theme-provider'
import { Router } from '@/router'

const queryClient = new QueryClient()

export function App() {
  return (
    <ClerkProvider publishableKey={...}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system" storageKey="app-theme">
          <Router />
        </ThemeProvider>
      </QueryClientProvider>
    </ClerkProvider>
  )
}
```

---

### `Layout.tsx`
**Purpose**: Common layout wrapper for authenticated pages

**Props**: None (uses `Outlet` from react-router)

**Structure**:
```tsx
export function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
```

**Files**: `src/components/layout/Layout.tsx`, `Header.tsx`, `Footer.tsx`

---

### `Header.tsx`
**Purpose**: Top navigation bar

**Features**:
- Logo/brand
- Navigation links
- User menu (authenticated) or Sign In button (unauthenticated)
- Theme toggle (dark/light mode)

**Structure**:
```tsx
export function Header() {
  return (
    <header className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Logo />
          <Navigation />
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <UserButton />
        </div>
      </div>
    </header>
  )
}
```

**Files**: `src/components/layout/Header.tsx`

---

## shadcn/ui Components Used

### Installed Components
Run these to add components:
```bash
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add dropdown-menu
pnpm dlx shadcn@latest add form
pnpm dlx shadcn@latest add input
pnpm dlx shadcn@latest add label
pnpm dlx shadcn@latest add select
pnpm dlx shadcn@latest add textarea
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add badge
pnpm dlx shadcn@latest add avatar
pnpm dlx shadcn@latest add skeleton
pnpm dlx shadcn@latest add toast
```

**Location**: `src/components/ui/`

**Ownership**: These are now part of our codebase, modify as needed

---

## Custom Components

### `[Resource]List.tsx`
**Purpose**: Display list of [resources] with loading/error states

**Props**:
```typescript
interface [Resource]ListProps {
  // No props - uses TanStack Query internally
}
```

**Structure**:
```tsx
export function [Resource]List() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['[resources]'],
    queryFn: fetch[Resources]
  })

  if (isLoading) return <[Resource]ListSkeleton />
  if (error) return <ErrorMessage error={error} />

  return (
    <div className="space-y-4">
      {data.map(item => (
        <[Resource]Card key={item.id} item={item} />
      ))}
    </div>
  )
}
```

**Files**: `src/components/[resource]/[Resource]List.tsx`

---

### `[Resource]Card.tsx`
**Purpose**: Display single [resource] item

**Props**:
```typescript
interface [Resource]CardProps {
  item: [Resource]
  onEdit?: (id: number) => void
  onDelete?: (id: number) => void
}
```

**Structure**:
```tsx
export function [Resource]Card({ item, onEdit, onDelete }: [Resource]CardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{item.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{item.description}</p>
      </CardContent>
      <CardFooter>
        <Button onClick={() => onEdit?.(item.id)}>Edit</Button>
        <Button variant="destructive" onClick={() => onDelete?.(item.id)}>Delete</Button>
      </CardFooter>
    </Card>
  )
}
```

**Files**: `src/components/[resource]/[Resource]Card.tsx`

---

### `[Resource]Form.tsx`
**Purpose**: Create or edit [resource]

**Props**:
```typescript
interface [Resource]FormProps {
  item?: [Resource] // undefined for create, populated for edit
  onSuccess?: () => void
}
```

**Structure** (using React Hook Form + Zod):
```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { [resource]Schema } from '@/lib/schemas'

export function [Resource]Form({ item, onSuccess }: [Resource]FormProps) {
  const form = useForm({
    resolver: zodResolver([resource]Schema),
    defaultValues: item || {
      field1: '',
      field2: ''
    }
  })

  const mutation = useMutation({
    mutationFn: item ? update[Resource] : create[Resource],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['[resources]'] })
      onSuccess?.()
    }
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(data => mutation.mutate(data))}>
        <FormField name="field1" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Field 1</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving...' : 'Save'}
        </Button>
      </form>
    </Form>
  )
}
```

**Files**: `src/components/[resource]/[Resource]Form.tsx`

---

### `[Resource]CreateDialog.tsx`
**Purpose**: Modal dialog for creating new [resource]

**Structure**:
```tsx
export function [Resource]CreateDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create [Resource]</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New [Resource]</DialogTitle>
        </DialogHeader>
        <[Resource]Form onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
```

**Files**: `src/components/[resource]/[Resource]CreateDialog.tsx`

---

## Loading and Error States

### `[Resource]ListSkeleton.tsx`
**Purpose**: Loading state for [resource] list

**Structure**:
```tsx
export function [Resource]ListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4 mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

---

### `ErrorMessage.tsx`
**Purpose**: Reusable error display

**Props**:
```typescript
interface ErrorMessageProps {
  error: Error
  retry?: () => void
}
```

**Structure**:
```tsx
export function ErrorMessage({ error, retry }: ErrorMessageProps) {
  return (
    <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
      <h3 className="font-semibold text-destructive">Error</h3>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      {retry && (
        <Button variant="outline" onClick={retry} className="mt-2">
          Retry
        </Button>
      )}
    </div>
  )
}
```

---

## State Management Patterns

### Server State (TanStack Query)

**Use for**: Data from API (users, tasks, analytics, etc)

**Example**:
```tsx
// In component
const { data, isLoading, error } = useQuery({
  queryKey: ['tasks'],
  queryFn: () => api.get('/api/tasks').then(res => res.data)
})

// Mutation
const mutation = useMutation({
  mutationFn: (newTask) => api.post('/api/tasks', newTask),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  }
})
```

**Files**: Queries/mutations defined in `src/lib/api.ts` or component files

---

### Client State (Zustand)

**Use for**: UI state, preferences, filters

**Example Store**:
```tsx
// src/stores/ui-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIStore {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      theme: 'system',
      setTheme: (theme) => set({ theme })
    }),
    { name: 'ui-store' }
  )
)
```

**Usage**:
```tsx
const { sidebarOpen, setSidebarOpen } = useUIStore()
```

---

## Theme System

### ThemeProvider
**Purpose**: Manage dark/light/system theme

**Structure**:
```tsx
// src/components/theme-provider.tsx
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}

export function useTheme() {
  return useNextTheme()
}
```

**Files**: `src/components/theme-provider.tsx`

---

### ThemeToggle
**Purpose**: Toggle between light/dark/system themes

**Structure**:
```tsx
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

---

## Form Patterns

All forms use **React Hook Form + Zod** for validation.

**Schema Definition** (shared client + server):
```typescript
// src/lib/schemas.ts
import { z } from 'zod'

export const taskSchema = z.object({
  title: z.string().min(1, 'Title required').max(100),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium')
})

export type TaskFormData = z.infer<typeof taskSchema>
```

**Form Component**:
```tsx
const form = useForm<TaskFormData>({
  resolver: zodResolver(taskSchema),
  defaultValues: { ... }
})
```

---

## Responsive Design

**Breakpoints** (Tailwind defaults):
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

**Patterns**:
```tsx
// Stack on mobile, grid on desktop
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

// Hide on mobile, show on desktop
<div className="hidden md:block">

// Different padding on mobile vs desktop
<div className="px-4 md:px-8">
```

---

## Accessibility

**Requirements**:
- All interactive elements keyboard navigable
- Focus states visible (use `ring` classes)
- Images have alt text
- Forms have associated labels
- Color contrast meets WCAG AA
- Screen reader friendly (ARIA labels)

**shadcn/ui benefits**: All components built with Radix UI (accessible by default)

---

## File Structure

```
src/
├── components/
│   ├── ui/                    # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   └── ...
│   ├── layout/                # Layout components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Layout.tsx
│   ├── [resource]/            # Feature-specific components
│   │   ├── [Resource]List.tsx
│   │   ├── [Resource]Card.tsx
│   │   ├── [Resource]Form.tsx
│   │   └── [Resource]CreateDialog.tsx
│   ├── theme-provider.tsx
│   └── error-message.tsx
├── lib/
│   ├── schemas.ts             # Zod schemas
│   ├── api.ts                 # API client
│   └── utils.ts               # cn() helper
├── stores/
│   └── ui-store.ts            # Zustand stores
└── pages/
    ├── HomePage.tsx
    ├── DashboardPage.tsx
    └── ...
```

---

## Design Tokens

See `src/index.css` for theme configuration.

**Colors** (semantic):
- `background` / `foreground`
- `primary` / `primary-foreground`
- `secondary` / `secondary-foreground`
- `destructive` / `destructive-foreground`
- `muted` / `muted-foreground`
- `accent` / `accent-foreground`
- `border`
- `ring`

**Usage**: These adapt to light/dark mode automatically.

---

## Future Components

Components to build:
- [ ] `[Component]` - [Description]
- [ ] `[Component]` - [Description]

---

## Revision History

**v1.0** ([Date]): Initial component structure
**v1.1** ([Date]): [Changes made]
