import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import React, { ReactNode, useEffect, useState } from "react";

interface Props {
  onCall: () => void;
  dataRole?: "ai" | "user";
  preMsg: string;
  children: ReactNode;
}
const CustomTooltip = ({ onCall, dataRole, children, preMsg }: Props) => {
  const [tooltipText, setTooltipText] = useState(preMsg);
  const [isDone, setIsDone] = useState(false);

  const handleClick = () => {
    onCall();
    setIsDone(true);
    setTimeout(() => {
      setIsDone(false);
    }, 2000);
  };
  return (
    <TooltipProvider delayDuration={100} skipDelayDuration={500}>
      <Tooltip>
        <TooltipTrigger
          className={"w-[16px] cursor-pointer hidden  group-hover:block"}
          onClick={handleClick}
        >
          {isDone ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="20px"
              width="20px"
              viewBox="0 -960 960 960"
              fill={dataRole === "ai" ? "#6d6d6d" : "white"}
            >
              <path d="m382-354 339-339q12-12 28-12t28 12q12 12 12 28.5T777-636L410-268q-12 12-28 12t-28-12L182-440q-12-12-11.5-28.5T183-497q12-12 28.5-12t28.5 12l142 143Z" />
            </svg>
          ) : (
            children
          )}
        </TooltipTrigger>
        <TooltipContent className=" cursor-pointer">
          {tooltipText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CustomTooltip;
