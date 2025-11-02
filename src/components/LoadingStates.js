import React from 'react';
import { motion } from 'framer-motion';

export const SkeletonCard = ({ className = "" }) => (
  <div className={`animate-pulse ${className}`}>
    <div className="bg-gray-300 rounded-lg h-4 w-3/4 mb-2"></div>
    <div className="bg-gray-300 rounded-lg h-4 w-1/2 mb-2"></div>
    <div className="bg-gray-300 rounded-lg h-4 w-2/3"></div>
  </div>
);

export const PlayerCardSkeleton = () => (
  <div className="player-card rounded-xl p-6 animate-pulse">
    <div className="text-center mb-4">
      <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-white/30"></div>
      <div className="h-8 bg-white/30 rounded mb-2"></div>
      <div className="h-6 bg-white/30 rounded mb-2 w-3/4 mx-auto"></div>
      <div className="h-6 bg-white/30 rounded w-1/2 mx-auto"></div>
    </div>
  </div>
);

export const TeamDashboardSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="team-card rounded-lg p-4 animate-pulse">
        <div className="text-center mb-3">
          <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-white/30"></div>
          <div className="h-6 bg-white/30 rounded mb-2"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-white/30 rounded"></div>
          <div className="h-4 bg-white/30 rounded w-3/4"></div>
          <div className="h-4 bg-white/30 rounded w-1/2"></div>
        </div>
      </div>
    ))}
  </div>
);

export const LoadingSpinner = ({ size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={`${sizeClasses[size]} ${className}`}
    >
      <svg className="w-full h-full text-teal-600" fill="none" viewBox="0 0 24 24">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </motion.div>
  );
};

export const PulseLoader = ({ className = "" }) => (
  <div className={`flex space-x-2 ${className}`}>
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          delay: i * 0.2
        }}
        className="w-3 h-3 bg-teal-600 rounded-full"
      />
    ))}
  </div>
);