import React, { useEffect, useRef, useState } from "react";

interface Option {
    value: string;
    label: string;
}

interface CustomSelectProps {
    value: string;
    options: Option[];
    onChange: (value: string) => void;
    className?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
    value,
    options,
    onChange,
    className = "",
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () =>
                document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [isOpen]);

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* 选中显示 */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                title={selectedOption?.label || value}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                className="w-full bg-theme-highlight/20 border border-theme-highlight text-theme-text font-mono text-sm leading-none px-4 h-form-control focus:outline-none focus:border-theme-primary hover:bg-theme-highlight/10 transition-all duration-300 flex items-center justify-between group cursor-pointer"
            >
                <span className="truncate">
                    {selectedOption?.label || value}
                </span>
                <i
                    className={`ri-arrow-down-s-line text-lg transition-transform duration-200 flex-shrink-0 ml-2 ${isOpen ? "rotate-180" : ""}`}
                ></i>
            </button>

            {/* 下拉列表 */}
            {isOpen && (
                <div
                    role="listbox"
                    className="absolute top-full left-0 right-0 mt-1 bg-theme-surface border border-theme-primary shadow-[0_4px_20px_rgba(0,0,0,0.5)] z-50 max-h-64 overflow-y-auto custom-scrollbar"
                >
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            role="option"
                            aria-selected={option.value === value}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-4 min-h-form-control font-mono text-sm leading-none transition-all duration-200 border-b border-theme-highlight/30 border-l-2 last:border-b-0 cursor-pointer ${
                                option.value === value
                                    ? "bg-theme-primary/20 text-theme-primary border-l-theme-primary"
                                    : "text-theme-text border-l-transparent hover:bg-theme-highlight/20 hover:text-theme-primary hover:border-l-theme-primary"
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="truncate">{option.label}</span>
                                {option.value === value && (
                                    <i className="ri-check-line text-base"></i>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
