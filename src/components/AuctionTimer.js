import React, { useState, useEffect } from 'react';
import { Clock, Play, Pause, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

const AuctionTimer = ({ 
  isActive, 
  onTimeUp, 
  duration = 60, 
  onStart, 
  onPause, 
  onReset 
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval = null;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            setIsRunning(false);
            onTimeUp && onTimeUp();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    } else if (!isRunning) {
      clearInterval(interval);
    }
    
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onTimeUp]);

  const handleStart = () => {
    setIsRunning(true);
    onStart && onStart();
  };

  const handlePause = () => {
    setIsRunning(false);
    onPause && onPause();
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(duration);
    onReset && onReset();
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const percentage = ((duration - timeLeft) / duration) * 100;

  const getTimerColor = () => {
    if (timeLeft <= 10) return 'text-red-500';
    if (timeLeft <= 30) return 'text-orange-500';
    return 'text-teal-600';
  };

  const getProgressColor = () => {
    if (timeLeft <= 10) return 'from-red-500 to-red-600';
    if (timeLeft <= 30) return 'from-orange-500 to-orange-600';
    return 'from-teal-500 to-teal-600';
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Clock size={24} className="text-teal-600" />
          <h3 className="text-lg font-semibold text-gray-800">Auction Timer</h3>
        </div>

        {/* Circular Progress */}
        <div className="relative w-32 h-32 mx-auto mb-4">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-gray-200"
            />
            {/* Progress circle */}
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              stroke="url(#gradient)"
              strokeWidth="8"
              fill="transparent"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - percentage / 100)}`}
              className="transition-all duration-1000 ease-linear"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" className={getProgressColor().split(' ')[0].replace('from-', 'stop-')} />
                <stop offset="100%" className={getProgressColor().split(' ')[1].replace('to-', 'stop-')} />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Timer display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={timeLeft <= 10 && isRunning ? { scale: [1, 1.1, 1] } : { scale: 1 }}
              transition={{ duration: 1, repeat: timeLeft <= 10 && isRunning ? Infinity : 0 }}
              className={`text-2xl font-bold ${getTimerColor()}`}
            >
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </motion.div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-2">
          {!isRunning ? (
            <button
              onClick={handleStart}
              disabled={timeLeft === 0}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Play size={16} />
              Start
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Pause size={16} />
              Pause
            </button>
          )}
          
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>

        {/* Status */}
        <div className="mt-3 text-sm text-gray-600">
          {timeLeft === 0 ? (
            <span className="text-red-600 font-semibold">⏰ Time's Up!</span>
          ) : isRunning ? (
            <span className="text-teal-600">🔴 Timer Running</span>
          ) : (
            <span className="text-gray-500">⏸️ Timer Paused</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuctionTimer;