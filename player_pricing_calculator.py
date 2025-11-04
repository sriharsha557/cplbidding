#!/usr/bin/env python3
"""
CPL Player Pricing Calculator
Helps set fair base prices for auction players based on performance, experience, and market factors.
"""

import pandas as pd
import numpy as np
from pathlib import Path

class PlayerPricingCalculator:
    def __init__(self):
        # Base price ranges by role and performance
        self.base_prices = {
            'Batsman': {
                'Excellent': (50, 70),
                'Good': (30, 49),
                'Average': (15, 29),
                'Below Average': (8, 14),
                'Poor': (5, 7)
            },
            'Bowler': {
                'Excellent': (45, 65),
                'Good': (25, 44),
                'Average': (12, 24),
                'Below Average': (6, 11),
                'Poor': (4, 6)
            },
            'All-rounder': {
                'Excellent': (60, 80),
                'Good': (35, 59),
                'Average': (20, 34),
                'Below Average': (10, 19),
                'Poor': (6, 9)
            },
            'WicketKeeper': {
                'Excellent': (40, 60),
                'Good': (22, 39),
                'Average': (12, 21),
                'Below Average': (5, 11),
                'Poor': (3, 5)
            }
        }
        
        # Multipliers for different factors
        self.experience_multipliers = {
            'International': 1.25,
            'Domestic Star': 1.15,
            'Regular Domestic': 1.0,
            'Emerging': 0.9,
            'Unproven': 0.8
        }
        
        self.age_multipliers = {
            'Young (18-23)': 1.05,
            'Peak (24-30)': 1.0,
            'Veteran (31-35)': 0.95,
            'Old (35+)': 0.8
        }
        
        self.market_multipliers = {
            'Very High': 1.2,
            'High': 1.1,
            'Medium': 1.0,
            'Low': 0.9,
            'Very Low': 0.8
        }
        
        # Special skill bonuses (flat additions)
        self.special_bonuses = {
            'Captain': 15,
            'Death Bowling': 10,
            'Power Play Specialist': 8,
            'Excellent Fielder': 5,
            'Local Favorite': 8,
            'Versatile': 6,
            'Match Winner': 12,
            'Injury Risk': -10,
            'Attitude Issues': -8
        }

    def get_age_category(self, age):
        """Convert age to category"""
        if age <= 23:
            return 'Young (18-23)'
        elif age <= 30:
            return 'Peak (24-30)'
        elif age <= 35:
            return 'Veteran (31-35)'
        else:
            return 'Old (35+)'

    def calculate_base_price(self, role, performance, age, experience, market_demand, special_skills=None):
        """Calculate base price for a player"""
        if special_skills is None:
            special_skills = []
            
        # Get base price range and take midpoint
        price_range = self.base_prices.get(role, {}).get(performance)
        if not price_range:
            return None, f"Invalid role '{role}' or performance '{performance}'"
        
        base_price = (price_range[0] + price_range[1]) / 2
        
        # Apply multipliers
        final_price = base_price
        
        # Experience multiplier
        exp_multiplier = self.experience_multipliers.get(experience, 1.0)
        final_price *= exp_multiplier
        
        # Age multiplier
        age_category = self.get_age_category(age)
        age_multiplier = self.age_multipliers.get(age_category, 1.0)
        final_price *= age_multiplier
        
        # Market demand multiplier
        market_multiplier = self.market_multipliers.get(market_demand, 1.0)
        final_price *= market_multiplier
        
        # Add special skills bonuses
        skills_bonus = sum(self.special_bonuses.get(skill, 0) for skill in special_skills)
        final_price += skills_bonus
        
        # Round to nearest 5 and ensure minimum of 5
        final_price = max(5, round(final_price / 5) * 5)
        
        # Create breakdown
        breakdown = {
            'base_price': round(base_price),
            'experience_adj': round(base_price * (exp_multiplier - 1)),
            'age_adj': round(base_price * (age_multiplier - 1)),
            'market_adj': round(base_price * (market_multiplier - 1)),
            'skills_bonus': skills_bonus,
            'final_price': int(final_price)
        }
        
        return int(final_price), breakdown

    def process_excel_file(self, input_file, output_file=None):
        """Process an Excel file with player data and calculate base prices"""
        try:
            # Read the Excel file
            df = pd.read_excel(input_file)
            
            # Required columns
            required_cols = ['Name', 'Role', 'Age', 'Performance', 'Experience', 'Market_Demand']
            missing_cols = [col for col in required_cols if col not in df.columns]
            
            if missing_cols:
                return False, f"Missing required columns: {missing_cols}"
            
            # Calculate prices for each player
            results = []
            for idx, row in df.iterrows():
                # Parse special skills if provided
                special_skills = []
                if 'Special_Skills' in df.columns and pd.notna(row['Special_Skills']):
                    special_skills = [skill.strip() for skill in str(row['Special_Skills']).split(',')]
                
                # Calculate price
                price, breakdown = self.calculate_base_price(
                    role=row['Role'],
                    performance=row['Performance'],
                    age=row['Age'],
                    experience=row['Experience'],
                    market_demand=row['Market_Demand'],
                    special_skills=special_skills
                )
                
                if price is None:
                    results.append({
                        'Name': row['Name'],
                        'Error': breakdown,
                        'Calculated_Base_Price': 0
                    })
                else:
                    results.append({
                        'Name': row['Name'],
                        'Role': row['Role'],
                        'Age': row['Age'],
                        'Performance': row['Performance'],
                        'Experience': row['Experience'],
                        'Market_Demand': row['Market_Demand'],
                        'Special_Skills': ', '.join(special_skills) if special_skills else '',
                        'Base_Price_Range': f"{self.base_prices[row['Role']][row['Performance']][0]}-{self.base_prices[row['Role']][row['Performance']][1]}",
                        'Calculated_Base_Price': price,
                        'Price_Breakdown': str(breakdown)
                    })
            
            # Create results DataFrame
            results_df = pd.DataFrame(results)
            
            # Save to file if specified
            if output_file:
                results_df.to_excel(output_file, index=False)
                print(f"Results saved to {output_file}")
            
            return True, results_df
            
        except Exception as e:
            return False, f"Error processing file: {str(e)}"

    def create_sample_template(self, filename="player_pricing_template.xlsx"):
        """Create a sample Excel template for player data entry"""
        sample_data = {
            'Name': [
                'John Smith', 'Mike Johnson', 'David Wilson', 'Chris Brown', 'Alex Davis'
            ],
            'Role': [
                'Batsman', 'Bowler', 'All-rounder', 'WicketKeeper', 'Batsman'
            ],
            'Age': [28, 25, 32, 24, 22],
            'Performance': [
                'Excellent', 'Good', 'Good', 'Average', 'Emerging'
            ],
            'Experience': [
                'International', 'Domestic Star', 'Regular Domestic', 'Emerging', 'Unproven'
            ],
            'Market_Demand': [
                'Very High', 'High', 'Medium', 'Low', 'High'
            ],
            'Special_Skills': [
                'Captain, Match Winner', 'Death Bowling', 'Versatile', '', 'Local Favorite'
            ],
            'Notes': [
                'Star opener, consistent performer',
                'Fast bowler, good in death overs',
                'Experienced all-rounder, good captain',
                'Young keeper, needs development',
                'Promising young batsman'
            ]
        }
        
        df = pd.DataFrame(sample_data)
        df.to_excel(filename, index=False)
        print(f"Sample template created: {filename}")
        
        # Also create a guide sheet
        guide_data = {
            'Field': [
                'Performance', 'Performance', 'Performance', 'Performance', 'Performance',
                'Experience', 'Experience', 'Experience', 'Experience', 'Experience',
                'Market_Demand', 'Market_Demand', 'Market_Demand', 'Market_Demand', 'Market_Demand',
                'Special_Skills', 'Special_Skills', 'Special_Skills', 'Special_Skills', 'Special_Skills'
            ],
            'Valid_Values': [
                'Excellent', 'Good', 'Average', 'Below Average', 'Poor',
                'International', 'Domestic Star', 'Regular Domestic', 'Emerging', 'Unproven',
                'Very High', 'High', 'Medium', 'Low', 'Very Low',
                'Captain (+15)', 'Death Bowling (+10)', 'Power Play Specialist (+8)', 'Excellent Fielder (+5)', 'Local Favorite (+8)'
            ],
            'Description': [
                'Match winner, consistent high performer', 'Reliable performer, occasional match winner',
                'Squad player, decent contributor', 'Backup option, limited impact', 'Emergency option only',
                '50+ international matches', '100+ domestic matches, well-known',
                'Regular first-team player', 'Some experience, showing promise', 'New/limited experience',
                'Scarce skill, multiple teams need', 'In-demand position/skill',
                'Balanced supply/demand', 'Oversupply in market', 'Limited need',
                'Leadership bonus', 'Specialist death bowler', 'Power play specialist',
                'Great fielding skills', 'Fan following bonus'
            ]
        }
        
        guide_df = pd.DataFrame(guide_data)
        
        # Save both sheets
        with pd.ExcelWriter(filename, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Player_Data', index=False)
            guide_df.to_excel(writer, sheet_name='Field_Guide', index=False)
        
        print(f"Template with guide created: {filename}")
        return filename

def main():
    """Main function for command-line usage"""
    calculator = PlayerPricingCalculator()
    
    print("CPL Player Pricing Calculator")
    print("=" * 40)
    
    while True:
        print("\nOptions:")
        print("1. Create sample template")
        print("2. Process existing Excel file")
        print("3. Calculate single player price")
        print("4. Exit")
        
        choice = input("\nEnter your choice (1-4): ").strip()
        
        if choice == '1':
            filename = input("Enter template filename (default: player_pricing_template.xlsx): ").strip()
            if not filename:
                filename = "player_pricing_template.xlsx"
            calculator.create_sample_template(filename)
            
        elif choice == '2':
            input_file = input("Enter input Excel filename: ").strip()
            if not Path(input_file).exists():
                print(f"File {input_file} not found!")
                continue
                
            output_file = input("Enter output filename (optional): ").strip()
            if not output_file:
                output_file = None
                
            success, result = calculator.process_excel_file(input_file, output_file)
            if success:
                print("\nProcessing completed successfully!")
                print(result.head())
            else:
                print(f"Error: {result}")
                
        elif choice == '3':
            print("\nEnter player details:")
            name = input("Player name: ")
            role = input("Role (Batsman/Bowler/All-rounder/WicketKeeper): ")
            age = int(input("Age: "))
            performance = input("Performance (Excellent/Good/Average/Below Average/Poor): ")
            experience = input("Experience (International/Domestic Star/Regular Domestic/Emerging/Unproven): ")
            market_demand = input("Market Demand (Very High/High/Medium/Low/Very Low): ")
            
            skills_input = input("Special Skills (comma-separated, optional): ").strip()
            special_skills = [skill.strip() for skill in skills_input.split(',')] if skills_input else []
            
            price, breakdown = calculator.calculate_base_price(
                role, performance, age, experience, market_demand, special_skills
            )
            
            if price:
                print(f"\n{name} - Calculated Base Price: {price} tokens")
                print("Breakdown:", breakdown)
            else:
                print(f"Error: {breakdown}")
                
        elif choice == '4':
            print("Goodbye!")
            break
            
        else:
            print("Invalid choice. Please try again.")

if __name__ == "__main__":
    main()