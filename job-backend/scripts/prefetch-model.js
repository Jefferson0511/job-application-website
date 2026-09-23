/**
 * Downloads the embedding model during `docker build` so the running container
 * never has to fetch it. Plain JS because it runs before the TypeScript build.
 *
 * A failure here is not fatal: the image still works, it just downloads the
 * model on first search instead.
 */
const cacheDir = process.env.TRANSFORMERS_CACHE_DIR;

async function main() {
  const { env, pipeline } = await import('@huggingface/transformers');

  if (cacheDir) {
    env.cacheDir = cacheDir;
  }

  const model = 'Xenova/all-MiniLM-L6-v2';
  console.log(`Prefetching ${model} into ${cacheDir ?? 'the default cache'}`);
  await pipeline('feature-extraction', model);
  console.log('Prefetch complete');
}

main().catch((error) => {
  console.warn(
    `Model prefetch failed (${error.message}); the container will download it on first use.`,
  );
});
