// PulseAgent Avatar with animated pulse effect

interface TrustAgentAvatarProps {
  size?: 'small' | 'medium' | 'large';
  showPulse?: boolean;
}

export function TrustAgentAvatar({ size = 'medium', showPulse = false }: TrustAgentAvatarProps) {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16',
  };

  const iconSizes = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8',
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Avatar container */}
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg relative z-10`}>
        {/* Lightning bolt icon (Scend logo placeholder) */}
        <svg
          className={`${iconSizes[size]} text-white`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      </div>

      {/* Pulse ring animation */}
      {showPulse && (
        <>
          <span className="absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75 animate-ping"></span>
          <span className="absolute inline-flex h-full w-full rounded-full bg-purple-500 opacity-50 animate-ping animation-delay-150"></span>
        </>
      )}
    </div>
  );
}
