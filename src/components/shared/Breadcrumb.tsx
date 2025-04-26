import { ChevronRight } from "lucide-react";
import { Link } from "next-view-transitions";
import React from "react";

interface BreadcrumbElement {
  Texto: string;
  Ruta: string;
}

interface BreadcrumbProps {
  elements: BreadcrumbElement[];
  className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({
  elements,
  className = "",
}) => {
  if (!elements || elements.length === 0) return null;

  return (
    <nav
      className={`flex items-center text-sm sm-only:text-xs md-only:text-sm lg-only:text-base xl-only:text-base ${className}`}
    >
      <ol className="flex flex-wrap items-center">
        {elements.map((element, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <li className="flex items-center">
                <ChevronRight className="h-4 w-4 mx-1 text-gray-500" />
              </li>
            )}
            <li>
              {index === elements.length - 1 ? (
                <span className="font-semibold text-red-600">
                  {element.Texto}
                </span>
              ) : (
                <Link
                  href={element.Ruta}
                  className="text-gray-700 hover:text-red-600 hover:underline transition duration-150"
                >
                  {element.Texto}
                </Link>
              )}
            </li>
          </React.Fragment>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
