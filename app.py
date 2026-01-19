from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np

pipeline_path = 'diabetes_pipeline.joblib'
loaded_pipeline = joblib.load(pipeline_path)
print(f"Model pipeline from '{pipeline_path}' loaded successfully.")

app = Flask(__name__)
CORS(app)

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "message": "Welcome to the Diabetes Prediction API!",
        "description": "This is a machine learning service to predict the likelihood of diabetes.",
        "endpoints": {
            "/predict": {
                "method": "POST",
                "description": "Send patient data in JSON format to get a prediction.",
                "example_payload": {
                    "Pregnancies": 6,
                    "Glucose": 148,
                    "BloodPressure": 72,
                    "SkinThickness": 35,
                    "Insulin": 0,
                    "BMI": 33.6,
                    "DiabetesPedigreeFunction": 0.627,
                    "Age": 50
                }
            }
        }
    })


@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        if data is None:
            return jsonify({"error": "No JSON data received"}), 400

        input_df = pd.DataFrame([data])
        
        prediction = loaded_pipeline.predict(input_df)
        prediction_probabilities = loaded_pipeline.predict_proba(input_df)

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