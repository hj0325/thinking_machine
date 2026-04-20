"use client";

export default function MetaPill({ children, className }) {
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${className}`}>{children}</span>;
}

