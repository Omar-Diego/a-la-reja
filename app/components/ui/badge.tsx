interface BadgeProps {
  children: React.ReactNode;
  icon?: string;
  className?: string;
}

export default function Badge({ children, icon, className = "" }: BadgeProps) {
  return (
    <span
      className={`text-[#CF0] font-roboto text-sm font-normal flex bg-[rgba(204,255,0,0.24)] border border-[rgba(204,255,0,0.58)] rounded-3xl gap-2.5 items-center content-center py-2.5 px-8 ${className}`}
    >
      {icon && <span className="material-symbols-outlined">{icon}</span>}
      {children}
    </span>
  );
}
