// // copyright: https://github.com/thanhnguyen2187/crypta/blob/master/src/lib/sqlite/query-executor.ts

// /* eslint-disable @typescript-eslint/ban-ts-comment */
// import * as SQLite from "wa-sqlite"
// import SQLiteESMFactory from "wa-sqlite/dist/wa-sqlite-async.mjs"
// // @ts-ignore
// import { IDBBatchAtomicVFS } from "wa-sqlite/src/examples/IDBBatchAtomicVFS.js"

// export type QueryExecutor = {
//   close(): Promise<void>
//   execute(query: string, params?: SQLiteCompatibleType[]): Promise<SQLiteCompatibleType[][]>
//   executeMany(query: string, params: SQLiteCompatibleType[][]): Promise<void>
// }

// export async function createSQLiteAPI(): Promise<SQLiteAPI> {
//   const module = await SQLiteESMFactory({
//     // We set this configuration to load WASM files from `/`. More specifically,
//     // they are `wa-sqlite.wasm` and `wa-sqlite-async.wasm`. The files are
//     // copied to `static/`, and served by Vite at `/`. Without this, the
//     // application would not work in "production environment" (static file
//     // serving on GitHub Pages).
//     //
//     // Also see explanation from `wa-sqlite`'s author:
//     // https://github.com/rhashimoto/wa-sqlite/issues/15
//     locateFile(file: string) {
//       return `/sqlite/${file}`
//     },
//   })
//   const sqlite3 = SQLite.Factory(module)

//   // IDBBatchAtomicVFS uses IndexedDB
//   const vfs = await IDBBatchAtomicVFS.create("sqlite_privatefolio", module)
//   sqlite3.vfs_register(vfs, true)
//   return sqlite3
// }

// export async function createQueryExecutor(
//   sqlite3: SQLiteAPI,
//   databaseName: string
// ): Promise<QueryExecutor> {
//   const db = await sqlite3.open_v2(databaseName)

//   async function executeFn(
//     query: string,
//     params: SQLiteCompatibleType[] = []
//   ): Promise<SQLiteCompatibleType[][]> {
//     const rows: SQLiteCompatibleType[][] = []
//     for await (const stmt of sqlite3.statements(db, query)) {
//       params.forEach((param, index) => sqlite3.bind(stmt, index + 1, param))
//       while ((await sqlite3.step(stmt)) === SQLite.SQLITE_ROW) {
//         rows.push(sqlite3.row(stmt))
//       }
//     }
//     return rows
//   }

//   async function executeManyFn(query: string, params: SQLiteCompatibleType[][]): Promise<void> {
//     // await sqlite3.exec(db, "BEGIN TRANSACTION")
//     // eslint-disable-next-line no-useless-catch
//     try {
//       for await (const stmt of sqlite3.statements(db, query)) {
//         try {
//           for (const paramSet of params) {
//             paramSet.forEach((param, index) => sqlite3.bind(stmt, index + 1, param))
//             await sqlite3.step(stmt)
//             await sqlite3.reset(stmt)
//           }
//         } finally {
//           await sqlite3.finalize(stmt)
//         }
//       }
//       // await sqlite3.exec(db, "COMMIT")
//     } catch (error) {
//       // await sqlite3.exec(db, "ROLLBACK")
//       throw error
//     }
//   }

//   return {
//     async close() {
//       await sqlite3.close(db)
//     },
//     async execute(
//       query: string,
//       params?: SQLiteCompatibleType[]
//     ): Promise<SQLiteCompatibleType[][]> {
//       // We split to an `executeFn` and use Web Locks API since `wa-sqlite`
//       // doesn't allow concurrent usage of `SQLiteESMFactory`.
//       //
//       // Also see this issue: https://github.com/rhashimoto/wa-sqlite/issues/139
//       return navigator.locks.request("query_executor", (_lock) => executeFn(query, params))
//     },
//     async executeMany(query: string, params: SQLiteCompatibleType[][]): Promise<void> {
//       return navigator.locks.request("query_executor", (_lock) => executeManyFn(query, params))
//     },
//   }
// }
