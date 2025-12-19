import { AiOutlineLoading } from 'react-icons/ai';

const sizeClasses = {
  sm: 'w-6 h-6', // 24px
  md: 'w-8 h-8', // 32px
  lg: 'w-12 h-12', // 48px
};

function SpinnerVariant({ size = 'md', className = '' }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <AiOutlineLoading
        className={`${sizeClasses[size]} animate-spin text-primary-600`}
        aria-hidden="true"
      />
    </div>
  );
}

function SkeletonVariant({ className = '' }) {
  return (
    <div className={`space-y-3 ${className}`} role="status" aria-hidden="true">
      <div className="h-4 bg-neutral-200 rounded animate-pulse"></div>
      <div className="h-4 bg-neutral-200 rounded animate-pulse w-5/6"></div>
      <div className="h-4 bg-neutral-200 rounded animate-pulse w-4/6"></div>
    </div>
  );
}

export default function Loading({ variant = 'spinner', size = 'md', className = '' }) {
  if (variant === 'skeleton') {
    return <SkeletonVariant className={className} />;
  }

  return <SpinnerVariant size={size} className={className} />;
}
