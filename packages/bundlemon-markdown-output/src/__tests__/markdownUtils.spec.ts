import { escapeMarkdown, formatText } from '../markdownUtils';

describe('markdown utils', () => {
  describe('escapeMarkdown', () => {
    test.each(['text', '**/*.<hash>.js'])('no escape', (str) => {
      const result = escapeMarkdown(str);

      expect(result).toBe(str);
    });

    test.each([
      { str: 'some~text~2', expected: 'some\\~text\\~2' },
      { str: '*.js | *.png', expected: '*.js \\| *.png' },
      { str: 'text~text | file', expected: 'text\\~text \\| file' },
    ])('escape', ({ str, expected }) => {
      const result = escapeMarkdown(str);

      expect(result).toBe(expected);
    });
  });

  describe('formatText', () => {
    test.each([
      { str: 'text', options: {}, expected: 'text' },
      { str: 'text', options: { bold: false }, expected: 'text' },
      { str: 'text', options: { bold: true }, expected: '**text**' },
    ])('options: $options', ({ str, options, expected }) => {
      const result = formatText(str, options);

      expect(result).toBe(expected);
    });
  });
});
