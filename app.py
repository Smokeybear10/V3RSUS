from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'src')))

from model_engine import FightPredictor

app = Flask(__name__, static_folder='static')
CORS(app)

print("Initializing ML Engine...")
predictor = FightPredictor()
success = predictor.train('data/ufc-master.csv')

if not success:
    print("WARNING: Model failed to initialize. Make sure data is present.")

@app.route('/')
def serve_index():
    return send_from_directory('static', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory('static', path)
    return send_from_directory('static', 'index.html')

@app.route('/api/fighters', methods=['GET'])
def get_fighters():
    if predictor.fights_df is not None:
        red = predictor.fights_df['RedFighter'].dropna().unique().tolist()
        blue = predictor.fights_df['BlueFighter'].dropna().unique().tolist()
        fighters = sorted(list(set(red + blue)))
        return jsonify({"fighters": fighters})
    return jsonify({"fighters": []})

@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.json
    f1 = data.get('fighter1')
    f2 = data.get('fighter2')
    
    if not f1 or not f2:
        return jsonify({"error": "Both fighter1 and fighter2 are required"}), 400
        
    try:
        winner, confidence, real_f1, real_f2 = predictor.predict_matchup(f1, f2)
        return jsonify({
            "fighter1": real_f1,
            "fighter2": real_f2,
            "winner": winner,
            "confidence": confidence
        })
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Server error during prediction"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
