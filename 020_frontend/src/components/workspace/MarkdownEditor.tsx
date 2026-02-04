import React, { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Underline, List, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { renderMarkdown } from '@/utils/markdownRenderer';

interface User {
    id: number;
    firstName: string;
    lastName: string;
}

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    users: User[];
    placeholder?: string;
    minHeight?: string;
    className?: string;
}

export function MarkdownEditor({
    value,
    onChange,
    users,
    placeholder,
    minHeight = '200px',
    className,
}: MarkdownEditorProps) {
    const [isFocused, setIsFocused] = useState(false);
    const [showMentions, setShowMentions] = useState(false);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [, setMentionQuery] = useState('');
    const [mentionStart, setMentionStart] = useState(-1);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Helper to get caret coordinates
    const updateMentionPosition = () => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const { selectionStart } = textarea;
        const text = textarea.value.substring(0, selectionStart);

        // Create a mirror div to calculate position
        const div = document.createElement('div');
        const style = window.getComputedStyle(textarea);

        // Copy relevant styles
        [
            'border', 'boxSizing', 'fontFamily', 'fontSize', 'fontWeight', 'letterSpacing',
            'lineHeight', 'padding', 'textDecoration', 'textIndent', 'textTransform',
            'whiteSpace', 'wordSpacing', 'wordWrap', 'width'
        ].forEach((prop) => {
            div.style[prop as any] = style[prop as any];
        });

        div.style.position = 'absolute';
        div.style.visibility = 'hidden';
        div.style.height = 'auto'; // allow expansion
        div.style.overflow = 'hidden';

        // Replace special chars for correct sizing
        div.textContent = text;
        const span = document.createElement('span');
        span.textContent = '|'; // Caret
        div.appendChild(span);

        document.body.appendChild(div);

        const { offsetLeft, offsetTop } = span;
        // Adjust for scroll
        const top = offsetTop - textarea.scrollTop;
        const left = offsetLeft - textarea.scrollLeft;

        document.body.removeChild(div);

        const lineHeight = parseInt(style.lineHeight);

        setMentionPosition({
            top: top + (isNaN(lineHeight) ? 20 : lineHeight),
            left: left
        });
    };

    useEffect(() => {
        // Detect @ mentions
        const selectionStart = textareaRef.current?.selectionStart || 0;
        const textBeforeCursor = value.substring(0, selectionStart);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');

        if (lastAtIndex >= 0) {
            const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
            // Check if there's a newline between @ and cursor -> abort
            if (!textAfterAt.includes('\n')) {
                setMentionQuery(textAfterAt.toLowerCase());
                setMentionStart(lastAtIndex);
                const filtered = users.filter(
                    (u) =>
                        u.firstName.toLowerCase().includes(textAfterAt.toLowerCase()) ||
                        u.lastName.toLowerCase().includes(textAfterAt.toLowerCase())
                );
                setFilteredUsers(filtered);
                setShowMentions(filtered.length > 0);
                setSelectedIndex(0);

                if (filtered.length > 0) {
                    updateMentionPosition();
                }
            } else {
                setShowMentions(false);
            }
        } else {
            setShowMentions(false);
        }
    }, [value, users, isFocused]); // Re-run on value change

    const insertMention = (user: User) => {
        const selectionStart = textareaRef.current?.selectionStart || 0;

        const beforeMention = value.substring(0, mentionStart);
        const afterCursor = value.substring(selectionStart);

        const newValue = `${beforeMention}@${user.firstName} ${afterCursor}`;

        onChange(newValue);
        setShowMentions(false);

        // Restore focus and set caret (need timeout or useEffect)
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                const newCursorPos = mentionStart + user.firstName.length + 2; // @ + name + space
                textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
        }, 0);
    };

    const insertAtCursor = (text: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newValue = value.substring(0, start) + text + value.substring(end);

        onChange(newValue);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + text.length, start + text.length);
        }, 0);
    };

    const wrapSelection = (prefix: string, suffix: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selection = value.substring(start, end);

        const newValue =
            value.substring(0, start) +
            prefix +
            selection +
            suffix +
            value.substring(end);

        onChange(newValue);

        setTimeout(() => {
            textarea.focus();
            // Keep selection
            textarea.setSelectionRange(start + prefix.length, end + prefix.length);
        }, 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (showMentions) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) =>
                    prev < filteredUsers.length - 1 ? prev + 1 : 0
                );
                return;
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) =>
                    prev > 0 ? prev - 1 : filteredUsers.length - 1
                );
                return;
            } else if (e.key === 'Enter' && filteredUsers[selectedIndex]) {
                e.preventDefault();
                insertMention(filteredUsers[selectedIndex]);
                return;
            } else if (e.key === 'Escape') {
                setShowMentions(false);
                return;
            }
        }

        // List Auto-continuation
        if (e.key === 'Enter') {
            const textarea = textareaRef.current;
            if (!textarea) return;

            const start = textarea.selectionStart;
            const currentLineStart = value.lastIndexOf('\n', start - 1) + 1;
            const currentLineEnd = value.indexOf('\n', start);
            const currentLine = value.substring(currentLineStart, currentLineEnd === -1 ? value.length : currentLineEnd);

            // Check for list patterns
            const unorderedMatch = currentLine.match(/^(\s*)([-*+])\s+/);
            const orderedMatch = currentLine.match(/^(\s*)(\d+)\.\s+/);

            if (unorderedMatch) {
                // If line is empty (just bullet), remove it
                if (currentLine.trim() === unorderedMatch[2]) {
                    e.preventDefault();
                    const newValue = value.substring(0, currentLineStart) + value.substring(currentLineEnd === -1 ? value.length : currentLineEnd + 1);
                    onChange(newValue);
                    return;
                }
                e.preventDefault();
                const indent = unorderedMatch[1];
                const bullet = unorderedMatch[2];
                insertAtCursor(`\n${indent}${bullet} `);
            } else if (orderedMatch) {
                const number = parseInt(orderedMatch[2]);
                // If line is empty (just number), remove it
                if (currentLine.trim() === `${number}.`) {
                    e.preventDefault(); // Stop newline
                    const newValue = value.substring(0, currentLineStart) + value.substring(currentLineEnd === -1 ? value.length : currentLineEnd + 1);
                    onChange(newValue);
                    return;
                }
                e.preventDefault();
                const indent = orderedMatch[1];
                insertAtCursor(`\n${indent}${number + 1}. `);
            }
        }

        // Keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'b') {
                e.preventDefault();
                wrapSelection('**', '**');
            } else if (e.key === 'i') {
                e.preventDefault();
                wrapSelection('*', '*');
            } else if (e.key === 'u') {
                e.preventDefault();
                wrapSelection('__', '__');
            }
        }
    };

    return (
        <div ref={containerRef} className={`border rounded-lg bg-background ${className}`}>
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b bg-muted/20">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => wrapSelection('**', '**')}
                    title="Fett (Ctrl+B)"
                >
                    <Bold className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => wrapSelection('*', '*')}
                    title="Kursiv (Ctrl+I)"
                >
                    <Italic className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => wrapSelection('__', '__')}
                    title="Unterstrichen (Ctrl+U)"
                >
                    <Underline className="h-4 w-4" />
                </Button>
                <div className="w-px h-4 bg-border mx-1" />
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => insertAtCursor('\n- ')}
                    title="Liste"
                >
                    <List className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => insertAtCursor('\n1. ')}
                    title="Nummerierte Liste"
                >
                    <ListOrdered className="h-4 w-4" />
                </Button>
            </div>

            {/* Editor Area */}
            <div className={`relative min-h-[${minHeight}]`}>
                {/* Editor Textarea */}
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => {
                        setIsFocused(false);
                        // Delay hiding suggestions to allow click
                        setTimeout(() => setShowMentions(false), 200);
                    }}
                    placeholder={placeholder}
                    className="w-full h-full p-3 bg-transparent resize-y min-h-[inherit] font-mono relative z-10 focus:outline-none"
                    style={{ minHeight }}
                />

                {/* Suggestions Dropdown */}
                {showMentions && (
                    <div
                        className="absolute bg-popover border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto w-64"
                        style={{
                            top: mentionPosition.top,
                            left: mentionPosition.left,
                        }}
                    >
                        {filteredUsers.map((user, index) => (
                            <div
                                key={user.id}
                                className={`px-3 py-2 cursor-pointer flex items-center gap-2 ${index === selectedIndex
                                    ? 'bg-accent'
                                    : 'hover:bg-muted'
                                    }`}
                                onMouseDown={(e) => {
                                    e.preventDefault(); // Prevent blur
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
        </div>
    );
}

// Export renderMarkdownPreview for backward compatibility if needed, 
// though we use renderMarkdown from utils now.
export function renderMarkdownPreview(text: string) {
    return renderMarkdown(text);
}
