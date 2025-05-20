export function stripAnsi(input: string): string {
  // build regex via constructor so there are no literal control chars in the pattern
  const ansiRegex = new RegExp(
    "[\\u001B\\u009B]" + // ESC or CSI
      "[\\[\\]()#;?]*" + // parameter bytes
      "(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?" + // numeric parameters
      "[0-9A-ORZcf-nqry=><~]", // final byte
    "g"
  )
  return input.replace(ansiRegex, "")
}
