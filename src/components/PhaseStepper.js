import React from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowRightLeft, Gavel, CheckCircle } from 'lucide-react';
import { LEAGUE_PHASES, PHASE_ORDER } from '../utils/leaguePhaseUtils';

const PhaseStepper = ({ currentPhase, completedPhases = [] }) => {
  const phaseIcons = {
    'retention': Lock,
    'trading': ArrowRightLeft,
    'auction': Gavel
  };

  const getPhaseStatus = (phaseId) => {
    if (completedPhases.includes(phaseId)) return 'completed';
    if (currentPhase === phaseId) return 'active';
    return 'pending';
  };

  return (
    <div className="w-full">
      {/* Desktop Stepper */}
      <div className="hidden md:flex items-center justify-between gap-4 mb-6">
        {PHASE_ORDER.map((phase, index) => {
          const status = getPhaseStatus(phase.id);
          const Icon = phaseIcons[phase.id];
          
          return (
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center flex-1"
            >
              {/* Phase Item */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className={`flex-1 text-center`}
              >
                <motion.div
                  className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3 shadow-lg transition-all ${
                    status === 'completed'
                      ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white'
                      : status === 'active'
                      ? `bg-gradient-to-br ${phase.color} text-white shadow-2xl`
                      : 'bg-gray-300 text-gray-700'
                  }`}
                  animate={status === 'active' ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {status === 'completed' ? (
                    <CheckCircle size={32} />
                  ) : (
                    <Icon size={32} />
                  )}
                </motion.div>
                
                <h3 className={`font-bold text-sm md:text-base ${
                  status === 'active' ? 'text-gray-800' : 'text-gray-600'
                }`}>
                  {phase.emoji} {phase.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1">{phase.description}</p>
              </motion.div>

              {/* Connector */}
              {index < PHASE_ORDER.length - 1 && (
                <motion.div
                  className={`flex-1 h-1 mx-2 rounded-full ${
                    completedPhases.includes(phase.id)
                      ? 'bg-gradient-to-r from-emerald-500 to-green-600'
                      : currentPhase === phase.id || (index < PHASE_ORDER.findIndex(p => p.id === currentPhase))
                      ? `bg-gradient-to-r ${phase.color}`
                      : 'bg-gray-300'
                  }`}
                  animate={status === 'active' ? { opacity: [0.5, 1, 0.5] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Mobile Stepper */}
      <div className="md:hidden mb-6 space-y-3">
        {PHASE_ORDER.map((phase, index) => {
          const status = getPhaseStatus(phase.id);
          const Icon = phaseIcons[phase.id];
          
          return (
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-lg border-2 transition-all ${
                status === 'completed'
                  ? 'border-emerald-500 bg-emerald-50'
                  : status === 'active'
                  ? `border-opacity-100 bg-gradient-to-r ${phase.color} bg-opacity-10 border-opacity-100`
                  : 'border-gray-300 bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  status === 'completed'
                    ? 'bg-emerald-500 text-white'
                    : status === 'active'
                    ? `bg-gradient-to-br ${phase.color} text-white`
                    : 'bg-gray-300 text-gray-700'
                }`}>
                  {status === 'completed' ? (
                    <CheckCircle size={24} />
                  ) : (
                    <Icon size={24} />
                  )}
                </div>
                
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800">
                    {phase.emoji} {phase.name}
                  </h4>
                  <p className="text-sm text-gray-600">{phase.description}</p>
                </div>

                {status === 'active' && (
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-lg font-bold text-orange-500"
                  >
                    ●
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mb-4">
        <motion.div
          className={`h-full bg-gradient-to-r ${LEAGUE_PHASES[Object.keys(LEAGUE_PHASES).find(
            key => LEAGUE_PHASES[key].id === currentPhase
          )].color}`}
          initial={{ width: 0 }}
          animate={{ width: `${((PHASE_ORDER.findIndex(p => p.id === currentPhase) + 1) / PHASE_ORDER.length) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
};

export default PhaseStepper;
