import { exec } from "child_process"

// Function to kill the process running on the port
export function killProcessOnPort(port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(`lsof -i :${port} -t`, (err, stdout) => {
      if (err) {
        console.log("No lingering process found.")
        return resolve() // Resolve the promise even if no process is found
      }

      const pid = stdout.trim() // Get the process ID
      if (pid) {
        console.log("Killing lingering process with PID:", pid)
        exec(`kill -9 ${pid}`, (err) => {
          if (err) {
            console.error(`Error killing process ${pid}: ${err.message}`)
            return reject(err) // Reject the promise if there's an error
          }
          console.log(`Killed lingering process with PID: ${pid}`)
          resolve() // Resolve the promise when the process is killed
        })
      } else {
        console.log(`No process found on port ${port}`)
        resolve() // No process to kill, resolve the promise
      }
    })
  })
}

if (process.env.KILL_PORT) {
  await killProcessOnPort(Number(process.env.KILL_PORT))
}
