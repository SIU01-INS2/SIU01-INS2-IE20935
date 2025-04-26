"use client";
import { useEffect, useState } from "react";

const WindowDimensionsLabel = () => {
  const [windowsHeight, setWindowsHeight] = useState<number | null>();
  const [windowsWidth, setWindowsWidth] = useState<number | null>();

  useEffect(() => {
    setWindowsHeight(window.innerHeight);
    setWindowsWidth(window.innerWidth);

    const handleResize = () => {
      setWindowsHeight(window.innerHeight);
      setWindowsWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    windowsHeight &&
    windowsWidth && (
      <div className="border-2 border-[rgba(0,0,0,0.5)] border-dashed rounded-[0.5rem] flex flex-row items-center gap-4 justify-center fixed  bottom-0 right-0  bg-white text-black z-[1000] w-min p-3 opacity-60">
        <span className="flex">
          Ancho: <b>{windowsWidth}</b>
        </span>

        <span className="flex">
          Altura: <b>{windowsHeight}</b>
        </span>
      </div>
    )
  );
};

export default WindowDimensionsLabel;
