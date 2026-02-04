import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import type { TaskCategory } from '@/types/workspace';

interface SortableCategoryItemProps {
    category: TaskCategory;
    isSelected: boolean;
    onClick: (id: number) => void;
}

export function SortableCategoryItem({ category, isSelected, onClick }: SortableCategoryItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: `cat-${category.id}` });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="inline-block" // Ensure it flows correctly in flex container
        >
            <Button
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                onClick={() => onClick(category.id)}
                style={{
                    borderColor: category.color || undefined,
                    ...(isSelected && category.color
                        ? { backgroundColor: category.color }
                        : {}),
                }}
                className="cursor-move" // Indicate dragging
            >
                {category.name}
            </Button>
        </div>
    );
}
