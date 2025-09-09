import { useEffect, useState } from 'react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

type EmojiCategory = {
  name: string;
  icon: string;
  emojis: string[];
};

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    name: 'Rostos',
    icon: '😀',
    emojis: [
      '😀', '😃', '😄', '😁', '😊', '😉', '😍', '🥰', '😘', '😗',
      '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓',
      '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁',
      '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
      '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥'
    ]
  },
  {
    name: 'Gestos',
    icon: '👍',
    emojis: [
      '👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙',
      '👈', '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋',
      '🖖', '👏', '🙌', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪'
    ]
  },
  {
    name: 'Corações',
    icon: '❤️',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️'
    ]
  },
  {
    name: 'Objetos',
    icon: '🔥',
    emojis: [
      '🔥', '⭐', '🌟', '✨', '⚡', '💫', '💥', '💢', '💨', '💤',
      '💯', '💸', '💰', '💎', '🏆', '🎉', '🎊', '🎈', '🎁', '🎀',
      '🌈', '☀️', '⛅', '☁️', '⛈️', '🌙', '🌸', '🌺', '🌻'
    ]
  },
  {
    name: 'Comida',
    icon: '🍎',
    emojis: [
      '🍎', '🍕', '🍔', '🌭', '🥪', '🌮', '🌯', '🥗', '🍝', '🍜',
      '🍲', '🍛', '🍣', '🍱', '🥟', '🍤', '🍙', '🍚', '🍘', '🍥',
      '☕', '🍵', '🧃', '🥤', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃'
    ]
  },
  {
    name: 'Animais',
    icon: '🐶',
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
      '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔'
    ]
  }
];

export function EmojiPicker({ onEmojiSelect, isOpen, onClose }: EmojiPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState(0);

  // Handle ESC key to close picker
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    onClose();
  };

  // If searching, show all matching emojis
  const currentEmojis = searchTerm
    ? EMOJI_CATEGORIES.flatMap(cat => cat.emojis).filter(emoji => 
        emoji.includes(searchTerm) || 
        EMOJI_CATEGORIES.find(cat => cat.emojis.includes(emoji))?.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : EMOJI_CATEGORIES[activeCategory].emojis;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Emoji Picker */}
      <div className="absolute bottom-12 right-2 z-50 bg-white border border-gray-200 rounded-lg shadow-lg w-80 max-h-96 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Escolher emoji</h3>
          <input
            type="text"
            placeholder="Buscar emoji..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {/* Category Tabs */}
        {!searchTerm && (
          <div className="flex border-b bg-gray-50">
            {EMOJI_CATEGORIES.map((category, index) => (
              <button
                key={index}
                onClick={() => setActiveCategory(index)}
                className={`flex-1 py-2 px-1 text-lg hover:bg-gray-100 transition-colors ${
                  activeCategory === index ? 'bg-blue-100 border-b-2 border-blue-500' : ''
                }`}
                title={category.name}
              >
                {category.icon}
              </button>
            ))}
          </div>
        )}
        
        {/* Emojis Grid */}
        <div className="p-2 max-h-64 overflow-y-auto">
          <div className="grid grid-cols-8 gap-1">
            {currentEmojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => handleEmojiClick(emoji)}
                className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 rounded transition-colors duration-150"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
          
          {currentEmojis.length === 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              Nenhum emoji encontrado
            </div>
          )}
        </div>
      </div>
    </>
  );
} 