"use client";
import { RootState } from "@/global/store";
import InterceptedLink, { InterceptedLinkProps } from "./InterceptedLink";
import { useSelector } from "react-redux";

type InterceptedLinkForDataThatCouldBeLostProps = Omit<
  InterceptedLinkProps,
  "predicate" | "negativeCallback"
>;

const InterceptedLinkForDataThatCouldBeLost = ({
  children,
  href,
  className,
}: InterceptedLinkForDataThatCouldBeLostProps) => {
  const thereIsDataCoudBeLost = useSelector(
    (state: RootState) => state.flags.dataCouldBeLost
  );

  const negativeCallback = () => {};

  return (
    <InterceptedLink
      predicate={() => thereIsDataCoudBeLost}
      href={href}
      negativeCallback={negativeCallback}
      className={`${className}`}
    >
      {children}
    </InterceptedLink>
  );
};

export default InterceptedLinkForDataThatCouldBeLost;
