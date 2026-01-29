interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  className?: string;
}

export function FeatureCard({
  icon,
  title,
  description,
  className = "",
}: FeatureCardProps) {
  return (
    <div
      className={`group flex rounded-[10px] bg-white border border-[#ededed] w-90 h-60 transition-all duration-300 hover:border hover:border-primary hover:-translate-y-2 hover:shadow-lg ${className}`}
    >
      <div className="flex flex-col p-5 gap-2.5 items-start h-full">
        <span className="material-symbols-outlined text-xl text-white bg-secondary p-3 rounded-[15px] transition-colors group-hover:bg-primary group-hover:text-secondary">
          {icon}
        </span>
        <p className="text-secondary uppercase text-[1.25rem] font-semibold leading-normal font-barlow min-h-12">
          {title}
        </p>
        <p className="font-roboto font-normal text-xl text-secondary">
          {description}
        </p>
      </div>
    </div>
  );
}
