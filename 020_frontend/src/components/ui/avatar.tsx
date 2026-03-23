import * as React from "react";
import { cn } from "@/lib/utils";

type DivProps = React.HTMLAttributes<HTMLDivElement>;
type ImageProps = React.ImgHTMLAttributes<HTMLImageElement>;
type AvatarFallbackProps = DivProps & {
    name?: string;
};

const FALLBACK_COLORS = [
    "bg-rose-100 text-rose-700",
    "bg-orange-100 text-orange-700",
    "bg-amber-100 text-amber-700",
    "bg-lime-100 text-lime-700",
    "bg-emerald-100 text-emerald-700",
    "bg-sky-100 text-sky-700",
    "bg-cyan-100 text-cyan-700",
    "bg-indigo-100 text-indigo-700",
];

const getInitial = (value?: string): string | null => {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    return trimmed.charAt(0).toUpperCase();
};

const getChildInitial = (children: React.ReactNode): string | null => {
    if (typeof children === "string" || typeof children === "number") {
        return getInitial(String(children));
    }
    return null;
};

const hashSeed = (seed: string): number => {
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
        hash = (hash << 5) - hash + seed.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
};

const Avatar = React.forwardRef<HTMLDivElement, DivProps>(({ className, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
            {...props}
        />
    );
});
Avatar.displayName = "Avatar";

const AvatarImage = React.forwardRef<HTMLImageElement, ImageProps>(({ className, alt, onError, src, ...props }, ref) => {
    const [hasError, setHasError] = React.useState(false);

    React.useEffect(() => {
        setHasError(false);
    }, [src]);

    if (!src || hasError) {
        return null;
    }

    return (
        <img
            ref={ref}
            src={src}
            alt={alt ?? "avatar"}
            className={cn("aspect-square h-full w-full", className)}
            onError={(event) => {
                setHasError(true);
                onError?.(event);
            }}
            {...props}
        />
    );
});
AvatarImage.displayName = "AvatarImage";

const AvatarFallback = React.forwardRef<HTMLDivElement, AvatarFallbackProps>(({ className, name, children, ...props }, ref) => {
    const initial = getInitial(name) ?? getChildInitial(children) ?? "?";
    const colorSeed = name?.trim() || initial;
    const colorClass = FALLBACK_COLORS[hashSeed(colorSeed) % FALLBACK_COLORS.length];
    const content = name || getChildInitial(children) ? initial : (children ?? initial);

    return (
        <div
            ref={ref}
            className={cn("flex h-full w-full items-center justify-center rounded-full text-sm font-semibold", colorClass, className)}
            {...props}
        >
            {content}
        </div>
    );
});
AvatarFallback.displayName = "AvatarFallback";

export { Avatar, AvatarImage, AvatarFallback };
