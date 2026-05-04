/**
 * 与 JRedmine 后端 ApiResponse 对齐
 * @see jredmine-fronted/docs/api-contract.md
 */
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
  timestamp: string
  success: boolean
}

/**
 * 与 JRedmine 后端 PageResponse 对齐
 */
export interface PageResponse<T> {
  records: T[]
  total: number
  current: number
  size: number
  pages: number
}
