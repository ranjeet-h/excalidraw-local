import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getApiUsersOptions,
  postApiUsersMutation,
  deleteApiUsersByIdMutation,
} from "@/api/generated/@tanstack/react-query.gen"
import { apiClient } from "@/api/heyApiRuntime"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Separator } from "@/components/ui/separator"
import {
  IconServer,
  IconDatabase,
  IconUserPlus,
  IconTrash,
  IconRefresh,
} from "@tabler/icons-react"

function useHealthCheck() {
  return useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const { data } = await apiClient.get<{
        status: string
        timestamp: string
        uptime: number
        environment: string
      }>("/health")
      return data
    },
    refetchInterval: 10000,
  })
}

export function StackStatus() {
  const queryClient = useQueryClient()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")

  const health = useHealthCheck()
  const users = useQuery(getApiUsersOptions())

  const createUser = useMutation({
    ...postApiUsersMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [{ _id: "getApiUsers" }] })
      setName("")
      setEmail("")
    },
  })

  const deleteUser = useMutation({
    ...deleteApiUsersByIdMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [{ _id: "getApiUsers" }] })
    },
  })

  const backendOk = health.isSuccess && health.data?.status === "OK"
  const mongoOk = backendOk && !health.isError
  const userList = users.data?.data?.users ?? []

  return (
    <div className="flex flex-col gap-6 w-full max-w-lg">
      {/* Status Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <IconServer className="size-4" />
              Backend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={backendOk ? "default" : "destructive"}>
              {health.isLoading
                ? "Checking..."
                : backendOk
                  ? "Connected"
                  : "Offline"}
            </Badge>
            {health.data && (
              <p className="text-muted-foreground mt-2 text-xs">
                Uptime: {Math.floor(health.data.uptime)}s
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <IconDatabase className="size-4" />
              MongoDB
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={mongoOk && users.isSuccess ? "default" : users.isLoading ? "secondary" : "destructive"}>
              {users.isLoading
                ? "Checking..."
                : users.isSuccess
                  ? "Connected"
                  : "Offline"}
            </Badge>
            {users.data?.data && (
              <p className="text-muted-foreground mt-2 text-xs">
                {users.data.data.total ?? 0} users stored
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create User Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconUserPlus className="size-5" />
            Create User
          </CardTitle>
          <CardDescription>
            Add a user to verify MongoDB write operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!name || !email) return
              createUser.mutate({
                body: { name, email, password: "test123456" },
              })
            }}
          >
            <FieldGroup>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="user-name">Name</FieldLabel>
                  <Input
                    id="user-name"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="user-email">Email</FieldLabel>
                  <Input
                    id="user-email"
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Field>
              </div>
              <Button type="submit" disabled={createUser.isPending}>
                {createUser.isPending ? "Creating..." : "Create User"}
              </Button>
              {createUser.isError && (
                <p className="text-destructive text-sm">
                  {createUser.error?.message ?? "Failed to create user"}
                </p>
              )}
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Users from MongoDB</CardTitle>
          <CardDescription>
            {users.isLoading
              ? "Loading..."
              : `${userList.length} user(s) found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userList.length === 0 && !users.isLoading && (
            <p className="text-muted-foreground text-sm">
              No users yet. Create one above to test the full stack.
            </p>
          )}
          <div className="flex flex-col gap-2">
            {userList.map((user, i) => (
              <div key={user._id ?? i}>
                {i > 0 && <Separator className="mb-2" />}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {user.email}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (user._id) {
                        deleteUser.mutate({ path: { id: user._id } })
                      }
                    }}
                    disabled={deleteUser.isPending}
                  >
                    <IconTrash className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              queryClient.invalidateQueries({
                queryKey: [{ _id: "getApiUsers" }],
              })
            }
          >
            <IconRefresh className="size-4" data-icon="inline-start" />
            Refresh
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
