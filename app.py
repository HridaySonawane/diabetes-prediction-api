from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import os

pipeline_path = 'diabetes_pipeline.joblib'
loaded_pipeline = joblib.load(pipeline_path)
print(f"Model pipeline from '{pipeline_path}' loaded successfully.")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Serve static files (CSS, JS) directly from the project root
app = Flask(__name__)
CORS(app)

# ── PIMA column order that the model was trained on ──────────
FEATURE_ORDER = [
    'Pregnancies', 'Glucose', 'BloodPressure',
    'SkinThickness', 'Insulin', 'BMI',
    'DiabetesPedigreeFunction', 'Age'
]

@app.route('/')
def home():
    """Serve the GlucoSense AI frontend."""
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/style.css')
def serve_css():
    from flask import Response
    with open(os.path.join(BASE_DIR, 'style.css'), 'r', encoding='utf-8') as f:
        return Response(f.read(), mimetype='text/css')

@app.route('/script.js')
def serve_js():
    from flask import Response
    with open(os.path.join(BASE_DIR, 'script.js'), 'r', encoding='utf-8') as f:
        return Response(f.read(), mimetype='application/javascript')


@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        if data is None:
            return jsonify({"error": "No JSON data received"}), 400

        # Re-order columns to match training order
        ordered_data = {col: data[col] for col in FEATURE_ORDER}
        input_df = pd.DataFrame([ordered_data])

        prediction = loaded_pipeline.predict(input_df)
        prediction_probabilities = loaded_pipeline.predict_proba(input_df)

    except KeyError as e:
        return jsonify({"error": f"Missing field: {e}"}), 400
    except Exception as e:
        return jsonify({"error": f"Error during prediction: {e}"}), 400

    final_prediction_class = int(prediction[0])
    probabilities = prediction_probabilities[0]
    prediction_label = "Diabetic" if final_prediction_class == 1 else "Non-Diabetic"

    response_data = {
        "prediction_class": final_prediction_class,
        "prediction_label": prediction_label,
        "confidence_scores": {
            "Non-Diabetic": float(probabilities[0]),
            "Diabetic": float(probabilities[1])
        }
    }

    print(f"Sending response: {response_data}")
    return jsonify(response_data)


if __name__ == '__main__':
    app.run(debug=True)