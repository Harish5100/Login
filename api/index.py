from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import json
import os
import shutil
from datetime import datetime

app = Flask(__name__)
CORS(app) 

is_vercel = os.environ.get('VERCEL') == '1'
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
storage_dir = '/tmp' if is_vercel else base_dir

for file_name in ['quiz_data.json', 'users.json', 'results.json']:
    src = os.path.join(base_dir, file_name)
    dst = os.path.join(storage_dir, file_name)
    if is_vercel and not os.path.exists(dst) and os.path.exists(src):
        try:
            shutil.copy(src, dst)
        except Exception:
            pass

DATA_FILE = os.path.join(storage_dir, 'quiz_data.json')
USERS_FILE = os.path.join(storage_dir, 'users.json')
RESULTS_FILE = os.path.join(storage_dir, 'results.json')

def load_json(filepath, default_data):
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            return json.load(f)
    return default_data

def save_json(filepath, data):
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)

@app.route('/api/quiz-data', methods=['GET'])
def get_quiz_data():
    data = load_json(DATA_FILE, {"time": 30, "questions": []})
    return jsonify(data)

@app.route('/api/quiz-data', methods=['POST'])
def update_quiz_data():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        save_json(DATA_FILE, data)
        return jsonify({"message": "Quiz data updated successfully", "data": data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    users_data = load_json(USERS_FILE, {"users": []})
    for user in users_data['users']:
        if user['username'] == username and user['password'] == password:
            return jsonify({"message": "Login successful", "user": {"username": username, "role": user['role']}})
            
    return jsonify({"error": "Invalid username or password"}), 401

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    users_data = load_json(USERS_FILE, {"users": []})
    
    if any(u['username'] == username for u in users_data['users']):
        return jsonify({"error": "Username already exists"}), 400
        
    users_data['users'].append({"username": username, "password": password, "role": "student"})
    save_json(USERS_FILE, users_data)
    
    return jsonify({"message": "Registration successful"})

@app.route('/api/update-user', methods=['POST'])
def update_user():
    data = request.json
    old_username = data.get('old_username')
    new_username = data.get('new_username')
    new_password = data.get('new_password')
    
    users_data = load_json(USERS_FILE, {"users": []})
    user_found = False
    
    for user in users_data['users']:
        if user['username'] == old_username:
            user['username'] = new_username
            user['password'] = new_password
            user_found = True
            break
            
    if not user_found:
        return jsonify({"error": "User not found"}), 404
        
    save_json(USERS_FILE, users_data)
    
    
    results_data = load_json(RESULTS_FILE, {"results": []})
    for res in results_data['results']:
        if res['username'] == old_username:
            res['username'] = new_username
    save_json(RESULTS_FILE, results_data)
            
    return jsonify({"message": "User updated successfully", "new_username": new_username})

@app.route('/api/users', methods=['GET'])
def get_all_users():
    users_data = load_json(USERS_FILE, {"users": []})
    results_data = load_json(RESULTS_FILE, {"results": []})
    
    students = []
    for user in users_data['users']:
        if user['role'] == 'student':
            student_stat = next((r for r in results_data['results'] if r['username'] == user['username']), None)
            students.append({
                "username": user['username'],
                "lastLogin": student_stat['lastLogin'] if student_stat else "Never",
                "timeSpent": student_stat['totalTimeSpent'] if student_stat else 0,
                "score": student_stat['latestScore'] if student_stat else 0,
                "correct": student_stat.get('correct', 0) if student_stat else 0,
                "wrong": student_stat.get('wrong', 0) if student_stat else 0,
                "unanswered": student_stat.get('unanswered', 0) if student_stat else 0,
                "dailyTime": student_stat.get('dailyTime', {}) if student_stat else {},
                "history": student_stat.get('history', []) if student_stat else []
            })
            
    return jsonify(students)


@app.route('/api/results', methods=['POST'])
def save_result():
    data = request.json
    username = data.get('username')
    score = data.get('score')
    time_spent = data.get('timeSpent', 0)
    correct = data.get('correct', 0)
    wrong = data.get('wrong', 0)
    unanswered = data.get('unanswered', 0)
    
    results_data = load_json(RESULTS_FILE, {"results": []})
    
    student_res = next((r for r in results_data['results'] if r['username'] == username), None)
    now = datetime.now()
    now_str = now.strftime("%d %b, %I:%M %p")
    date_str = now.strftime("%Y-%m-%d")
    
    if student_res:
        student_res['latestScore'] = score
        student_res['totalTimeSpent'] += time_spent
        student_res['lastLogin'] = now_str
        student_res['correct'] = correct
        student_res['wrong'] = wrong
        student_res['unanswered'] = unanswered
        
        
        daily = student_res.get('dailyTime', {})
        daily[date_str] = daily.get(date_str, 0) + time_spent
        student_res['dailyTime'] = daily
        
        if 'history' not in student_res:
            student_res['history'] = []
        student_res['history'].append({
            "date": now_str,
            "score": score,
            "timeSpent": time_spent,
            "correct": correct,
            "wrong": wrong,
            "unanswered": unanswered
        })
        
        
        if score > student_res.get('highScore', 0):
            student_res['highScore'] = score
            student_res['highScoreTime'] = time_spent
    else:
        results_data['results'].append({
            "username": username,
            "latestScore": score,
            "highScore": score,
            "highScoreTime": time_spent,
            "totalTimeSpent": time_spent,
            "lastLogin": now_str,
            "correct": correct,
            "wrong": wrong,
            "unanswered": unanswered,
            "dailyTime": { date_str: time_spent },
            "history": [{
                "date": now_str,
                "score": score,
                "timeSpent": time_spent,
                "correct": correct,
                "wrong": wrong,
                "unanswered": unanswered
            }]
        })
        
    save_json(RESULTS_FILE, results_data)
    return jsonify({"message": "Result saved successfully"})

@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    results_data = load_json(RESULTS_FILE, {"results": []})
    leaderboard = sorted(results_data['results'], key=lambda x: x.get('highScore', 0), reverse=True)
    return jsonify(leaderboard)


@app.route('/')
def serve_index():
    return send_from_directory(base_dir, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(os.path.join(base_dir, path)):
        return send_from_directory(base_dir, path)
    return "Not Found", 404

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', debug=debug, port=port)
