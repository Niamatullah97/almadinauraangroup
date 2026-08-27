import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import staticAssetsIncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache';

// No R2/KV — free Workers-only deploy (no paid storage).
// Build-time pages are served from Workers Static Assets.
// Cache interception must stay off without a real queue (R2/DO); otherwise
// the dummy queue's send() throws in routingHandler → permanent 500s.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  enableCacheInterception: false,
});
