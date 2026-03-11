import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface CenterCardProps {
  id?: string;
  name: string;
  rating?: number;
  address: string;
  phone?: string;
  distance?: string;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}

export function CenterCard({
  id,
  name,
  rating,
  address,
  phone,
  distance,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onClick
}: CenterCardProps) {
  return (
    <div
      id={id}
      className={cn(
        "flex p-4 rounded-xl cursor-pointer transition-all duration-300 border",
        isHovered
          ? "bg-muted/70 border-primary/50 shadow-md ring-1 ring-primary/20 scale-[1.01]"
          : "bg-card border-border hover:bg-muted/40 shadow-sm"
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      <div className="flex w-full flex-col">
        <div className="flex justify-between items-start gap-4">
          <h3 className="font-semibold text-lg text-foreground">
            {name}
          </h3>
          {distance && (
            <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full shrink-0 whitespace-nowrap font-medium">
              {distance}
            </span>
          )}
        </div>

        <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          <p className="mb-1 leading-relaxed">
            <strong className="text-foreground">Address:</strong> {address}
          </p>
          <p className="mb-1">
            <strong className="text-foreground">Phone:</strong>{" "}
            {phone && phone !== "Not Available" ? (
              <a 
                 href={`tel:${phone.replace(/[^0-9+]/g, '')}`} 
                 className="text-blue-600 hover:underline" 
                 onClick={(e) => e.stopPropagation()}
              >
                {phone}
              </a>
            ) : (
              "Not Available"
            )}
          </p>
        </div>

        {rating && (
          <div className="flex items-center gap-1 text-sm font-medium text-amber-500 mt-3 bg-amber-500/10 w-fit px-2 py-0.5 rounded-md border border-amber-500/20">
            <Star className="w-3.5 h-3.5 fill-amber-500" />
            <span>{rating.toFixed(1)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
