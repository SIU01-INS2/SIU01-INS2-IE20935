import React from "react";

interface FormSectionProps {
  titulo: string;
  children: React.ReactNode;
  className?: string;
}

const FormSection = ({ children, titulo, className }: FormSectionProps) => {
  return (
    <section className="flex flex-col min-w-full">
      <h3
        className={`sxs-only:text-[0.95rem] xs-only:text-[1.05rem] sm-only:text-[1.15rem] md-only:text-[1.25rem] lg-only:text-[1.3rem] xl-only:text-[1.35rem] 
          font-semibold border-negro border-b 
          py-[0.2rem] mb-2.5
          ${className}`}
      >
        {titulo}
      </h3>
      <div
        className="flex flex-wrap justify-start sxs-only:gap-y-[0.3125rem] xs-only:gap-y-[0.4375rem] sm-only:gap-y-[0.5625rem] md-only:gap-y-[0.625rem] lg-only:gap-y-[0.75rem] xl-only:gap-y-[0.875rem] 
        sxs-only:gap-x-[0.875rem] xs-only:gap-x-[1.125rem] sm-only:gap-x-[1.375rem] md-only:gap-x-[1.625rem] lg-only:gap-x-[1.875rem] xl-only:gap-x-[2.25rem]"
      >
        {children}
      </div>
    </section>
  );
};

export default FormSection;
