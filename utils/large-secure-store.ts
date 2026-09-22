import * as SecureStore from 'expo-secure-store'

// SecureStore has a hard ~2048 byte limit per value on some platforms.
// Supabase session tokens (JWT + refresh token + metadata) often exceed this.
// This adapter transparently splits large values across multiple keys and
// reassembles them on read, so it's a drop-in replacement for the
// storage option in createClient().

const CHUNK_SIZE = 2000 // stay safely under the 2048 byte limit
const CHUNK_COUNT_SUFFIX = '_chunks'

async function getChunkCount(key: string): Promise<number | null> {
  const value = await SecureStore.getItemAsync(key + CHUNK_COUNT_SUFFIX)
  if (!value) return null
  const count = parseInt(value, 10)
  return Number.isNaN(count) ? null : count
}

async function removeAllChunks(key: string, chunkCount: number) {
  const deletions = []
  for (let i = 0; i < chunkCount; i++) {
    deletions.push(SecureStore.deleteItemAsync(`${key}_${i}`))
  }
  deletions.push(SecureStore.deleteItemAsync(key + CHUNK_COUNT_SUFFIX))
  await Promise.all(deletions)
}

export const LargeSecureStore = {
  async getItem(key: string): Promise<string | null> {
    // Check if this key was stored in chunks
    const chunkCount = await getChunkCount(key)

    if (chunkCount !== null) {
      // Reassemble chunks in order
      const chunks: string[] = []
      for (let i = 0; i < chunkCount; i++) {
        const chunk = await SecureStore.getItemAsync(`${key}_${i}`)
        if (chunk === null) {
          // A chunk went missing (corrupted/partial write) — treat as no session
          // rather than returning a broken partial value.
          return null
        }
        chunks.push(chunk)
      }
      return chunks.join('')
    }

    // Not chunked — try the plain single key
    return SecureStore.getItemAsync(key)
  },

  async setItem(key: string, value: string): Promise<void> {
    // Clean up any previous chunked data under this key before writing new data,
    // in case the new value no longer needs chunking (or needs a different count).
    const existingChunkCount = await getChunkCount(key)
    if (existingChunkCount !== null) {
      await removeAllChunks(key, existingChunkCount)
    }

    if (value.length <= CHUNK_SIZE) {
      // Small enough — store directly, no chunking needed
      await SecureStore.setItemAsync(key, value)
      return
    }

    // Remove any stale single-key value before switching to chunked storage
    await SecureStore.deleteItemAsync(key)

    const chunkCount = Math.ceil(value.length / CHUNK_SIZE)
    const writes = []
    for (let i = 0; i < chunkCount; i++) {
      const chunk = value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
      writes.push(SecureStore.setItemAsync(`${key}_${i}`, chunk))
    }
    writes.push(SecureStore.setItemAsync(key + CHUNK_COUNT_SUFFIX, String(chunkCount)))

    await Promise.all(writes)
  },

  async removeItem(key: string): Promise<void> {
    const chunkCount = await getChunkCount(key)
    if (chunkCount !== null) {
      await removeAllChunks(key, chunkCount)
    }
    // Also remove a plain single-key value if it exists
    await SecureStore.deleteItemAsync(key)
  },
}