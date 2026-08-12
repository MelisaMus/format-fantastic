import { useState, type ReactNode } from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

type Props<T> = {
  items: T[];
  getId: (item: T) => string;
  onReorder: (from: number, to: number) => void;
  renderItem: (item: T, index: number) => ReactNode;
  label: string;
};

/**
 * Drag & drop list with keyboard support: entries can be dropped anywhere,
 * including freshly added ones.
 */
export function SortableList<T>({ items, getId, onReorder, renderItem, label }: Props<T>) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  return (
    <ul className="space-y-3" aria-label={label}>
      {items.map((item, i) => (
        <li
          key={getId(item)}
          onDragOver={(e) => {
            if (dragIndex === null) return;
            e.preventDefault();
            setOverIndex(i);
          }}
          onDrop={(e) => {
            if (dragIndex === null) return;
            e.preventDefault();
            onReorder(dragIndex, i);
            setDragIndex(null);
            setOverIndex(null);
          }}
          className={cn(
            "rounded-md transition",
            dragIndex === i && "opacity-50",
            overIndex === i && dragIndex !== null && dragIndex !== i && "ring-2 ring-ring",
          )}
        >
          <div className="flex items-start gap-2">
            <button
              type="button"
              draggable
              onDragStart={(e) => {
                setDragIndex(i);
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", getId(item));
              }}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowUp" && i > 0) {
                  e.preventDefault();
                  onReorder(i, i - 1);
                }
                if (e.key === "ArrowDown" && i < items.length - 1) {
                  e.preventDefault();
                  onReorder(i, i + 1);
                }
                if (e.key === "Home") {
                  e.preventDefault();
                  onReorder(i, 0);
                }
                if (e.key === "End") {
                  e.preventDefault();
                  onReorder(i, items.length - 1);
                }
              }}
              aria-label={`${label}: Position ${i + 1} von ${items.length} verschieben (Pfeiltasten oder ziehen)`}
              className="mt-3 flex size-11 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:cursor-grabbing"
            >
              <GripVertical className="size-4" aria-hidden="true" />
            </button>
            <div className="min-w-0 flex-1">{renderItem(item, i)}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}
