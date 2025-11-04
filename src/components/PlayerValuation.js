import React, { useState } from 'react';
import { Calculator } from 'lucide-react';

const PlayerValuation = ({ onPriceCalculated }) => {
  const [playerData, setPlayerData] = useState({
    name: '',
    role: 'Batsman',
    age: 25,
    experience: 'Domestic',
    performance: 'Good',
    fitness: 'Excellent',
    marketDemand: 'Medium',
    specialSkills: []
  });

  const [calculatedPrice, setCalculatedPrice] = useState(null);

  // Base price ranges by role and performance
  const basePrices = {
    'Batsman': {
      'Excellent': { min: 50, max: 70 },
      'Good': { min: 30, max: 49 },
      'Average': { min: 15, max: 29 },
      'Poor': { min: 8, max: 14 }
    },
    'Bowler': {
      'Excellent': { min: 45, max: 65 },
      'Good': { min: 25, max: 44 },
      'Average': { min: 12, max: 24 },
      'Poor': { min: 6, max: 11 }
    },
    'All-rounder': {
      'Excellent': { min: 60, max: 80 },
      'Good': { min: 35, max: 59 },
      'Average': { min: 20, max: 34 },
      'Poor': { min: 10, max: 19 }
    },
    'WicketKeeper': {
      'Excellent': { min: 40, max: 60 },
      'Good': { min: 22, max: 39 },
      'Average': { min: 12, max: 21 },
      'Poor': { min: 5, max: 11 }
    }
  };

  // Multipliers for different factors
  const experienceMultipliers = {
    'International': 1.25,
    'Domestic Star': 1.15,
    'Domestic': 1.0,
    'Emerging': 0.9,
    'Unproven': 0.8
  };

  const ageMultipliers = {
    '18-23': 1.05, // Young potential
    '24-30': 1.0,  // Peak age
    '31-35': 0.95, // Veteran
    '35+': 0.8     // Old
  };

  const fitnessMultipliers = {
    'Excellent': 1.0,
    'Good': 0.95,
    'Average': 0.9,
    'Poor': 0.8,
    'Injury Prone': 0.75
  };

  const marketDemandMultipliers = {
    'Very High': 1.2,
    'High': 1.1,
    'Medium': 1.0,
    'Low': 0.9,
    'Very Low': 0.8
  };

  const specialSkillsBonuses = {
    'Captain': 15,
    'Death Bowling': 10,
    'Power Play Specialist': 8,
    'Excellent Fielder': 5,
    'Local Favorite': 8,
    'Versatile': 6,
    'Match Winner': 12
  };

  const calculateBasePrice = () => {
    // Get base price range
    const baseRange = basePrices[playerData.role][playerData.performance];
    const basePrice = (baseRange.min + baseRange.max) / 2;

    // Apply multipliers
    let finalPrice = basePrice;
    
    // Experience multiplier
    finalPrice *= experienceMultipliers[playerData.experience];
    
    // Age multiplier
    const ageGroup = playerData.age <= 23 ? '18-23' : 
                     playerData.age <= 30 ? '24-30' : 
                     playerData.age <= 35 ? '31-35' : '35+';
    finalPrice *= ageMultipliers[ageGroup];
    
    // Fitness multiplier
    finalPrice *= fitnessMultipliers[playerData.fitness];
    
    // Market demand multiplier
    finalPrice *= marketDemandMultipliers[playerData.marketDemand];
    
    // Add special skills bonuses
    const skillsBonus = playerData.specialSkills.reduce((total, skill) => {
      return total + (specialSkillsBonuses[skill] || 0);
    }, 0);
    
    finalPrice += skillsBonus;
    
    // Round to nearest 5
    finalPrice = Math.round(finalPrice / 5) * 5;
    
    // Ensure minimum price of 5
    finalPrice = Math.max(5, finalPrice);
    
    setCalculatedPrice({
      basePrice: Math.round(basePrice),
      finalPrice: finalPrice,
      breakdown: {
        base: Math.round(basePrice),
        experience: Math.round(basePrice * (experienceMultipliers[playerData.experience] - 1)),
        age: Math.round(basePrice * (ageMultipliers[ageGroup] - 1)),
        fitness: Math.round(basePrice * (fitnessMultipliers[playerData.fitness] - 1)),
        market: Math.round(basePrice * (marketDemandMultipliers[playerData.marketDemand] - 1)),
        skills: skillsBonus
      }
    });

    if (onPriceCalculated) {
      onPriceCalculated({
        ...playerData,
        basePrice: finalPrice
      });
    }
  };

  const handleSpecialSkillToggle = (skill) => {
    setPlayerData(prev => ({
      ...prev,
      specialSkills: prev.specialSkills.includes(skill)
        ? prev.specialSkills.filter(s => s !== skill)
        : [...prev.specialSkills, skill]
    }));
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="text-blue-600" size={24} />
        <h3 className="text-xl font-bold text-gray-800">Player Valuation Calculator</h3>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Player Name
            </label>
            <input
              type="text"
              value={playerData.name}
              onChange={(e) => setPlayerData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter player name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={playerData.role}
              onChange={(e) => setPlayerData(prev => ({ ...prev, role: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Batsman">Batsman 🏏</option>
              <option value="Bowler">Bowler 🎯</option>
              <option value="All-rounder">All-rounder ⚡</option>
              <option value="WicketKeeper">Wicket Keeper 🧤</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age
            </label>
            <input
              type="number"
              min="18"
              max="45"
              value={playerData.age}
              onChange={(e) => setPlayerData(prev => ({ ...prev, age: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Experience Level
            </label>
            <select
              value={playerData.experience}
              onChange={(e) => setPlayerData(prev => ({ ...prev, experience: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="International">International (50+ matches)</option>
              <option value="Domestic Star">Domestic Star (100+ matches)</option>
              <option value="Domestic">Domestic (Regular player)</option>
              <option value="Emerging">Emerging (Limited experience)</option>
              <option value="Unproven">Unproven (New player)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Performance Level
            </label>
            <select
              value={playerData.performance}
              onChange={(e) => setPlayerData(prev => ({ ...prev, performance: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Excellent">Excellent (Match winner)</option>
              <option value="Good">Good (Consistent performer)</option>
              <option value="Average">Average (Squad player)</option>
              <option value="Poor">Poor (Backup option)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fitness Status
            </label>
            <select
              value={playerData.fitness}
              onChange={(e) => setPlayerData(prev => ({ ...prev, fitness: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Average">Average</option>
              <option value="Poor">Poor</option>
              <option value="Injury Prone">Injury Prone</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Market Demand
            </label>
            <select
              value={playerData.marketDemand}
              onChange={(e) => setPlayerData(prev => ({ ...prev, marketDemand: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Very High">Very High (Scarce skill)</option>
              <option value="High">High (In demand)</option>
              <option value="Medium">Medium (Balanced)</option>
              <option value="Low">Low (Oversupply)</option>
              <option value="Very Low">Very Low (Limited need)</option>
            </select>
          </div>

          {/* Special Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Skills (Select all that apply)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(specialSkillsBonuses).map(skill => (
                <label key={skill} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={playerData.specialSkills.includes(skill)}
                    onChange={() => handleSpecialSkillToggle(skill)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{skill}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={calculateBasePrice}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Calculator size={20} />
            Calculate Base Price
          </button>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {calculatedPrice && (
            <>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {calculatedPrice.finalPrice} Tokens
                  </div>
                  <div className="text-sm text-gray-600">
                    Recommended Base Price
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Base Price:</span>
                    <span className="font-medium">{calculatedPrice.breakdown.base} tokens</span>
                  </div>
                  
                  {calculatedPrice.breakdown.experience !== 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Experience Adj:</span>
                      <span className={`font-medium ${calculatedPrice.breakdown.experience > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {calculatedPrice.breakdown.experience > 0 ? '+' : ''}{calculatedPrice.breakdown.experience}
                      </span>
                    </div>
                  )}
                  
                  {calculatedPrice.breakdown.age !== 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Age Factor:</span>
                      <span className={`font-medium ${calculatedPrice.breakdown.age > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {calculatedPrice.breakdown.age > 0 ? '+' : ''}{calculatedPrice.breakdown.age}
                      </span>
                    </div>
                  )}
                  
                  {calculatedPrice.breakdown.fitness !== 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Fitness Adj:</span>
                      <span className={`font-medium ${calculatedPrice.breakdown.fitness > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {calculatedPrice.breakdown.fitness > 0 ? '+' : ''}{calculatedPrice.breakdown.fitness}
                      </span>
                    </div>
                  )}
                  
                  {calculatedPrice.breakdown.market !== 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Market Demand:</span>
                      <span className={`font-medium ${calculatedPrice.breakdown.market > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {calculatedPrice.breakdown.market > 0 ? '+' : ''}{calculatedPrice.breakdown.market}
                      </span>
                    </div>
                  )}
                  
                  {calculatedPrice.breakdown.skills > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Special Skills:</span>
                      <span className="font-medium text-green-600">
                        +{calculatedPrice.breakdown.skills}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Price Range Guidance */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Price Range Guidance</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Minimum: {basePrices[playerData.role][playerData.performance].min} tokens</div>
                  <div>Maximum: {basePrices[playerData.role][playerData.performance].max} tokens</div>
                  <div>Calculated: {calculatedPrice.finalPrice} tokens</div>
                </div>
              </div>

              {/* Market Context */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Market Context</h4>
                <div className="text-sm text-yellow-700">
                  {playerData.role} with {playerData.performance.toLowerCase()} performance typically sells for {basePrices[playerData.role][playerData.performance].min}-{basePrices[playerData.role][playerData.performance].max} tokens in current market conditions.
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerValuation;