console.log("JavaScript file loaded successfully!");

const predictionForm = document.getElementById("prediction-form");

predictionForm.addEventListener("submit", function (event) {
  event.preventDefault();
  console.log("Form submission detected! Default action prevented.");

  const formData = new FormData(predictionForm);
  const data = Object.fromEntries(formData.entries());
  for (const key in data) {
    data[key] = parseFloat(data[key]);
  }
  console.log("Gathered and cleaned form data:", data);

  const jsonPayload = JSON.stringify(data);
  console.log("Constructed JSON Payload:", jsonPayload);

  fetch("http://127.0.0.1:5000/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: jsonPayload,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Server responded with an error: ${response.status}`);
      }
      return response.json();
    })
    .then((predictionData) => {
      console.log("Success! Received prediction from API:", predictionData);

      const resultContainer = document.getElementById("result-container");

      const label = predictionData.prediction_label;
      const confidenceNonDiabetic = (
        predictionData.confidence_scores["Non-Diabetic"] * 100
      ).toFixed(2);
      const confidenceDiabetic = (
        predictionData.confidence_scores["Diabetic"] * 100
      ).toFixed(2);

      const resultHTML = `
            <h2>Prediction Result</h2>
            <p><strong>Outcome:</strong> ${label}</p>
            <p><strong>Confidence Scores:</strong></p>
            <ul>
                <li>Non-Diabetic: ${confidenceNonDiabetic}%</li>
                <li>Diabetic: ${confidenceDiabetic}%</li>
            </ul>
        `;

      resultContainer.innerHTML = resultHTML;

      if (label === "Diabetic") {
        resultContainer.style.color = "red";
      } else {
        resultContainer.style.color = "green";
      }
    })
    .catch((error) => {
      console.error("Error communicating with the API:", error);
      const resultContainer = document.getElementById("result-container");
      resultContainer.innerHTML = `<p style="color: red;">Error: Could not get a prediction. Please check the console for details.</p>`;
    });
});
