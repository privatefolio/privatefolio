import { CsvData } from "src/interfaces"

export function extractColumnsFromRow(row: string, colNumber?: number): string[] {
  // A regex that matches content inside quotes or non-comma/non-semicolon characters,
  // accounting for commas or semicolons within quotes
  let columns: string[] = row.match(/(".*?"|[^",;]+)(?=\s*[;,]|\s*$)/g) || []

  if (typeof colNumber === "number" && columns.length !== colNumber) {
    columns = row.split(";")
  }

  // Remove quotes and handle escaped quotes
  columns = columns.map((column) => {
    if (column.startsWith('"') && column.endsWith('"')) {
      // Remove surrounding quotes and replace escaped quotes ("" -> ")
      column = column.slice(1, -1).replace(/""/g, '"')
    }

    // Remove escaped commas (\, -> ,)
    column = column.replace(/\\,/g, ",")
    return column
  })

  if (typeof colNumber === "number" && columns.length !== colNumber) {
    // console.log("Invalid number of columns:", columns.length, colNumber, ", columns:", columns)
    throw new Error(`Invalid number of columns: expected ${colNumber}, received ${columns.length}`)
  }

  return columns
}

export function splitRows(text: string): string[] {
  // OLD version which is slow
  // return text.trim().split(/\r?\n(?=(?:[^"]*"[^"]*")*[^"]*$)/)

  const rows = []
  let currentRow = ""
  let insideQuotes = false
  let i = 0

  while (i < text.length) {
    const char = text[i]
    const nextChar = text[i + 1]

    if (char === '"') {
      insideQuotes = !insideQuotes
    }

    if (!insideQuotes && char === "\n") {
      rows.push(currentRow)
      currentRow = ""
    } else if (!insideQuotes && char === "\r" && nextChar === "\n") {
      rows.push(currentRow)
      currentRow = ""
      i++ // Skip the '\n' in '\r\n'
    } else {
      currentRow += char
    }

    i++
  }

  if (currentRow) {
    rows.push(currentRow)
  }

  return rows
}

export function createCsvString(data: CsvData, delimiter = ",") {
  return data
    .map((row) =>
      row
        .map((value) => {
          let stringified: string

          if (value === null) stringified = ""
          else if (value === undefined) stringified = ""
          else if (typeof value === "object") stringified = JSON.stringify(value)
          else stringified = String(value)

          stringified = stringified.replace(/"/g, '""') // Escape double quotes
          stringified = stringified.replace(/,/g, "\\,") // Escape commas
          return `"${stringified}"`
        })
        .join(delimiter)
    )
    .join("\n")
}
