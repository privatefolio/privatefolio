// import { transferHandlers } from "comlink"

// transferHandlers.set("ERROR", {
//   canHandle: (obj) => {
//     console.log("📜 LOG > obj:", obj)
//     return obj instanceof Error || (obj as any).isError === true
//   },

//   // turn plain object → Error
//   deserialize(obj: { message: string; name: string; stack?: string }) {
//     console.log("📜 LOG > deserialize > obj:", obj)
//     const e = new Error(obj.message)
//     e.name = obj.name
//     e.stack = obj.stack
//     return e
//   },

//   // turn Error → plain object
//   serialize(error: Error) {
//     console.log("📜 LOG > serialize > error:", error)
//     const { message, name, stack } = error
//     return [{ message, name, stack }, []] // no transferable
//   },
// })
