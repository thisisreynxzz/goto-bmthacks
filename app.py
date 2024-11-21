from flask import Flask, request, Response, jsonify
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv
import os
import json
from typing import Dict, Optional, List
import pandas as pd
from datetime import datetime
import uuid

load_dotenv()

app = Flask(__name__)
CORS(app)

client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

class UserContextManager:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self._load_user_data()

    def _load_user_data(self):
        try:
            self.user_data = pd.read_csv(self.db_path, dtype={'customer_id': str})
        except FileNotFoundError:
            raise FileNotFoundError(f"User data file not found at {self.db_path}")

    def get_user_context(self, customer_id: str) -> Dict:
        """Get context for specific user"""
        user = self.user_data[self.user_data['customer_id'] == customer_id]
        if user.empty:
            raise ValueError(f"User {customer_id} not found")
            
        return {
            'customer_id': customer_id,
            'promotions': {
                'food': user.iloc[0]['food_treatment'],
                'ride': user.iloc[0]['ride_treatment'],
                'car': user.iloc[0]['car_treatment']
            },
            'payment_preferences': {
                'rank_1': user.iloc[0]['rank_1_uc'],
                'rank_2': user.iloc[0]['rank_2_uc'],
                'rank_3': user.iloc[0]['rank_3_uc']
            },
            'favorite_places': {
                'ride': user.iloc[0]['RIDE_PREDICTION_PLACE'],
                'car': user.iloc[0]['CAR_PREDICTION_PLACE'],
                'food': user.iloc[0]['FOOD_PREDICTION_PLACE']
            },
            'completed_quests': int(user.iloc[0]['completed_quests']),
            'quest_completion_rate': float(user.iloc[0]['quest_completion_rate']),
            'last_quest_date': user.iloc[0]['last_quest_date']
        }

    def update_user_stats(self, customer_id: str, quest_completed: bool):
        """Update user statistics after quest completion"""
        customer_id = str(customer_id)
        user_idx = self.user_data.index[self.user_data['customer_id'] == customer_id].tolist()[0]
        
        self.user_data.at[user_idx, 'completed_quests'] += 1 if quest_completed else 0
        total_quests = self.user_data.at[user_idx, 'completed_quests']
        self.user_data.at[user_idx, 'quest_completion_rate'] = \
            (total_quests / (total_quests + (0 if quest_completed else 1))) * 100
        self.user_data.at[user_idx, 'last_quest_date'] = datetime.now().isoformat()
        
        self.user_data.to_csv(self.db_path, index=False)

class QuestLogger:
    def __init__(self, log_path: str):
        self.log_path = log_path
        self._initialize_log()

    def _initialize_log(self):
        os.makedirs(os.path.dirname(self.log_path), exist_ok=True)
        try:
            self.quest_log = pd.read_csv(self.log_path)
        except FileNotFoundError:
            self.quest_log = pd.DataFrame(columns=[
                'quest_id', 'customer_id', 'timestamp', 'status',
                'quest_data'
            ])
            self.quest_log.to_csv(self.log_path, index=False)

    def log_quest(self, customer_id: str, quest_data: Dict, status: str = 'generated'):
        new_entry = pd.DataFrame([{
            'quest_id': quest_data.get('quest_id', str(uuid.uuid4())),
            'customer_id': customer_id,
            'timestamp': datetime.now().isoformat(),
            'status': status,
            'quest_data': json.dumps(quest_data)
        }])
        
        self.quest_log = pd.concat([self.quest_log, new_entry], ignore_index=True)
        self.quest_log.to_csv(self.log_path, index=False)

