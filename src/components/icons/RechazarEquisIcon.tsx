import { IconProps } from "@/interfaces/IconProps";

const RechazarEquisIcon= ({ className, title }: IconProps) => {
  return (
    <div title={title}>
      <svg
        className={className}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M21.9324 16.0003L31.8164 25.8843L25.8804 31.8203L15.9964 21.9363L6.08444 31.8483L0.148438 25.9123L10.0604 16.0003L0.148438 6.08834L6.08444 0.152344L15.9964 10.0643L25.9084 0.180343L31.8444 6.11634L21.9324 16.0003Z" className="fill-current"/>
      </svg>
    </div>
  );
};

export default RechazarEquisIcon;