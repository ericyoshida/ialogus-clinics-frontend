import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "../ui/avatar";

export type ConversationStatus = "agent" | "client" | "waiting" | "inactive";

interface AvatarWithStatusProps {
  name: string;
  avatarUrl?: string;
  status: ConversationStatus;
  className?: string;
}

/**
 * Avatar component with a status indicator overlay
 * Status values:
 * - "agent": Blue - Agent is chatting
 * - "client": Green - Client is responding
 * - "waiting": Yellow - Waiting for response (agent has already spoken)
 * - "inactive": Gray - Conversation is inactive
 */
export function AvatarWithStatus({
  name,
  avatarUrl,
  status,
  className,
}: AvatarWithStatusProps) {
  // Generate initials from name
  const initials = (name || "")
    .split(" ")
    .map((n) => n[0] || "")
    .join("")
    .toUpperCase();

  // Get status indicator color
  const getStatusColor = () => {
    switch (status) {
      case "agent":
        return "bg-[#1976D2]"; // Blue
      case "client":
        return "bg-[#2E7D32]"; // Green
      case "waiting":
        return "bg-[#F9A825]"; // Yellow
      case "inactive":
      default:
        return "bg-[#9E9E9E]"; // Gray
    }
  };

  // Generate a deterministic color based on the name
  const getAvatarColor = () => {
    if (!name) return "bg-ialogus-purple";
    
    // Hash the name to get a consistent number
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // List of vibrant background colors
    const colors = [
      "bg-rose-500",
      "bg-pink-500",
      "bg-fuchsia-500",
      "bg-purple-500",
      "bg-violet-500",
      "bg-indigo-500",
      "bg-blue-500",
      "bg-sky-500",
      "bg-cyan-500",
      "bg-teal-500",
      "bg-emerald-500",
      "bg-green-500",
      "bg-lime-500",
      "bg-yellow-500",
      "bg-amber-500",
      "bg-orange-500",
      "bg-red-500",
    ];
    
    // Use the hash to pick a color
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  };

  return (
    <div className={cn("relative", className)}>
      <Avatar>
        <AvatarFallback className={`${getAvatarColor()} text-white`}>
          {initials || "?"}
        </AvatarFallback>
      </Avatar>
      
      {/* Status indicator - positioned at top-left */}
      <div
        className={cn(
          "absolute -top-0.5 -left-0.5 w-2.5 h-2.5 rounded-full border-2 border-white",
          getStatusColor()
        )}
      />
    </div>
  );
} 