class GPTQuestGenerator:
    def __init__(self, user_context_manager: UserContextManager, quest_logger: QuestLogger):
        self.user_context_manager = user_context_manager
        self.quest_logger = quest_logger
        self.client = client

    def generate_quest(self, customer_id: str) -> Optional[Dict]:
        try:
            user_context = self.user_context_manager.get_user_context(customer_id)
        except ValueError as e:
            print(f"Error getting user context: {str(e)}")
            return None
        
        prompt = f"""
        Generate a personalized gamified quest, at least 5 quest, for customer {customer_id} with context:

        Payment Preferences (all of this should be called GoPay):
        1. {user_context['payment_preferences']['rank_1']}
        2. {user_context['payment_preferences']['rank_2']}
        3. {user_context['payment_preferences']['rank_3']}

        Available Promotions:
        - GoFood: {user_context['promotions']['food']}
        - GoRide: {user_context['promotions']['ride']}
        - GoCar: {user_context['promotions']['car']}

        Favorite Places:
        - GoRide frequent destination: {user_context['favorite_places']['ride'] if user_context['favorite_places']['ride'] != 'null' else 'Not available'}
        - GoCar frequent destination: {user_context['favorite_places']['car'] if user_context['favorite_places']['car'] != 'null' else 'Not available'}
        - Favorite restaurants: {user_context['favorite_places']['food'] if user_context['favorite_places']['food'] != 'null' else 'Not available'}

        Create an engaging quest that:
        1. Incorporates available promotions into quest objectives, matching each platform's specific voucher
        2. Uses their preferred payment methods for GoPay-related tasks
        3. Includes location-based challenges using their frequent destinations
        4. Suggests food orders from their favorite restaurants when applicable
        5. Adapts difficulty based on their completion rate
        6. Combines transport and food tasks in a logical sequence
        7. Creates a narrative that connects their usual locations with food preferences
        
        Return ONLY a JSON object with structure:
        {{
            "quest_id": "unique_identifier",
            "title": "quest_title",
            "narrative": "story_description",
            "type": "quest_type",
            "difficulty": "level",
            "duration": "time_to_complete",
            "objectives": [
                {{
                    "id": "objective_id",
                    "platform": "platform_name",
                    "description": "objective_description",
                    "points": points_value,
                    "required": boolean,
                    "location": "location_name",
                    "promotion": "promotion_code"
                }}
            ],
            "rewards": {{
                "xp": xp_value,
                "vouchers": ["voucher_code"],
                "achievements": ["achievement"]
            }},
            "game_rules": ["rule"],
            "progress_tracking": {{
                "metrics": ["metric"],
                "milestones": [
                    {{
                        "threshold": value,
                        "reward": "reward_description"
                    }}
                ]
            }}
        }}
        """

        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a creative game designer specializing in personalized quests for GoTo Ecosystem (GoJek & GoPay)."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7
            )
            
            quest_data = json.loads(response.choices[0].message.content)
            quest_data['quest_id'] = str(uuid.uuid4())
            
            if self.validate_quest(quest_data):
                self.quest_logger.log_quest(customer_id, quest_data)
                return quest_data
            else:
                raise ValueError("Generated quest data is invalid")
            
        except Exception as e:
            print(f"Error generating quest: {e}")
            return None

    def validate_quest(self, quest_data: Dict) -> bool:
        """Validate the generated quest data"""
        required_fields = [
            'quest_id', 'title', 'narrative', 'objectives', 
            'rewards', 'game_rules', 'progress_tracking'
        ]
        
        if not all(field in quest_data for field in required_fields):
            return False
            
        for objective in quest_data.get('objectives', []):
            if not all(field in objective for field in ['id', 'platform', 'description', 'points', 'required']):
                return False
            # Location is optional but must be a string if present
            if 'location' in objective and not isinstance(objective['location'], str):
                return False
            # Promotion is optional but must be a string if present
            if 'promotion' in objective and not isinstance(objective['promotion'], str):
                return False
                
        rewards = quest_data.get('rewards', {})
        if not all(field in rewards for field in ['xp', 'vouchers', 'achievements']):
            return False
            
        return True

# Initialize components
user_context_manager = UserContextManager('data/user_data.csv')
quest_logger = QuestLogger('data/quest_log.csv')
quest_generator = GPTQuestGenerator(user_context_manager, quest_logger)

@app.route('/health')
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'Quest generator service is running'
    })

@app.route('/user-stats/<customer_id>')
def get_user_stats(customer_id):
    try:
        context = user_context_manager.get_user_context(customer_id)
        return jsonify(context)
    except Exception as e:
        return jsonify({'error': str(e)}), 404

@app.route('/generate-quest/<customer_id>')
def generate_quest(customer_id):
    try:
        quest_data = quest_generator.generate_quest(customer_id)
        if quest_data:
            return jsonify(quest_data)
        return jsonify({'error': 'Failed to generate quest'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/complete-quest/<customer_id>/<quest_id>', methods=['POST'])
def complete_quest(customer_id, quest_id):
    try:
        success = request.json.get('success', False)
        user_context_manager.update_user_stats(customer_id, success)
        quest_logger.log_quest(customer_id, {'quest_id': quest_id}, 'completed')
        return jsonify({
            'message': 'Quest completion recorded',
            'success': success
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    if not os.getenv('OPENAI_API_KEY'):
        raise EnvironmentError("OPENAI_API_KEY environment variable is not set")
    
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)