import React from 'react';

// Recursive markdown renderer
export function renderMarkdown(text: string): React.ReactNode {
    if (!text) return null;

    // Simple recursive approach using regex split with capturing groups
    // The regex captures tokens and the content between them
    // Order matters for the regex alternation. Longer matches first.
    // We handle: ***, **, __, *, @

    // Regex:
    // 1. ***content***
    // 2. **content**
    // 3. __content__
    // 4. *content* (but not preceded/followed by *)
    // 5. @mention
    // 6. URLs (http:// or https://)

    const parts = text.split(/(\*\*\*.*?\*\*\*|\*\*.*?\*\*|__.*?__|(?<!\*)\*(?!\*).*?(?<!\*)\*(?!\*)|@\w+(?: \w+)?|https?:\/\/[^\s]+)/g);

    return parts.map((part, index) => {
        // Only process parts that matched our specific patterns
        if (part.startsWith('***') && part.endsWith('***') && part.length >= 6) {
            return <span key={index} className="font-bold italic">{renderMarkdown(part.slice(3, -3))}</span>;
        }
        if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
            return <strong key={index}>{renderMarkdown(part.slice(2, -2))}</strong>;
        }
        if (part.startsWith('__') && part.endsWith('__') && part.length >= 4) {
            return <u key={index}>{renderMarkdown(part.slice(2, -2))}</u>;
        }
        if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
            // Basic italics
            return <em key={index}>{renderMarkdown(part.slice(1, -1))}</em>;
        }
        if (part.startsWith('@')) {
            return (
                <span key={index} className="text-primary font-bold bg-primary/10 px-1 rounded mx-0.5">
                    {part}
                </span>
            );
        }
        if (part.match(/^https?:\/\//)) {
            let url = part;
            let suffix = '';

            // Strip common trailing punctuation that probably isn't part of the URL
            const match = part.match(/^(.*?)([,.!?;:]+)$/);
            if (match) {
                url = match[1];
                suffix = match[2];
            }

            return (
                <React.Fragment key={index}>
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline break-all"
                        onClick={(e) => e.stopPropagation()} // Prevent triggering parent clicks (like card selection)
                    >
                        {url}
                    </a>
                    {suffix}
                </React.Fragment>
            );
        }
        // Return text plain
        return part;
    });
}
