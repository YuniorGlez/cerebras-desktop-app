import React from 'react';
import clsx from 'clsx';

export const CommandDialog = ({ open, onOpenChange, children }) => {
    if (!open) return null;
    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-50 p-4"
            onClick={() => onOpenChange(false)}
        >
            <div
                className="bg-background text-foreground w-full max-w-lg rounded-md shadow-lg"
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
};

export const CommandInput = React.forwardRef(({ placeholder, value, onValueChange }, ref) => (
    <input
        ref={ref}
        className="bg-transparent text-foreground w-full px-4 py-2 border-b border-gray-300 focus:outline-none"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
    />
));

export const CommandList = ({ children }) => (
    <div className="max-h-60 overflow-y-auto">{children}</div>
);

export const CommandEmpty = ({ children }) => (
    <div className="p-4 text-center text-sm text-gray-500">{children}</div>
);

export const CommandGroup = ({ heading, children }) => (
    <div className="p-2">
        {heading && <div className="px-2 py-1 text-xs font-semibold text-gray-400">{heading}</div>}
        {children}
    </div>
);

export const CommandSeparator = () => <hr className="my-1 border-t border-gray-200" />;

export const CommandItem = React.forwardRef(({ onSelect, children }, ref) => (
    <div
        ref={ref}
        className={clsx(
            'cursor-pointer px-2 py-1 hover:bg-gray-100 flex items-center'
        )}
        onClick={() => onSelect()}
    >
        {children}
    </div>
)); 