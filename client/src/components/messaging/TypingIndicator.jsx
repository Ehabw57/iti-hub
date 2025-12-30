import { useIntlayer, useLocale } from 'react-intlayer';
import './TypingIndicator.css';

/**
 * @fileoverview Typing indicator component with animated dots
 * Shows when other users are typing in the conversation
 */

/**
 * TypingIndicator - Animated indicator showing who is typing
 * 
 * @param {Object} props
 * @param {Array} props.typingUsers - Array of user objects who are typing
 * @param {boolean} [props.isGroup=false] - Whether this is a group conversation
 * @returns {JSX.Element | null}
 */
export function TypingIndicator({ typingUsers = [], isGroup = false }) {
  const content = useIntlayer('conversationDetail');
  const { locale } = useLocale();

  if (!typingUsers || typingUsers.length === 0) return null;

  // Format typing text
  const getTypingText = () => {
    if (typingUsers.length === 1) {
      if (isGroup) {
        return content.typingWithName[locale]({ name: typingUsers[0] });
      }
      return content.typing[locale]({});
    }

    if (typingUsers.length === 2) {
      return content.multipleTyping[locale]({ name: typingUsers[0] });
    }

    return content.multipleTyping[locale]({ name: typingUsers[0] });
  };

  return (
    <div className="px-4 py-2 flex items-center gap-2 animate-fade-in">
      {/* Animated Dots */}
      <div className="flex gap-1">
        <span className="typing-dot w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="typing-dot w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="typing-dot w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>

      {/* Typing Text */}
      <span className="text-sm text-neutral-600">{getTypingText()}</span>
    </div>
  );
}

export default TypingIndicator;
