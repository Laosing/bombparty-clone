export function deserialize(serializedJavascript) {
  // eslint-disable-next-line
  return eval("(" + serializedJavascript + ")")
}
