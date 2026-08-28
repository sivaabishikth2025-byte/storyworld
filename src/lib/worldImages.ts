export function worldThumbnailUrl(worldId: string) {
  return `/api/world/asset?worldId=${encodeURIComponent(worldId)}&kind=thumb`
}

export function worldPanoUrl(worldId: string) {
  return `/api/world/asset?worldId=${encodeURIComponent(worldId)}&kind=pano`
}

export function withProxiedThumbnail<T extends { worldId: string; thumbnailUrl: string | null }>(world: T) {
  return {
    ...world,
    thumbnailUrl: world.worldId ? worldThumbnailUrl(world.worldId) : world.thumbnailUrl,
  }
}
