import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { renderMarkdown } from '@/utils/markdownRenderer';

interface User {
    id: number;
    firstName: string;
    lastName: string;
}

interface MentionInputProps {
    value: string;
    onChange: (value: string) => void;
    users: User[];
    placeholder?: string;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    className?: string;
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export const MentionInput = forwardRef<HTMLInputElement, MentionInputProps>(({
    value,
    onChange,
    users,
    placeholder,
    onKeyDown,
    className,
    onBlur,
}, ref) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionStart, setMentionStart] = useState(-1);
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Internal ref for logic if external ref is not provided or to combine
    const internalRef = useRef<HTMLInputElement>(null);
    const inputRef = (ref as React.RefObject<HTMLInputElement>) || internalRef;

    useEffect(() => {
        // Detect @ mentions
        const lastAtIndex = value.lastIndexOf('@');
        if (lastAtIndex >= 0) {
            const textAfterAt = value.substring(lastAtIndex + 1);
            const spaceIndex = textAfterAt.indexOf(' ');

            // Only show suggestions if no space after @
            if (spaceIndex === -1 && textAfterAt.length >= 0) {
                setMentionQuery(textAfterAt.toLowerCase());
                setMentionStart(lastAtIndex);
                const filtered = users.filter(
                    (u) =>
                        u.firstName.toLowerCase().includes(textAfterAt.toLowerCase()) ||
                        u.lastName.toLowerCase().includes(textAfterAt.toLowerCase())
                );
                setFilteredUsers(filtered);
                setShowSuggestions(filtered.length > 0);
                setSelectedIndex(0);
            } else {
                setShowSuggestions(false);
            }
        } else {
            setShowSuggestions(false);
        }
    }, [value, users]);

    const insertMention = (user: User) => {
        const beforeMention = value.substring(0, mentionStart);
        const afterMention = value.substring(
            mentionStart + 1 + mentionQuery.length
        );
        const newValue = `${beforeMention}@${user.firstName} ${afterMention}`;
        onChange(newValue);
        setShowSuggestions(false);
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (showSuggestions) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) =>
                    prev < filteredUsers.length - 1 ? prev + 1 : 0
                );
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) =>
                    prev > 0 ? prev - 1 : filteredUsers.length - 1
                );
            } else if (e.key === 'Enter' && filteredUsers[selectedIndex]) {
                e.preventDefault();
                insertMention(filteredUsers[selectedIndex]);
                return;
            } else if (e.key === 'Escape') {
                setShowSuggestions(false);
            }
        }
        onKeyDown?.(e);
    };

    return (
        <div className="relative">
            <Input
                ref={inputRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={onBlur}
                placeholder={placeholder}
                className={`font-mono ${className || ''}`}
            />

            {/* Suggestions dropdown */}
            {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                    {filteredUsers.map((user, index) => (
                        <div
                            key={user.id}
                            className={`px-3 py-2 cursor-pointer flex items-center gap-2 ${index === selectedIndex
                                ? 'bg-accent'
                                : 'hover:bg-muted'
                                }`}
                            onMouseDown={(e) => {
                                e.preventDefault(); // Prevent blur on click
                                insertMention(user);
                            }}
                        >
                            <div
                                className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-medium"
                                style={{
                                    backgroundColor: `hsl(${(user.id * 137) % 360}, 50%, 50%)`,
                                }}
                            >
                                {user.firstName[0]}
                            </div>
                            <span>
                                {user.firstName} {user.lastName}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});

MentionInput.displayName = 'MentionInput';

// Helper to render mentions and markdown in display text
export function renderMentionsText(text: string): React.ReactNode {
    return renderMarkdown(text);
}
