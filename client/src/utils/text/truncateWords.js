/**
 * Truncate text to a specified word count
 * @param {string} text - Text to truncate
 * @param {number} wordCount - Maximum number of words
 * @returns {{ truncated: string, isTruncated: boolean, fullText: string }}
 */
export function truncateWords(text, wordCount = 50) {
  if (!text || typeof text !== 'string') {
    return { truncated: '', isTruncated: false, fullText: '' };
  }

  const words = text.split(/\s+/);
  
  if (words.length <= wordCount) {
    return { truncated: text, isTruncated: false, fullText: text };
  }

  const truncated = words.slice(0, wordCount).join(' ');
  
  return { 
    truncated, 
    isTruncated: true, 
    fullText: text 
  };
}

export default truncateWords;
