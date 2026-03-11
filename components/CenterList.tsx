import { CenterCard } from "./CenterCard";
import { Loader2 } from "lucide-react";

interface CenterListProps {
  centers: any[];
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onClickToggle: (id: string) => void;
  isLoading: boolean;
}

export function CenterList({
  centers,
  hoveredId,
  onHover,
  onClickToggle,
  isLoading
}: CenterListProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-3">
        {centers.map((center, index) => (
          <CenterCard
            key={center.place_id || index}
            id={`center-${center.place_id}`}
            name={center.name}
            rating={center.rating}
            address={center.vicinity || center.formatted_address}
            phone={center.formatted_phone_number}
            distance={center.distanceText}
            isHovered={hoveredId === center.place_id}
            onMouseEnter={() => onHover(center.place_id)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onClickToggle(center.place_id)}
          />
        ))}
      </div>
      
      {isLoading && centers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/10 rounded-xl border border-dashed">
          <Loader2 className="h-8 w-8 animate-spin text-primary/50 mb-3" />
          <p className="text-sm font-medium">Finding nearby mental health centers...</p>
        </div>
      )}
      
      {!isLoading && centers.length === 0 && (
        <div className="text-center py-12 text-sm text-muted-foreground border border-dashed rounded-xl bg-muted/10">
          <p className="font-medium text-base mb-1">No centers found locally</p>
          <p>Try expanding your search distance</p>
        </div>
      )}
      
    </div>
  );
}
