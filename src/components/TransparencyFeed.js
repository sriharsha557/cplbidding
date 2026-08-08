import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ArrowRight, Users, TrendingUp } from 'lucide-react';

const TransparencyFeed = ({
  currentPhase = 'retention',
  auctionHistory = [],
  retentionEvents = [],
  tradingEvents = []
}) => {
  const [displayEvents, setDisplayEvents] = useState([]);

  useEffect(() => {
    let events = [];

    if (currentPhase === 'retention') {
      events = retentionEvents.slice(0, 5).map(event => ({
        id: `retention-${event.id || Math.random()}`,
        type: 'retention',
        icon: '🔒',
        title: `${event.teamName} retained ${event.playerName}`,
        subtitle: `for ${event.price} tokens`,
        timestamp: event.timestamp || new Date(),
        emoji: '🔒',
        color: 'from-red-500 to-orange-500'
      }));
    } else if (currentPhase === 'trading') {
      events = tradingEvents.slice(0, 5).map(event => ({
        id: `trading-${event.id || Math.random()}`,
        type: 'trading',
        icon: '🔁',
        title: `${event.fromTeam} traded ${event.playerName} to ${event.toTeam}`,
        subtitle: event.compensation ? `in exchange for ${event.compensation}` : 'straight trade',
        timestamp: event.timestamp || new Date(),
        emoji: '🔁',
        color: 'from-blue-500 to-cyan-500'
      }));
    } else {
      // Auction phase - show recent sales
      events = auctionHistory.slice(-5).reverse().map((event, idx) => ({
        id: `auction-${idx}`,
        type: 'auction',
        icon: '💰',
        title: `${event.Player} sold to ${event.Team}`,
        subtitle: `for 🪙 ${event.SoldPrice} tokens (${event.Role})`,
        timestamp: event.timestamp || new Date(),
        emoji: '🔨',
        color: 'from-green-500 to-emerald-500'
      }));
    }

    setDisplayEvents(events);
  }, [currentPhase, auctionHistory, retentionEvents, tradingEvents]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <TrendingUp size={28} className="text-teal-600" />
        Live Activity
      </h2>

      {displayEvents.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gray-50 rounded-lg p-8 text-center border-2 border-dashed border-gray-300"
        >
          <Users size={48} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 text-lg">No activity yet</p>
          <p className="text-gray-500 text-sm">
            {currentPhase === 'retention' && 'Waiting for teams to submit retentions...'}
            {currentPhase === 'trading' && 'Waiting for trade proposals...'}
            {currentPhase === 'auction' && 'Waiting for auction to start...'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="wait">
            {displayEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, x: 10 }}
                className={`bg-gradient-to-r ${event.color} bg-opacity-10 rounded-lg p-4 border-l-4 border-opacity-50 hover:shadow-lg transition-all cursor-pointer group`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon/Emoji */}
                  <motion.div
                    className="text-3xl flex-shrink-0 mt-1"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {event.emoji}
                  </motion.div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <motion.h3
                      className="font-bold text-gray-800 text-sm md:text-base truncate group-hover:text-teal-700 transition-colors"
                    >
                      {event.title}
                    </motion.h3>
                    <p className="text-xs md:text-sm text-gray-600 truncate">
                      {event.subtitle}
                    </p>
                  </div>

                  {/* Time Badge */}
                  <motion.div
                    className="flex-shrink-0 text-xs bg-white bg-opacity-50 rounded-full px-3 py-1 font-semibold text-gray-700"
                    whileHover={{ scale: 1.1 }}
                  >
                    now
                  </motion.div>
                </div>

                {/* Hover accent */}
                <motion.div
                  className={`absolute inset-0 rounded-lg bg-gradient-to-r ${event.color} opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none`}
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 0.1 }}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Load More Button */}
          {displayEvents.length >= 5 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors"
            >
              View All Activity →
            </motion.button>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default TransparencyFeed;
