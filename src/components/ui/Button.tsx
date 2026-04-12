import React, { useState } from "react";

export const Button: React.FC<
    React.ButtonHTMLAttributes<HTMLButtonElement> & {
        variant?: "primary" | "secondary" | "danger" | "ghost";
    }
> = ({ children, variant = "primary", className = "", ...props }) => {
    const [isPressed, setIsPressed] = useState(false);

    const baseStyle =
        "font-ui-mono uppercase tracking-ui-wider text-ui-sm leading-ui-none px-5 md:px-8 min-h-form-control transition-all duration-300 inline-flex items-center justify-center gap-3 relative group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer overflow-hidden whitespace-nowrap rounded-lg font-semibold";

    const variants = {
        primary:
            "bg-gradient-to-r from-theme-primary to-theme-accent text-theme-base hover:shadow-xl hover:shadow-theme-primary/20",
        secondary:
            "bg-transparent text-theme-primary border border-theme-primary/50 hover:bg-theme-primary/10 hover:shadow-lg",
        danger: "bg-gradient-to-r from-red-500 to-orange-500 text-white hover:shadow-xl hover:shadow-red-500/20",
        ghost: "bg-transparent text-theme-text hover:text-theme-primary hover:bg-theme-highlight/10 hover:shadow-lg",
    };

    return (
        <button
            className={`${baseStyle} ${variants[variant]} ${className}`}
            style={{ transform: isPressed ? "scale(0.97)" : "scale(1)" }}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            onMouseLeave={() => setIsPressed(false)}
            {...props}
        >
            <span className="relative z-10 flex items-center gap-3">
                {children}
            </span>
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
        </button>
    );
};
