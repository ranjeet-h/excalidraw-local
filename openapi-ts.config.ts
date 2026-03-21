import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "http://localhost:3001/openapi.json",
  output: "src/api/generated",
  plugins: [
    {
      name: "@hey-api/typescript",
      exportFromIndex: true,
    },
    {
      name: "@tanstack/react-query",
      queryKeys: true,
      queryOptions: true,
      mutationOptions: true,
      infiniteQueryOptions: false,
      infiniteQueryKeys: false,
      exportFromIndex: true,
    },
    {
      name: "@hey-api/client-axios",
      runtimeConfigPath: "../heyApiRuntime.ts",
    },
  ],
});
