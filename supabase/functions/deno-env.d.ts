// Solo para revisar los tipos con tsc (npm run typecheck): en Supabase, Deno trae los suyos.
declare namespace Deno {
  const env: { get(key: string): string | undefined }
}
