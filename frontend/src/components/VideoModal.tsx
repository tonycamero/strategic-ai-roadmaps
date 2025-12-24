import { useEffect, useState } from 'react';
import { X, Play } from 'lucide-react';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoSrc: string;
  title: string;
}

export function VideoModal({ isOpen, onClose, videoSrc, title }: VideoModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/90 z-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <div className="relative w-full max-w-5xl">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          {/* Title */}
          <h3 className="text-white text-lg font-medium mb-3 text-center">
            {title}
          </h3>
          
          {/* Video Container */}
          <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl">
            <div className="aspect-video">
              <video
                src={videoSrc}
                controls
                autoPlay
                className="w-full h-full"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

interface VideoThumbnailProps {
  title: string;
  description?: string;
  videoSrc: string;
  thumbnailSrc?: string;
}

export function VideoThumbnail({ title, videoSrc, thumbnailSrc }: VideoThumbnailProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className="group relative cursor-pointer inline-block"
      >
        <div className="relative w-56 h-32 rounded-lg overflow-hidden border-2 border-slate-700 hover:border-blue-500 transition-all shadow-lg">
          {/* Thumbnail Image or Gradient */}
          {thumbnailSrc ? (
            <img 
              src={thumbnailSrc} 
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-950 to-slate-900" />
          )}
          
          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-all">
            <div className="w-14 h-14 rounded-full bg-blue-600/80 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 transition-all shadow-xl">
              <Play className="w-7 h-7 text-white fill-white ml-0.5" />
            </div>
          </div>
        </div>
        
        {/* Project Title and Watch Link */}
        <div className="mt-2 text-center">
          <p className="text-sm font-medium text-slate-300 mb-1">{title}</p>
          <span className="text-xs text-slate-400 group-hover:text-blue-400 transition-colors inline-flex items-center gap-1">
            Watch the Fun Promo Video
            <Play className="w-3 h-3" />
          </span>
        </div>
      </div>
      <VideoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        videoSrc={videoSrc}
        title={title}
      />
    </>
  );
}
