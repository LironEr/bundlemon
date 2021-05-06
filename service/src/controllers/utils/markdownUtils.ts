export function escapeMarkdown(str: string): string {
  return str.replace(/~/g, '\\~');
}

interface FormatTextOptions {
  bold?: boolean;
}

export function formatText(text: string, { bold = false }: FormatTextOptions) {
  if (bold) {
    return `**${text}**`;
  }

  return text;
}

interface Column {
  label: string;
  center?: boolean;
}

interface GenerateTableParams {
  columns: Column[];
  rows: string[][];
}

export function generateMarkdownTable({ columns, rows }: GenerateTableParams) {
  let table = '';

  table += columns
    .map((column) => column.label)
    .join(' | ')
    .concat('\n');
  table += columns
    .map((column) => (column.center ? ':------------:' : '------------'))
    .join(' | ')
    .concat('\n');
  table += rows
    .map((row) => row.join(' | '))
    .join('\n')
    .concat('\n');

  return table;
}
