import SuperJSON from "superjson"

export function deserialize<T>(value: unknown): T {
  return SuperJSON.deserialize(value as any) as T
}
