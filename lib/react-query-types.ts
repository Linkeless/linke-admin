// ==================== React Query 类型定义 ====================
// 为React Query集成提供完整的TypeScript类型支持

import { StandardResponse, PaginatedResponse, ApiError } from './types'

// ==================== 基础查询类型 ====================

// 查询状态枚举
export type QueryStatus = 'pending' | 'error' | 'success'

// 查询获取状态枚举
export type FetchStatus = 'fetching' | 'paused' | 'idle'

// ==================== 查询结果类型 ====================

// 基础查询结果接口
export interface QueryResult<TData = unknown, TError = Error> {
  data: TData | undefined
  error: TError | null
  status: QueryStatus
  fetchStatus: FetchStatus
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  isPending: boolean
  isFetching: boolean
  isStale: boolean
  dataUpdatedAt: number
  errorUpdatedAt: number
  refetch: () => Promise<QueryResult<TData, TError>>
  remove: () => void
}

// 无限查询结果接口
export interface InfiniteQueryResult<TData = unknown, TError = Error> 
  extends Omit<QueryResult<InfiniteData<TData>, TError>, 'data' | 'refetch'> {
  data: InfiniteData<TData> | undefined
  fetchNextPage: () => Promise<InfiniteQueryResult<TData, TError>>
  fetchPreviousPage: () => Promise<InfiniteQueryResult<TData, TError>>
  hasNextPage: boolean
  hasPreviousPage: boolean
  isFetchingNextPage: boolean
  isFetchingPreviousPage: boolean
  refetch: () => Promise<InfiniteQueryResult<TData, TError>>
}

// 无限查询数据结构
export interface InfiniteData<TData = unknown> {
  pages: TData[]
  pageParams: unknown[]
}

// ==================== 变更结果类型 ====================

// 变更状态枚举
export type MutationStatus = 'idle' | 'pending' | 'error' | 'success'

// 变更结果接口
export interface MutationResult<TData = unknown, TError = Error, TVariables = unknown> {
  data: TData | undefined
  error: TError | null
  status: MutationStatus
  isIdle: boolean
  isPending: boolean
  isError: boolean
  isSuccess: boolean
  submittedAt: number
  mutate: (variables: TVariables) => void
  mutateAsync: (variables: TVariables) => Promise<TData>
  reset: () => void
  variables: TVariables | undefined
}

// ==================== API 响应适配类型 ====================

// 标准响应查询结果
export interface StandardQueryResult<TData = unknown> 
  extends QueryResult<StandardResponse<TData>, ApiError> {
  data: StandardResponse<TData> | undefined
}

// 分页响应查询结果
export interface PaginatedQueryResult<TData = unknown> 
  extends QueryResult<PaginatedResponse<TData>, ApiError> {
  data: PaginatedResponse<TData> | undefined
}

// 标准响应变更结果
export interface StandardMutationResult<TData = unknown, TVariables = unknown> 
  extends MutationResult<StandardResponse<TData>, ApiError, TVariables> {
  data: StandardResponse<TData> | undefined
}

// ==================== 查询配置类型 ====================

// 查询选项基础接口
export interface QueryOptions<TData = unknown, TError = Error> {
  enabled?: boolean
  retry?: boolean | number | ((failureCount: number, error: TError) => boolean)
  retryDelay?: number | ((retryAttempt: number, error: TError) => number)
  staleTime?: number
  cacheTime?: number
  refetchOnMount?: boolean | 'always'
  refetchOnWindowFocus?: boolean | 'always'
  refetchOnReconnect?: boolean | 'always'
  refetchInterval?: number | false
  refetchIntervalInBackground?: boolean
  suspense?: boolean
  select?: (data: TData) => unknown
  onSuccess?: (data: TData) => void
  onError?: (error: TError) => void
  onSettled?: (data: TData | undefined, error: TError | null) => void
}

// 变更选项接口
export interface MutationOptions<TData = unknown, TError = Error, TVariables = unknown> {
  onMutate?: (variables: TVariables) => Promise<unknown> | unknown
  onSuccess?: (data: TData, variables: TVariables, context: unknown) => Promise<unknown> | unknown
  onError?: (error: TError, variables: TVariables, context: unknown) => Promise<unknown> | unknown
  onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables, context: unknown) => Promise<unknown> | unknown
  retry?: boolean | number | ((failureCount: number, error: TError) => boolean)
  retryDelay?: number | ((retryAttempt: number, error: TError) => number)
}

// ==================== 查询键类型 ====================

// 查询键类型
export type QueryKey = ReadonlyArray<unknown>

