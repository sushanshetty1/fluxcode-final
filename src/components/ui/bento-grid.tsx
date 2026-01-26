"use client";

import { cn } from "~/lib/utils";
import { ArrowUpRight } from "lucide-react";
import React, { useRef, useState } from "react";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "grid auto-rows-[22rem] grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
  category,
  onClick,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  category?: string;
  onClick?: () => void;
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;

    const div = divRef.current;
    const rect = div.getBoundingClientRect();

    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => {
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={cn(
        "row-span-1 rounded-3xl group/bento hover:shadow-2xl transition duration-500 shadow-none bg-black border border-white/10 hover:border-primary/30 relative overflow-hidden h-full cursor-pointer",
        className
      )}
    >
      {/* Spotlight Overlay */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-500 group-hover/bento:opacity-100 z-30"
        style={{
          background: `radial-gradient(800px circle at ${position.x}px ${position.y}px, rgba(99,102,241,0.08), transparent 40%)`,
          opacity,
        }}
      />
      
      {/* Image / Header Section (Full Background) */}
      <div className="absolute inset-0 w-full h-full transition-all duration-700 group-hover/bento:scale-105 z-10">
         {header}
      </div>

      {/* Content Section - Overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-6 bg-gradient-to-t from-black via-black/90 to-transparent pt-32 translate-y-2 group-hover/bento:translate-y-0 transition-transform duration-500">
        
        <div className="flex items-center justify-between mb-3">
           {icon && (
             <div className="p-2.5 rounded-full border border-white/10 bg-black/50 backdrop-blur-md">
               {icon}
             </div>
           )}
           <div className="p-2 rounded-full border border-white/10 bg-white/5 opacity-0 group-hover/bento:opacity-100 transition-all duration-300">
              <ArrowUpRight className="w-4 h-4 text-primary" />
           </div>
        </div>

        {category && (
          <p className="text-[10px] uppercase tracking-widest text-primary/80 mb-2 font-mono">
            {category}
          </p>
        )}

        <h3 className="font-bold text-xl text-white mb-2 group-hover/bento:text-primary transition-colors duration-300">
          {title}
        </h3>
        
        <p className="text-sm text-white/60 line-clamp-2">
          {description}
        </p>
      </div>
    </div>
  );
};
