/**
 * UserAvatar Component
 * Reusable avatar component with size variants
 * Single source of truth for avatar styling across the application
 */

/**
 * UserAvatar - Display user profile picture with consistent styling
 * @param {Object} props
 * @param {string} props.src - Image URL
 * @param {string} props.alt - Alt text for accessibility
 * @param {string} [props.size='md'] - Size variant: 'sm' | 'md' | 'lg'
 * @param {Function} [props.onClick] - Optional click handler
 * @param {string} [props.className=''] - Additional CSS classes
 */
export function UserAvatar({ 
  src, 
  alt, 
  size = 'md', 
  onClick,
  className = '' 
}) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  const cursorClass = onClick ? 'cursor-pointer' : '';

  return (
    <img
      src={src || '/default-avatar.png'}
      alt={alt}
      className={`${sizes[size]} rounded-full object-cover ${cursorClass} ${className}`}
      onClick={onClick}
    />
  );
}
