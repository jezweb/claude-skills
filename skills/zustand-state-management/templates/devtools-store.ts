/**
 * Zustand Store with Redux DevTools Integration
 *
 * Use when:
 * - Need debugging capabilities
 * - Want to track state changes
 * - Inspecting actions and state history
 * - Time-travel debugging (with Redux DevTools Extension)
 *
 * Setup:
 * 1. Install Redux DevTools Extension in browser
 * 2. Use this template
 * 3. Open DevTools → Redux tab
 *
 * Learn more: See SKILL.md for combining with other middleware
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface Todo {
  id: string
  text: string
  done: boolean
}

interface DevtoolsStore {
  // State
  todos: Todo[]
  filter: 'all' | 'active' | 'completed'

  // Actions
  addTodo: (text: string) => void
  toggleTodo: (id: string) => void
  deleteTodo: (id: string) => void
  setFilter: (filter: DevtoolsStore['filter']) => void
  clearCompleted: () => void
}

export const useDevtoolsStore = create<DevtoolsStore>()(
  devtools(
    (set) => ({
      // Initial state
      todos: [],
      filter: 'all',

      // Actions with named actions for DevTools
      addTodo: (text) =>
        set(
          (state) => ({
            todos: [
              ...state.todos,
              { id: Date.now().toString(), text, done: false },
            ],
          }),
          undefined,
          'todos/add', // Action name in DevTools
        ),

      toggleTodo: (id) =>
        set(
          (state) => ({
            todos: state.todos.map((todo) =>
              todo.id === id ? { ...todo, done: !todo.done } : todo
            ),
          }),
          undefined,
          'todos/toggle',
        ),

      deleteTodo: (id) =>
        set(
          (state) => ({
            todos: state.todos.filter((todo) => todo.id !== id),
          }),
          undefined,
          'todos/delete',
        ),

      setFilter: (filter) =>
        set(
          { filter },
          undefined,
          'filter/set',
        ),

      clearCompleted: () =>
        set(
          (state) => ({
            todos: state.todos.filter((todo) => !todo.done),
          }),
          undefined,
          'todos/clearCompleted',
        ),
    }),
    {
      name: 'TodoStore', // Store name in DevTools
      enabled: process.env.NODE_ENV === 'development', // Optional: only in dev
    },
  ),
)

/**
 * Usage in component:
 *
 * function TodoList() {
 *   const todos = useDevtoolsStore((state) => state.todos)
 *   const filter = useDevtoolsStore((state) => state.filter)
 *   const toggleTodo = useDevtoolsStore((state) => state.toggleTodo)
 *   const deleteTodo = useDevtoolsStore((state) => state.deleteTodo)
 *
 *   const filteredTodos = todos.filter((todo) => {
 *     if (filter === 'active') return !todo.done
 *     if (filter === 'completed') return todo.done
 *     return true
 *   })
 *
 *   return (
 *     <ul>
 *       {filteredTodos.map((todo) => (
 *         <li key={todo.id}>
 *           <input
 *             type="checkbox"
 *             checked={todo.done}
 *             onChange={() => toggleTodo(todo.id)}
 *           />
 *           <span>{todo.text}</span>
 *           <button onClick={() => deleteTodo(todo.id)}>Delete</button>
 *         </li>
 *       ))}
 *     </ul>
 *   )
 * }
 *
 * DevTools Features:
 * - See all actions in order
 * - Inspect state before/after each action
 * - Time-travel through state changes
 * - Export/import state for debugging
 * - Track which components caused updates
 */
