// HTML sanitizer to keep only safe formatting tags for message bubbles
export const sanitizeMessageHtml = (html: string): string => {
  if (!html) return '';
  
  // Create a temporary div to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Function to recursively process nodes
  const processNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }
    
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();
      
      // Process child nodes
      let childContent = '';
      for (const child of Array.from(node.childNodes)) {
        childContent += processNode(child);
      }
      
      // Keep only allowed tags
      switch (tagName) {
        case 'p':
          return `<p>${childContent}</p>`;
        case 'br':
          return '<br>';
        case 'b':
        case 'strong':
          return `<strong>${childContent}</strong>`;
        case 'i':
        case 'em':
          return `<em>${childContent}</em>`;
        case 'u':
          return `<u>${childContent}</u>`;
        case 'ul':
          return `<ul>${childContent}</ul>`;
        case 'ol':
          return `<ol>${childContent}</ol>`;
        case 'li':
          return `<li>${childContent}</li>`;
        case 'a':
          const href = element.getAttribute('href');
          if (href && (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:'))) {
            return `<a href="${href}" target="_blank" rel="noopener noreferrer">${childContent}</a>`;
          }
          return childContent;
        default:
          // For all other tags, just return the content without the tag
          return childContent;
      }
    }
    
    return '';
  };
  
  // Process all child nodes
  let result = '';
  for (const child of Array.from(tempDiv.childNodes)) {
    result += processNode(child);
  }
  
  // Clean up extra whitespace and normalize line breaks
  return result
    .replace(/\s+/g, ' ')
    .replace(/\s*<br>\s*/g, '<br>')
    .replace(/\s*<\/p>\s*<p>\s*/g, '</p><p>')
    .trim();
};
