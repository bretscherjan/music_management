import React, { useRef, forwardRef, useEffect } from 'react';
import { Bold, Italic, Underline } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MentionInput } from '@/components/workspace/MentionInput';

interface User {
    id: number;
    firstName: string;
    lastName: string;
}

interface FormattedInputProps {
    value: string;
    onChange: (value: string) => void;
    users: User[];
    placeholder?: string;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
    className?: string;
    autoFocus?: boolean;
}

export const FormattedInput = forwardRef<HTMLInputElement, FormattedInputProps>(({
    value,
    onChange,
    users,
    placeholder,
    onKeyDown,
    onBlur,
    className,
    autoFocus
}, ref) => {
    const internalRef = useRef<HTMLInputElement>(null);
    const inputRef = (ref as React.RefObject<HTMLInputElement>) || internalRef;

    useEffect(() => {
        if (autoFocus && inputRef.current) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        }
    }, [autoFocus]);

    const handleWrap = (prefix: string, suffix: string) => {
        const input = inputRef.current;
        if (!input) return;
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;

        const newValue =
            value.substring(0, start) +
            prefix +
            value.substring(start, end) +
            suffix +
            value.substring(end);

        onChange(newValue);

        setTimeout(() => {
            input.focus();
            input.setSelectionRange(start + prefix.length, end + prefix.length);
        }, 0);
    };

    return (
        <div className="flex flex-col gap-1 w-full relative group">
            <div className="flex items-center gap-0.5 bg-muted/20 p-1 rounded border mb-1 w-fit opacity-100 transition-opacity">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleWrap('**', '**')}
                    onMouseDown={(e) => e.preventDefault()}
                    title="Fett"
                    type="button"
                >
                    <Bold className="h-3 w-3" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleWrap('*', '*')}
                    onMouseDown={(e) => e.preventDefault()}
                    title="Kursiv"
                    type="button"
                >
                    <Italic className="h-3 w-3" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleWrap('__', '__')}
                    onMouseDown={(e) => e.preventDefault()}
                    title="Unterstrichen"
                    type="button"
                >
                    <Underline className="h-3 w-3" />
                </Button>
            </div>
            <MentionInput
                ref={inputRef}
                value={value}
                onChange={onChange}
                users={users}
                placeholder={placeholder}
                onKeyDown={onKeyDown}
                onBlur={onBlur}
                className={className}
            />
        </div>
    );
});

FormattedInput.displayName = 'FormattedInput';
