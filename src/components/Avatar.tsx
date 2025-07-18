interface AvatarProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Avatar({ src, alt, size = 'md', className = '' }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-3xl'
  };

  // Check if it's an emoji (single character that's not http)
  const isEmoji = src && !src.startsWith('http') && src.length <= 2;
  
  if (isEmoji) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gray-100 flex items-center justify-center ${className}`}>
        <span>{src}</span>
      </div>
    );
  }

  return (
    <img
      src={src || '/default-avatar.png'}
      alt={alt}
      className={`${sizeClasses[size]} rounded-full ${className}`}
    />
  );
}
