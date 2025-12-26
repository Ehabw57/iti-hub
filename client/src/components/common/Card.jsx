const paddingClasses = {
  sm: 'p-4', // 16px
  md: 'p-5', // 20px
  lg: 'p-6', // 24px
  xl: 'p-8', // 32px
};

export default function Card({ children, className = '', padding = 'md', variant = 'default' }) {
  const variantClasses = {
    default: 'bg-neutral-50 border border-neutral-200 shadow-elevation-2',
    auth: 'bg-white/60 dark:bg-neutral-900/70 backdrop-blur-xl border border-white/40 dark:border-neutral-700/50 shadow-2xl text-neutral-900 dark:text-neutral-100',
  };

  return (
    <div
      className={`
        ${variantClasses[variant]}
        rounded-2xl
        ${paddingClasses[padding]}
        ${className}
        `}
    >
      {children}
    </div>
  );
}
