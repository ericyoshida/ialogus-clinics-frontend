import { cn } from "@/lib/utils";

type LeadTemperatureLevel = 1 | 2 | 3 | 4 | 5;

interface LeadTemperatureBarProps {
  level: LeadTemperatureLevel;
  className?: string;
}

/**
 * Lead temperature indicator with 5 segments
 * Levels:
 * 1: Gray - Cold lead
 * 2: Light green - Lukewarm lead
 * 3: Green - Warm lead
 * 4: Orange - Hot lead
 * 5: Red - Very hot lead
 */
export function LeadTemperatureBar({ level, className }: LeadTemperatureBarProps) {
  // Define colors for each level
  const getColorForLevel = (segmentLevel: number) => {
    if (segmentLevel > level) {
      return "bg-gray-200"; // Inactive segments
    }
    
    switch (segmentLevel) {
      case 1:
        return "bg-[#C4C4C4]"; // Gray
      case 2:
        return "bg-[#86CB92]"; // Light green
      case 3:
        return "bg-[#42B74A]"; // Green
      case 4:
        return "bg-[#F6B340]"; // Orange
      case 5:
        return "bg-[#E23C3C]"; // Red
      default:
        return "bg-gray-200";
    }
  };

  // Create an array of 5 segments
  const segments = [1, 2, 3, 4, 5];

  return (
    <div className={cn("flex gap-0.5 w-full max-w-full h-1.5 overflow-hidden", className)}>
      {segments.map((segment) => (
        <div
          key={segment}
          className={cn(
            "flex-1 rounded-sm h-1.5 min-w-0",
            getColorForLevel(segment)
          )}
        />
      ))}
    </div>
  );
} 