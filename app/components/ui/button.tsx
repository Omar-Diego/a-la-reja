interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "inverted";
  className?: string;
}

const variants = {
  primary:
    "bg-primary text-secondary hover:bg-white hover:ring-4 hover:ring-inset hover:ring-primary",
  inverted:
    "bg-white text-secondary ring-4 ring-inset ring-primary hover:bg-primary hover:ring-0",
};

export default function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  className = "",
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`text-[1.25rem] font-semibold leading-normal font-barlow flex py-2.5 px-7.5 justify-center items-center gap-2.5 rounded-[10px] cursor-pointer transition-all ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
