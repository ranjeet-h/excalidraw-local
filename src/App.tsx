import { StackStatus } from "@/components/stack-status"
import { Example, ExampleWrapper } from "@/components/example"

export function App() {
  return (
    <ExampleWrapper>
      <Example title="Full Stack Status" className="items-center justify-center">
        <StackStatus />
      </Example>
    </ExampleWrapper>
  )
}

export default App
