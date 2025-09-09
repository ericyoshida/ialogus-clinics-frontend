import { SmsIcon } from "@/components/icons/SmsIconNew";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface Conversation {
  id: string;
  contactName: string;
  lastMessage: string;
  timestamp: string;
  avatar?: string;
  unread: boolean;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
}

export function ConversationList({
  conversations = [],
  selectedConversationId,
  onSelectConversation,
}: ConversationListProps) {
  // Ensure conversations is an array
  const safeConversations = Array.isArray(conversations) ? conversations : [];
  
  return (
    <div className="flex flex-col gap-1 py-2">
      {safeConversations.map((conversation) => (
        <div
          key={conversation.id}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800",
            selectedConversationId === conversation.id &&
              "bg-gray-100 dark:bg-gray-800"
          )}
          onClick={() => onSelectConversation(conversation.id)}
        >
          <Avatar>
            {conversation.avatar ? (
              <AvatarImage src={conversation.avatar} alt={conversation.contactName} />
            ) : null}
            <AvatarFallback>
              {conversation.contactName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center">
              <p className="font-medium truncate">{conversation.contactName}</p>
              <p className="text-xs text-gray-500 whitespace-nowrap ml-2">
                {conversation.timestamp}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {conversation.unread && (
                <SmsIcon className="h-4 w-4" />
              )}
              <p className="text-sm text-gray-500 truncate">
                {conversation.lastMessage}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 