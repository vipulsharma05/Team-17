# ai-service/app.py

from flask import Flask, request, jsonify
from transformers import pipeline

app = Flask(__name__)

# Load a pre-trained sentiment analysis model
classifier = pipeline('sentiment-analysis')

@app.route('/triage', methods=['POST'])
def triage_post():
    data = request.json
    post_text = data.get('postText', '')

    if not post_text:
        return jsonify({'error': 'No post text provided'}), 400

    result = classifier(post_text)[0]
    label = result['label'].lower()
    score = result['score']

    if label == 'negative' and score > 0.9:
        category = "Needs Rescue"
        priority = "HIGH"
    elif label == 'negative' and score > 0.7:
        category = "Needs Food/Water"
        priority = "MEDIUM"
    elif label == 'positive':
        category = "Safe"
        priority = "LOW"
    else:
        category = "Irrelevant"
        priority = "LOW"

    print(f"Post: '{post_text}' -> AI Classified as: {category} with Priority: {priority}")
    
    return jsonify({
        "category": category,
        "priority": priority,
        "score": score
    })

if __name__ == '__main__':
    app.run(port=5000)