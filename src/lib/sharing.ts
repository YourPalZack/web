export function serializeBuildState(components: unknown) {
  try { return encodeURIComponent(Buffer.from(JSON.stringify(components)).toString('base64')); } catch { return ''; }
}

export function deserializeBuildState(s: string){
  try { return JSON.parse(Buffer.from(decodeURIComponent(s), 'base64').toString('utf8')); } catch { return null; }
}

