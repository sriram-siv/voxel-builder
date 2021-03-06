
export const range = bounds => {
  if (Number.isInteger(bounds))
    return Array.from({ length: bounds }, (_, i) => i)
  if (Array.isArray(bounds))
    return Array.from({ length: bounds[1] - bounds[0] }, (_, i) => i + bounds[0])
  else return null
}

/**
 * Returns an array of all integer coordinates within the square { x, y }
 * Either argument may be a 2 item array [begin inclusive, end non-inclusive] 
 * or an integer for the end where the start will be taken as 0
 */
export const matrix = (x, y) => {
  return range(x).map(i => range(y).map(j => [i, j])).flat()
}

export const mod = (value, divisor) => ((value % divisor) + divisor) % divisor