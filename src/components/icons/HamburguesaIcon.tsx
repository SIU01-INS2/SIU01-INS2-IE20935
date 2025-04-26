import { IconProps } from "@/interfaces/IconProps";

const HamburguesaIcon = ({ className, title }: IconProps) => {
  return (
    <div title={title}>
      <svg
        className={`   ${className}`}
        viewBox="0 0 44 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="44" height="6" rx="3" className="fill-current" />
        <rect width="44" height="6" rx="3" className="fill-current" />
        <rect width="44" height="6" rx="3" className="fill-current" />
        <rect y="14" width="44" height="6" rx="3" className="fill-current" />
        <rect y="14" width="44" height="6" rx="3" className="fill-current" />
        <rect y="14" width="44" height="6" rx="3" className="fill-current" />
        <rect y="28" width="44" height="6" rx="3" className="fill-current" />
        <rect y="28" width="44" height="6" rx="3" className="fill-current" />
        <rect y="28" width="44" height="6" rx="3" className="fill-current" />
      </svg>
    </div>
  );
};

export default HamburguesaIcon;
