const cache = new Map<string, any>()

const TTL = 30000

export function getProjection(key: string) {
  const item = cache.get(key)

  if (!item) return null

  if (Date.now() - item.ts > TTL) {
    cache.delete(key)
    return null
  }

  return item.data
}

export function setProjection(key: string, data: any) {
  cache.set(key, {
    data,
    ts: Date.now()
  })
}

export function invalidateProjection(key: string) {
  cache.delete(key)
}
