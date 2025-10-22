/**
 * Hono RPC Client
 *
 * Type-safe client for consuming Hono APIs with full type inference.
 */

import { hc } from 'hono/client'
import type { AppType, PostsType, SearchType } from './rpc-pattern'

// ============================================================================
// BASIC CLIENT SETUP
// ============================================================================

// Create client with full type inference
const client = hc<AppType>('http://localhost:8787')

// ============================================================================
// TYPE-SAFE API CALLS
// ============================================================================

async function exampleUsage() {
  // GET /users
  const usersRes = await client.users.$get()
  const usersData = await usersRes.json()
  // Type: { users: Array<{ id: string, name: string, email: string }> }

  console.log('Users:', usersData.users)

  // POST /users
  const createRes = await client.users.$post({
    json: {
      name: 'Charlie',
      email: 'charlie@example.com',
      age: 25,
    },
  })

  if (!createRes.ok) {
    console.error('Failed to create user:', createRes.status)
    return
  }

  const createData = await createRes.json()
  // Type: { success: boolean, user: { id: string, name: string, email: string, age?: number } }

  console.log('Created user:', createData.user)

  // GET /users/:id
  const userRes = await client.users[':id'].$get({
    param: { id: createData.user.id },
  })

  const userData = await userRes.json()
  // Type: { id: string, name: string, email: string }

  console.log('User:', userData)

  // PATCH /users/:id
  const updateRes = await client.users[':id'].$patch({
    param: { id: userData.id },
    json: {
      name: 'Charlie Updated',
    },
  })

  const updateData = await updateRes.json()
  console.log('Updated user:', updateData)

  // DELETE /users/:id
  const deleteRes = await client.users[':id'].$delete({
    param: { id: userData.id },
  })

  const deleteData = await deleteRes.json()
  console.log('Deleted user:', deleteData)
}

// ============================================================================
// QUERY PARAMETERS
// ============================================================================

const searchClient = hc<SearchType>('http://localhost:8787')

async function searchExample() {
  const res = await searchClient.search.$get({
    query: {
      q: 'hello',
      page: '2', // Converted to number by schema
    },
  })

  const data = await res.json()
  // Type: { query: string, page: number, results: any[] }

  console.log('Search results:', data)
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

async function errorHandlingExample() {
  try {
    const res = await client.users.$post({
      json: {
        name: '',
        email: 'invalid-email',
      },
    })

    if (!res.ok) {
      // Handle validation error (400)
      if (res.status === 400) {
        const error = await res.json()
        console.error('Validation error:', error)
        return
      }

      // Handle other errors
      console.error('Request failed:', res.status, res.statusText)
      return
    }

    const data = await res.json()
    console.log('Success:', data)
  } catch (error) {
    console.error('Network error:', error)
  }
}

// ============================================================================
// CUSTOM HEADERS
// ============================================================================

async function authExample() {
  const authedClient = hc<AppType>('http://localhost:8787', {
    headers: {
      Authorization: 'Bearer secret-token',
      'X-API-Version': '1.0',
    },
  })

  const res = await authedClient.users.$get()
  const data = await res.json()

  console.log('Authed response:', data)
}

// ============================================================================
// FETCH OPTIONS
// ============================================================================

async function fetchOptionsExample() {
  const res = await client.users.$get({}, {
    // Standard fetch options
    headers: {
      'X-Custom-Header': 'value',
    },
    signal: AbortSignal.timeout(5000), // 5 second timeout
  })

  const data = await res.json()
  console.log('Data:', data)
}

// ============================================================================
// GROUPED ROUTES CLIENT
// ============================================================================

const postsClient = hc<PostsType>('http://localhost:8787/posts')

async function postsExample() {
  // GET /posts
  const postsRes = await postsClient.index.$get()
  const posts = await postsRes.json()

  console.log('Posts:', posts)

  // POST /posts
  const createRes = await postsClient.index.$post({
    json: {
      title: 'My Post',
      content: 'Post content here',
    },
  })

  const newPost = await createRes.json()
  console.log('Created post:', newPost)
}

// ============================================================================
// FRONTEND USAGE (REACT EXAMPLE)
// ============================================================================

import { useState, useEffect } from 'react'

function UsersComponent() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true)

      try {
        const res = await client.users.$get()
        const data = await res.json()
        setUsers(data.users)
      } catch (error) {
        console.error('Failed to fetch users:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  async function createUser(name: string, email: string) {
    try {
      const res = await client.users.$post({
        json: { name, email },
      })

      if (!res.ok) {
        alert('Failed to create user')
        return
      }

      const data = await res.json()
      setUsers([...users, data.user])
    } catch (error) {
      console.error('Failed to create user:', error)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <h1>Users</h1>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.name} ({user.email})
          </li>
        ))}
      </ul>
    </div>
  )
}

// ============================================================================
// EXPORT
// ============================================================================

export {
  client,
  searchClient,
  postsClient,
  exampleUsage,
  searchExample,
  errorHandlingExample,
  authExample,
  fetchOptionsExample,
  postsExample,
  UsersComponent,
}
