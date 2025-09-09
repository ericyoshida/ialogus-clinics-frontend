type TagsListProps = {
  tags: string[];
};

export function TagsList({ tags }: TagsListProps) {
  if (!tags?.length) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">Tags</h3>
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
} 