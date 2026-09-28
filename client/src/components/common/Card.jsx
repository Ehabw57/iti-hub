const paddingClasses = {
  sm: 'p-4', // 16px
  md: 'p-5', // 20px
  lg: 'p-6', // 24px
};

export default function Card({ children, className = '', padding = 'md' }) {
  return (
    <div
      className={`
        bg-neutral-100
        border border-neutral-200
        rounded-md
        shadow-elevation-1
        ${paddingClasses[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}