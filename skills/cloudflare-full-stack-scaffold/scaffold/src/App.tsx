import { BrowserRouter, Routes, Route } from 'react-router-dom'
// TODO: Use tailwind-v4-shadcn skill to add ThemeProvider
// import { ThemeProvider } from '@/components/ThemeProvider'

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Cloudflare Full-Stack App</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h2 className="text-xl mb-4">Welcome!</h2>
        <p className="text-muted-foreground">
          Scaffold is ready. Use these skills to add components and routes:
        </p>
        <ul className="list-disc pl-6 mt-4 space-y-2">
          <li>tailwind-v4-shadcn - Add UI components</li>
          <li>cloudflare-full-stack-integration - Add API routes</li>
        </ul>
      </main>
    </div>
  )
}

export default App
