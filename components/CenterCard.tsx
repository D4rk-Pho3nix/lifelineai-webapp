import { useState } from "react";
import { Star, Copy, Check, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

interface CenterCardProps {
  id?: string;
  name: string;
  rating?: number;
  address: string;
  phone?: string;
  distance?: string;
  lat?: number;
  lng?: number;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
  onDoubleClick?: () => void;
}

export function CenterCard({
  id,
  name,
  rating,
  address,
  phone,
  distance,
  lat,
  lng,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onClick,
  onDoubleClick
}: CenterCardProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyPhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (phone && phone !== "Not Available") {
      navigator.clipboard.writeText(phone);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const openDirections = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lat && lng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(url, "_blank");
    }
  };

  return (
    <div
      id={id}
      className={cn(
        "flex w-full rounded-xl cursor-pointer box-border border-2 border-transparent outline-none transition-[background,border-color] duration-200 ease min-h-[110px] items-center justify-between",
        "focus:border-[#10b981] active:border-[#10b981] focus:outline-none hover:bg-[rgba(255,255,255,0.03)]",
        isHovered ? "bg-[rgba(255,255,255,0.03)] shadow-md" : "bg-card shadow-sm"
      )}
      style={{ padding: "20px", transform: "none" }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <div className="flex w-full flex-col">
        <div className="flex justify-between items-start gap-4">
          <h3 className="font-semibold text-lg text-foreground">
            {name}
          </h3>
          <div className="flex items-center gap-[10px] shrink-0">
            <button
              onClick={openDirections}
              disabled={!lat || !lng}
              aria-label="Get directions in Google Maps"
              title="Get directions"
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
                (!lat || !lng)
                  ? "opacity-50 cursor-not-allowed bg-muted"
                  : "bg-muted/50 hover:bg-muted cursor-pointer text-muted-foreground hover:text-foreground"
              )}
            >
              <Navigation className="w-4 h-4" />
            </button>
            <button
              onClick={handleCopyPhone}
              disabled={!phone || phone === "Not Available"}
              aria-label="Copy phone number"
              title={!phone || phone === "Not Available" ? "Phone number not available" : "Copy phone number"}
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
                (!phone || phone === "Not Available")
                  ? "opacity-50 cursor-not-allowed bg-muted"
                  : "bg-muted/50 hover:bg-muted cursor-pointer text-muted-foreground hover:text-foreground"
              )}
            >
              {isCopied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            {distance && (
              <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full whitespace-nowrap font-medium">
                {distance}
              </span>
            )}
          </div>
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
