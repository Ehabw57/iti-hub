const paddingClasses = {
  sm: 'p-4', // 16px
  md: 'p-5', // 20px
  lg: 'p-6', // 24px
};

export default function Card({ children, className = '', padding = 'md' }) {
  return (
    <div
      className={`
        bg-neutral-50
        border border-neutral-200
        rounded-lg
        shadow-elevation-2
        ${paddingClasses[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}