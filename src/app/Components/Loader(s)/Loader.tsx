import React from "react";

const Loader = () => {
  return (
    <div className="flex gap-1 px-2">
      {" "}
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-2 w-2 rounded-full bg-slate-400 animate-pulse"
          style={{ animationDelay: `${i * 0.2}s` }}
        ></div>
      ))}
    </div>
  );
};

export default Loader;
