import { AiOutlineLoading } from 'react-icons/ai';

const variantClasses = {
  primary: 'bg-primary-600 border-transparent text-white hover:bg-primary-700 active:bg-primary-800 disabled:bg-neutral-200 disabled:text-neutral-500',
  secondary: 'bg-transparent border-neutral-300 text-neutral-900 hover:bg-neutral-100 hover:border-neutral-400 active:bg-neutral-200 disabled:text-neutral-400 disabled:border-neutral-200',
  text: 'bg-transparent border-transparent text-neutral-500 hover:underline hover:text-neutral-700 active:text-neutral-800 disabled:text-neutral-400',
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
