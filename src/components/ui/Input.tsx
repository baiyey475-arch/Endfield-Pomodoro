import React from "react";

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (
    props,
) => (
    <div className={`relative group ${props.className ?? ""}`}>
        <input
            {...props}
            className={`bg-theme-surface/50 border border-theme-highlight/50 text-theme-text font-ui-mono text-ui-sm leading-ui-none px-5 h-form-control focus:outline-none focus:border-theme-primary w-full min-w-0 placeholder-theme-dim/70 transition-all duration-300 rounded-lg`}
        />
        <div className="absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r from-theme-primary to-theme-accent scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 rounded-lg"></div>
    </div>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (
    props,
) => (
    <div className="relative group">
        <select
            {...props}
            className={`bg-theme-surface/50 border border-theme-highlight/50 text-theme-text font-ui-mono text-ui-sm leading-ui-none px-5 h-form-control focus:outline-none focus:border-theme-primary w-full appearance-none cursor-pointer hover:bg-theme-surface transition-colors ${props.className ?? ""} rounded-lg`}
        >
            {props.children}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-theme-primary text-ui-xs transition-all duration-300 group-hover:text-theme-accent">
            ▼
        </div>
    </div>
);
