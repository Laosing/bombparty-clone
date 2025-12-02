export function deserialize<T>(serializedJavascript: string): T {
  // eslint-disable-next-line
  return eval("(" + serializedJavascript + ")")
}
