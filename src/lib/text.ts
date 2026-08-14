/**
 * Utilitários de texto usados nos templates.
 * Extraídos para ficarem puros e testáveis (Vitest).
 */

/** Remove tags HTML e normaliza espaços. */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Gera um resumo com no máximo `words` palavras, com reticências se cortar. */
export function excerpt(html: string, words = 25): string {
  const parts = stripHtml(html).split(' ').filter(Boolean);
  return parts.slice(0, words).join(' ') + (parts.length > words ? '…' : '');
}

/** Formata "2025-09-25 20:01:16" como "25.09.2025". */
export function dateBR(d?: string): string {
  if (!d) return '';
  const [y, m, day] = d.slice(0, 10).split('-');
  if (!y || !m || !day) return '';
  return `${day}.${m}.${y}`;
}

/** Estima o tempo de leitura em minutos (mín. 1). */
export function readingTime(html: string, wordsPerMinute = 200): number {
  const words = stripHtml(html).split(' ').filter(Boolean).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}
