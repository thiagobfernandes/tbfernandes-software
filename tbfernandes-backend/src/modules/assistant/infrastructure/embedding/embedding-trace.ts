export function embeddingTraceInput(name: string, texts: string[]): unknown {
  if (name === 'embed-query') return texts[0];
  return {
    texts: texts.length,
    characters: texts.reduce((total, text) => total + text.length, 0),
  };
}
