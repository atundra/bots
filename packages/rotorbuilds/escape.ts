const escapeHtmlChar = (c: string) => {
  switch (c.charCodeAt(0)) {
    case 34: // "
      return '&quot;';
    case 38: // &
      return '&amp;';
    case 39: // '
      return '&#39;';
    case 60: // <
      return '&lt;';
    case 62: // >
      return '&gt;';
    default:
      return c;
  }
};

export const escapeHtml = (s: string): string => s.split('').map(escapeHtmlChar).join('');
