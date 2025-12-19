import { AiOutlineLoading } from 'react-icons/ai';

const variantClasses = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 disabled:bg-neutral-200 disabled:text-neutral-500',
  secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 active:bg-secondary-800 disabled:bg-neutral-200 disabled:text-neutral-500',
  text: 'bg-transparent text-secondary-600 hover:underline hover:bg-secondary-50 active:text-secondary-700 disabled:text-neutral-400',
};

export default function Button({
  variant = 'primary',
  type = 'button',
  loading = false,
  disabled = false,
  children,
  onClick,
  className = '',
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        relative
        inline-flex items-center justify-center gap-2
        h-10 px-4 py-2.5
        rounded-lg
        border border-transparent
        text-button
        transition-all duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500 focus-visible:ring-offset-2
        disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <AiOutlineLoading className="h-5 w-5 animate-spin" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}
