import { ThemeProvider } from "next-themes"

import { Toaster } from "@/components/ui/sonner"
import { WorkspaceShell } from "@/features/workspace"

export function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <WorkspaceShell />
      <Toaster position="top-center" />
    </ThemeProvider>
  )
}

export default App
