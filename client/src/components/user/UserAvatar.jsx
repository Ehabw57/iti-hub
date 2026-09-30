import { useState } from 'react';

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
  const [failedSrc, setFailedSrc] = useState(null);
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  const cursorClass = onClick ? 'cursor-pointer' : '';

  if (!src || failedSrc === src) return <span role="img" aria-label={alt || 'User'} onClick={onClick} className={`${sizes[size]} inline-flex shrink-0 items-center justify-center rounded-full bg-primary-50 font-semibold text-primary-700 ${cursorClass} ${className}`}>{(alt || 'U').trim().charAt(0).toUpperCase()}</span>;

  return (
    <img
      src={src || '/default-avatar.png'}
      onError={() => setFailedSrc(src)}
      alt={alt}
      className={`${sizes[size]} rounded-full object-cover ${cursorClass} ${className}`}
      onClick={onClick}
    />
  );
}
