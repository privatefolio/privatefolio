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
export function memoize<T extends (...args: any[]) => any>(func: T): T {
  const cache: Record<string, ReturnType<T>> = {}
  return function memoized(...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args)
    if (key in cache) return cache[key]
    return (cache[key] = func(...args))
  } as T
}

/**
 * Functional programming utils,
 * cc: https://gist.github.com/BretCameron/0630bbdc332ed128de6c702efea47ccc
 */

/** Runs the given function with the supplied object, then returns the object.
 * @function tap
 * @param {Function} f
 * @returns {*}
 */
export const tap = (f) => (x) => {
  f(x)
  return x
}

/**
 * Performs left-to-right composition, combining multiple functions into a single function. Sometimes called `sequence`. Right-to-left composition is typically known as `compose`.
 * @function pipe
 * @param {...Function} args
 * @returns {Function}
 */
export const pipe =
  (...fns) =>
  (x) =>
    fns.reduce((output, fn) => fn(output), x)

/** Logs the given label and a provided object to the console, the returns the object.
 * @function trace
 * @param {String} label
 * @returns {Function}
 */
export const trace = (label) => tap(console.log.bind(console, label + ":" || ""))
