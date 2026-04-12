import React from "react";

export const Panel: React.FC<{
    children: React.ReactNode;
    className?: string;
    title?: React.ReactNode;
}> = ({ children, className = "", title }) => (
    <div
        className={`relative glass-effect min-h-0 ${className} rounded-xl transition-all duration-300 hover:shadow-xl`}
    >
        {title && (
            <div className="absolute -top-4 left-4 bg-theme-surface px-4 py-1.5 text-ui-micro font-ui-mono text-theme-primary uppercase tracking-ui-panel border border-theme-primary/30 flex items-center gap-2 shadow-lg z-20 rounded-lg">
                <span className="w-2 h-2 bg-theme-primary rounded-full animate-pulse"></span>
                <span className="gradient-text font-semibold">{title}</span>
            </div>
        )}

        <div className="relative z-10 h-full min-h-0 w-full">{children}</div>
    </div>
);
