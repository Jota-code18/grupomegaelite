import { describe, expect, it } from 'vitest';
import { dateBR, excerpt, readingTime, stripHtml } from './text';

describe('stripHtml', () => {
  it('remove tags e normaliza espaços', () => {
    expect(stripHtml('<p>Olá  <b>mundo</b></p>')).toBe('Olá mundo');
  });
  it('lida com string vazia', () => {
    expect(stripHtml('')).toBe('');
  });
});

describe('excerpt', () => {
  it('corta no número de palavras e adiciona reticências', () => {
    expect(excerpt('<p>um dois três quatro cinco</p>', 2)).toBe('um dois…');
  });
  it('não adiciona reticências quando o texto já é curto', () => {
    expect(excerpt('<p>um dois</p>', 5)).toBe('um dois');
  });
});

describe('dateBR', () => {
  it('formata data do WordPress para pt-BR', () => {
    expect(dateBR('2025-09-25 20:01:16')).toBe('25.09.2025');
  });
  it('retorna vazio para undefined', () => {
    expect(dateBR()).toBe('');
  });
  it('retorna vazio para entrada inválida', () => {
    expect(dateBR('sem-data')).toBe('');
  });
});

describe('readingTime', () => {
  it('é no mínimo 1 minuto', () => {
    expect(readingTime('<p>texto curto</p>')).toBe(1);
  });
  it('escala com a quantidade de palavras', () => {
    const html = `<p>${'palavra '.repeat(400)}</p>`;
    expect(readingTime(html)).toBe(2);
  });
});
