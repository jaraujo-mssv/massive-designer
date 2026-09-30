import type { Example } from '@/shared/canvas/SheetSidebar';

/**
 * Example sheets listed under Import, each with Load and Open. They come from
 * the Master Spreadsheet's Market Maps tab and must stay shared as "Anyone
 * with the link can view", or Load fails.
 */
export const EXAMPLES: Example[] = [
  {
    label: 'AI Agents',
    hint: '15 categories · 88 companies',
    url: 'https://docs.google.com/spreadsheets/d/1FIKHTxeVvbE89HJ7qIrbyl4fc9TpbqvanrPitDs61Xk/edit',
  },
  {
    label: 'LLM Search Stack',
    hint: '10 categories · 44 companies',
    url: 'https://docs.google.com/spreadsheets/d/1hgMyGkGtOg6850S59g3qW-Abz7McdwdiWsZutC6pnfs/edit?usp=sharing',
  },
  {
    label: 'Browser Infra',
    hint: '7 categories · 62 companies',
    // Links to a specific tab (gid): the loader keeps it.
    url: 'https://docs.google.com/spreadsheets/d/1iY8WKP0t_bSdhIuGXK_0BROmUSHULGQV9XE0vZ9s2Fk/edit?gid=884297033#gid=884297033',
  },
  {
    label: 'YC Fall 2025',
    hint: '4 categories · 1 to 23 companies each',
    url: 'https://docs.google.com/spreadsheets/d/1k7W24PG0ymjH3TQFZoHfVn_IzZ5-_EPTAkjgC54FZq0/edit',
  },
  {
    label: 'YC Summer 2026',
    hint: '13 categories · 234 companies',
    url: 'https://docs.google.com/spreadsheets/d/19PN8sjZEkJ5IBb17eW39x6wDXLKOEUiS7I2up4J5bl0/edit?usp=sharing',
  },
];
