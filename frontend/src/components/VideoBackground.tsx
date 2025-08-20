'use client';

import { useEffect, useRef } from 'react';

interface VideoBackgroundProps {
  children: React.ReactNode;
}

export default function VideoBackground({ children }: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Ensure video plays when component mounts
    if (videoRef.current) {
      videoRef.current.play().catch(console.error);
    }
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Video */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="fixed w-full h-full object-cover z-[-1]"
        style={{ top: 0, left: 0 }}
      >
        <source src="/earth.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Content */}
      {children}
    </div>
  );
}