// 查询键工厂类型
export interface QueryKeyFactory {
  all: QueryKey
  lists: () => QueryKey
  list: (filters?: Record<string, unknown>) => QueryKey
  details: () => QueryKey
  detail: (id: string | number) => QueryKey
}

// ==================== 缓存更新类型 ====================

// 查询缓存接口
export interface QueryCache {
  find: <TData = unknown>(queryKey: QueryKey) => QueryResult<TData> | undefined
  findAll: <TData = unknown>(filters?: QueryKey) => QueryResult<TData>[]
  remove: (queryKey: QueryKey) => void
  clear: () => void
}

// 乐观更新上下文
export interface OptimisticUpdateContext<TData = unknown> {
  previousData?: TData
  optimisticData: TData
}

// ==================== Hook 参数类型 ====================

// 查询 Hook 参数
export interface UseQueryParams<TData = unknown, TError = Error> {
  queryKey: QueryKey
  queryFn: () => Promise<TData>
  options?: QueryOptions<TData, TError>
}

// 变更 Hook 参数
export interface UseMutationParams<TData = unknown, TError = Error, TVariables = unknown> {
  mutationFn: (variables: TVariables) => Promise<TData>
  options?: MutationOptions<TData, TError, TVariables>
}

// 无限查询 Hook 参数
export interface UseInfiniteQueryParams<TData = unknown, TError = Error> {
  queryKey: QueryKey
  queryFn: (context: { pageParam: unknown }) => Promise<TData>
  getNextPageParam?: (lastPage: TData, allPages: TData[]) => unknown
  getPreviousPageParam?: (firstPage: TData, allPages: TData[]) => unknown
  options?: QueryOptions<InfiniteData<TData>, TError>
}

// ==================== 业务特定查询类型 ====================

// 列表查询参数
export interface ListQueryParams {
  page?: number
  limit?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  search?: string
  filters?: Record<string, unknown>
}

// 详情查询参数
export interface DetailQueryParams {
  id: string | number
  include?: string[]
}

// ==================== 错误处理类型 ====================

// 查询错误信息
export interface QueryError extends ApiError {
  queryKey: QueryKey
  retryCount: number
}

// 变更错误信息
export interface MutationError extends ApiError {
  variables?: unknown
}

// ==================== 工厂函数类型 ====================

// 查询工厂函数类型
export type QueryFactory<TData = unknown, TParams = unknown> = (
  params: TParams
) => UseQueryParams<TData, QueryError>

// 变更工厂函数类型
export type MutationFactory<TData = unknown, TVariables = unknown> = (
  options?: MutationOptions<TData, MutationError, TVariables>
) => UseMutationParams<TData, MutationError, TVariables>

// ==================== 全局配置类型 ====================

// React Query 客户端配置
export interface QueryClientConfig {
  defaultOptions?: {
    queries?: QueryOptions
    mutations?: MutationOptions
  }
  queryCache?: QueryCache
  mutationCache?: unknown
}

// 查询客户端实例接口
export interface QueryClient {
  getQueryData: <TData = unknown>(queryKey: QueryKey) => TData | undefined
  setQueryData: <TData = unknown>(queryKey: QueryKey, data: TData) => void
  invalidateQueries: (queryKey?: QueryKey) => Promise<void>
  refetchQueries: (queryKey?: QueryKey) => Promise<void>
  removeQueries: (queryKey?: QueryKey) => void
  clear: () => void
}

// ==================== 实用工具类型 ====================

// 提取查询数据类型
export type ExtractQueryData<T> = T extends QueryResult<infer U> ? U : never

// 提取变更数据类型  
export type ExtractMutationData<T> = T extends MutationResult<infer U> ? U : never

// 提取查询变量类型
export type ExtractQueryVariables<T> = T extends UseQueryParams<unknown, unknown> 
  ? Parameters<T['queryFn']>[0] 
  : never

// 提取变更变量类型
export type ExtractMutationVariables<T> = T extends MutationResult<unknown, unknown, infer U> ? U : never

// ==================== 类型导出别名 ====================

// 常用别名
export type Query<TData = unknown> = QueryResult<TData, QueryError>
export type Mutation<TData = unknown, TVariables = unknown> = MutationResult<TData, MutationError, TVariables>
export type InfiniteQuery<TData = unknown> = InfiniteQueryResult<TData, QueryError>

// API 响应别名
export type ApiQuery<TData = unknown> = StandardQueryResult<TData>
export type ApiPaginatedQuery<TData = unknown> = PaginatedQueryResult<TData>
export type ApiMutation<TData = unknown, TVariables = unknown> = StandardMutationResult<TData, TVariables>