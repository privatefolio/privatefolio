/**
 * @summary
 * High-order function that memoizes a function, by creating a scope
 * to store the result of each function call, returning the cached
 * result when the same inputs is given.
 *
 * @description
 * Memoization is an optimization technique used primarily to speed up
 * functions by storing the results of expensive function calls, and returning
 * the cached result when the same inputs occur again.
 *
 * Each time a memoized function is called, its parameters are used as keys to index the cache.
 * If the index (key) is present, then it can be returned, without executing the entire function.
 * If the index is not cached, then all the body of the function is executed, and the result is
 * added to the cache.
 *
 * cc: https://gist.github.com/jherax/a3208b5c3d342a756008444ad81d8045
 * @see https://www.sitepoint.com/implementing-memoization-in-javascript/
 *
 * @export
 * @param {Function} func: function to memoize
 * @returns {Function}
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function memoize<T extends (...args: any[]) => any>(func: T): T {
  const cache: Record<string, ReturnType<T>> = {}
  return function memoized(...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args)
    if (key in cache) return cache[key]
    return (cache[key] = func(...args))
  } as T
}
