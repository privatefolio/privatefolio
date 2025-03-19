import { CustomData } from "lightweight-charts"

/**
 * StackedArea Series Data
 */
export interface StackedAreaData extends CustomData {
  assets: string[]
  values: number[]
}
