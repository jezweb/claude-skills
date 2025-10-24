/**
 * Zustand Store with Async Actions
 *
 * Use when:
 * - Fetching data from APIs
 * - Need loading/error states
 * - Handling async operations
 *
 * Pattern: Actions can be async, just call set() when done
 *
 * Features:
 * - Loading states
 * - Error handling
 * - Optimistic updates
 * - Request cancellation
 *
 * NOTE: For server state (data fetching), consider TanStack Query instead!
 * Zustand is better for client state. But this pattern works for simple cases.
 *
 * Learn more: See SKILL.md Common Patterns section
 */

import { create } from 'zustand'

interface User {
  id: string
  name: string
  email: string
}

interface Post {
  id: string
  title: string
  body: string
  userId: string
}

interface AsyncStore {
  // Data state
  user: User | null
  posts: Post[]

  // Loading states
  isLoadingUser: boolean
  isLoadingPosts: boolean
  isSavingPost: boolean

  // Error states
  userError: string | null
  postsError: string | null
  saveError: string | null

  // Actions
  fetchUser: (userId: string) => Promise<void>
  fetchPosts: (userId: string) => Promise<void>
  createPost: (post: Omit<Post, 'id'>) => Promise<void>
  deletePost: (postId: string) => Promise<void>
  reset: () => void
}

export const useAsyncStore = create<AsyncStore>()((set, get) => ({
  // Initial state
  user: null,
  posts: [],
  isLoadingUser: false,
  isLoadingPosts: false,
  isSavingPost: false,
  userError: null,
  postsError: null,
  saveError: null,

  // Fetch user
  fetchUser: async (userId) => {
    set({ isLoadingUser: true, userError: null })

    try {
      const response = await fetch(`https://api.example.com/users/${userId}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch user: ${response.statusText}`)
      }

      const user = await response.json()
      set({ user, isLoadingUser: false })
    } catch (error) {
      set({
        userError: (error as Error).message,
        isLoadingUser: false,
        user: null,
      })
    }
  },

  // Fetch posts
  fetchPosts: async (userId) => {
    set({ isLoadingPosts: true, postsError: null })

    try {
      const response = await fetch(`https://api.example.com/users/${userId}/posts`)

      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.statusText}`)
      }

      const posts = await response.json()
      set({ posts, isLoadingPosts: false })
    } catch (error) {
      set({
        postsError: (error as Error).message,
        isLoadingPosts: false,
      })
    }
  },

  // Create post with optimistic update
  createPost: async (post) => {
    const tempId = `temp-${Date.now()}`
    const optimisticPost = { ...post, id: tempId }

    // Optimistic update
    set((state) => ({
      posts: [...state.posts, optimisticPost],
      isSavingPost: true,
      saveError: null,
    }))

    try {
      const response = await fetch('https://api.example.com/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post),
      })

      if (!response.ok) {
        throw new Error(`Failed to create post: ${response.statusText}`)
      }

      const savedPost = await response.json()

      // Replace optimistic post with real one
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === tempId ? savedPost : p
        ),
        isSavingPost: false,
      }))
    } catch (error) {
      // Rollback optimistic update
      set((state) => ({
        posts: state.posts.filter((p) => p.id !== tempId),
        saveError: (error as Error).message,
        isSavingPost: false,
      }))
    }
  },

  // Delete post
  deletePost: async (postId) => {
    // Store original posts for rollback
    const originalPosts = get().posts

    // Optimistic update
    set((state) => ({
      posts: state.posts.filter((p) => p.id !== postId),
    }))

    try {
      const response = await fetch(`https://api.example.com/posts/${postId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`Failed to delete post: ${response.statusText}`)
      }
    } catch (error) {
      // Rollback on error
      set({
        posts: originalPosts,
        saveError: (error as Error).message,
      })
    }
  },

  // Reset
  reset: () =>
    set({
      user: null,
      posts: [],
      isLoadingUser: false,
      isLoadingPosts: false,
      isSavingPost: false,
      userError: null,
      postsError: null,
      saveError: null,
    }),
}))

/**
 * Usage in components:
 *
 * function UserProfile({ userId }: { userId: string }) {
 *   const user = useAsyncStore((state) => state.user)
 *   const isLoading = useAsyncStore((state) => state.isLoadingUser)
 *   const error = useAsyncStore((state) => state.userError)
 *   const fetchUser = useAsyncStore((state) => state.fetchUser)
 *
 *   useEffect(() => {
 *     fetchUser(userId)
 *   }, [userId, fetchUser])
 *
 *   if (isLoading) return <div>Loading...</div>
 *   if (error) return <div>Error: {error}</div>
 *   if (!user) return <div>No user found</div>
 *
 *   return (
 *     <div>
 *       <h1>{user.name}</h1>
 *       <p>{user.email}</p>
 *     </div>
 *   )
 * }
 *
 * function PostsList({ userId }: { userId: string }) {
 *   const posts = useAsyncStore((state) => state.posts)
 *   const isLoading = useAsyncStore((state) => state.isLoadingPosts)
 *   const error = useAsyncStore((state) => state.postsError)
 *   const fetchPosts = useAsyncStore((state) => state.fetchPosts)
 *   const deletePost = useAsyncStore((state) => state.deletePost)
 *
 *   useEffect(() => {
 *     fetchPosts(userId)
 *   }, [userId, fetchPosts])
 *
 *   if (isLoading) return <div>Loading posts...</div>
 *   if (error) return <div>Error: {error}</div>
 *
 *   return (
 *     <ul>
 *       {posts.map((post) => (
 *         <li key={post.id}>
 *           <h3>{post.title}</h3>
 *           <p>{post.body}</p>
 *           <button onClick={() => deletePost(post.id)}>Delete</button>
 *         </li>
 *       ))}
 *     </ul>
 *   )
 * }
 *
 * function CreatePostForm({ userId }: { userId: string }) {
 *   const [title, setTitle] = useState('')
 *   const [body, setBody] = useState('')
 *   const createPost = useAsyncStore((state) => state.createPost)
 *   const isSaving = useAsyncStore((state) => state.isSavingPost)
 *   const error = useAsyncStore((state) => state.saveError)
 *
 *   const handleSubmit = async (e: FormEvent) => {
 *     e.preventDefault()
 *     await createPost({ title, body, userId })
 *     setTitle('')
 *     setBody('')
 *   }
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <input
 *         value={title}
 *         onChange={(e) => setTitle(e.target.value)}
 *         placeholder="Title"
 *       />
 *       <textarea
 *         value={body}
 *         onChange={(e) => setBody(e.target.value)}
 *         placeholder="Body"
 *       />
 *       <button type="submit" disabled={isSaving}>
 *         {isSaving ? 'Creating...' : 'Create Post'}
 *       </button>
 *       {error && <div>Error: {error}</div>}
 *     </form>
 *   )
 * }
 *
 * ADVANCED: Request Cancellation with AbortController
 *
 * let abortController: AbortController | null = null
 *
 * fetchUserWithCancellation: async (userId) => {
 *   // Cancel previous request
 *   abortController?.abort()
 *   abortController = new AbortController()
 *
 *   set({ isLoadingUser: true, userError: null })
 *
 *   try {
 *     const response = await fetch(
 *       `https://api.example.com/users/${userId}`,
 *       { signal: abortController.signal }
 *     )
 *     // ... rest of fetch logic
 *   } catch (error) {
 *     if (error.name === 'AbortError') {
 *       // Request was cancelled
 *       return
 *     }
 *     // ... handle other errors
 *   }
 * }
 */
