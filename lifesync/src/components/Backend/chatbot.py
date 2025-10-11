from flask import Flask, request, jsonify
import google.generativeai as genai
from flask_cors import CORS
import re
import datetime
import os
import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import tensorflow as tf
from PIL import Image
import base64
import io

app = Flask(__name__)
CORS(app)

# ✅ Configure Gemini API key
genai.configure(api_key="AIzaSyAygmI8uJSmmhafEnB2e4-56zfu9FAGTwY")

# ✅ Load your trained model (ensure it’s in same folder)
MODEL_PATH = "facial_emotion_regularized_final.h5"

if os.path.exists(MODEL_PATH):
    # Load the model properly to preserve structure and metrics
    emotion_model = tf.keras.models.load_model(MODEL_PATH, compile=True)
    print("✅ Facial emotion model loaded successfully.")
else:
    emotion_model = None
    print("❌ Model file not found!")

# ✅ Must exactly match training dataset order from Colab
EMOTION_LABELS = ["angry", "happy", "neutral", "sad", "surprise"]

# ✅ Format Gemini responses
def format_response(text):
    if not text:
        return ""
    formatted = re.sub(r"---+", "", text)
    lines = formatted.split("\n")
    count = 1
    new_lines = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("###"):
            heading_text = stripped.replace("###", "").strip()
            new_lines.append(f"<b>{count}. {heading_text}</b>")
            count += 1
        else:
            new_lines.append(stripped)
    formatted = "\n".join(new_lines)
    formatted = re.sub(r"\*\*(.*?)\*\*", r"<b>\1</b>", formatted)
    formatted = re.sub(r"\n{2,}", "\n\n", formatted)
    return formatted.strip()

# ✅ Gemini chat endpoint
@app.route("/gemini-chat", methods=["POST"])
def gemini_chat():
    try:
        data = request.get_json()
        user_input = data.get("input", "").strip()
        if not user_input:
            return jsonify({"response": "Please say something!"})

        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(user_input)
        formatted_text = format_response(response.text)
        return jsonify({"response": formatted_text})
    except Exception as e:
        print("\n❌ Error:", e)
        return jsonify({"response": "Error connecting to Gemini."})

# ✅ Emotion analysis (image upload)
@app.route("/analyze-face", methods=["POST"])
def analyze_face():
    try:
        if "image" not in request.files:
            return jsonify({"response": "No image uploaded."}), 400

        img_file = request.files["image"]
        img_path = "temp_face.jpg"
        img_file.save(img_path)

        # 🧩 Step 1: Preprocess image
        img = Image.open(img_path).convert("RGB")
        img = img.resize((224, 224))
        img_array = np.asarray(img, dtype=np.float32) / 255.0
        img_array = np.expand_dims(img_array, axis=0)

        # 🧩 Step 2: Predict emotion
        preds = emotion_model.predict(img_array)
        emotion_idx = np.argmax(preds[0])
        confidence = float(np.max(preds[0]))
        emotion = EMOTION_LABELS[emotion_idx]

        print(f"🎯 Predicted Emotion: {emotion} ({confidence:.2f})")

        # 🧩 Step 3: Generate context-aware message
        emotion_prompts = {
            "happy": "The detected emotion is happiness. Explain what this emotion reflects psychologically and suggest two ways to maintain this positivity.",
            "sad": "The detected emotion is sadness. Explain this emotion deeply and provide two comforting recommendations for emotional healing.",
            "surprise": "The detected emotion is surprise. Explain what this emotion means and suggest two grounding techniques to stabilize sudden emotional shifts.",
            "neutral": "The detected emotion is neutral. Explain this state of emotional balance and provide two tips to enhance self-awareness and mindfulness.",
            "angry": "The detected emotion is anger. Explain what this emotion indicates and suggest two healthy coping strategies for managing anger constructively.",
        }

        model = genai.GenerativeModel("gemini-2.5-flash")
        prompt = emotion_prompts.get(emotion, "Explain this emotional state briefly.")
        response = model.generate_content(prompt)
        formatted_text = format_response(response.text)

        os.remove(img_path)
        return jsonify({
            "emotion": emotion,
            "confidence": confidence,
            "response": formatted_text
        })
    except Exception as e:
        print("\n❌ Error in analyze-face:", e)
        return jsonify({"response": "Error analyzing image."}), 500


# ✅ NEW: Emotion analysis (camera capture)
@app.route("/analyze-camera", methods=["POST"])
def analyze_camera():
    try:
        data = request.get_json()
        if "image" not in data:
            return jsonify({"response": "No image data received."}), 400

        # Decode Base64 image
        image_data = re.sub("^data:image/.+;base64,", "", data["image"])
        img_bytes = base64.b64decode(image_data)
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")

        # 🧩 Step 1: Preprocess image
        img = img.resize((224, 224))
        img_array = np.asarray(img, dtype=np.float32) / 255.0
        img_array = np.expand_dims(img_array, axis=0)

        # 🧩 Step 2: Predict emotion
        preds = emotion_model.predict(img_array)
        emotion_idx = np.argmax(preds[0])
        confidence = float(np.max(preds[0]))
        emotion = EMOTION_LABELS[emotion_idx]

        print(f"📸 Camera Emotion: {emotion} ({confidence:.2f})")

        # 🧩 Step 3: Generate context-aware message
        emotion_prompts = {
            "happy": "The detected emotion is happiness. Explain what this emotion reflects psychologically and suggest two ways to maintain this positivity.",
            "sad": "The detected emotion is sadness. Explain this emotion deeply and provide two comforting recommendations for emotional healing.",
            "surprise": "The detected emotion is surprise. Explain what this emotion means and suggest two grounding techniques to stabilize sudden emotional shifts.",
            "neutral": "The detected emotion is neutral. Explain this state of emotional balance and provide two tips to enhance self-awareness and mindfulness.",
            "angry": "The detected emotion is anger. Explain what this emotion indicates and suggest two healthy coping strategies for managing anger constructively.",
        }

        model = genai.GenerativeModel("gemini-2.5-flash")
        prompt = emotion_prompts.get(emotion, "Explain this emotional state briefly.")
        response = model.generate_content(prompt)
        formatted_text = format_response(response.text)

        return jsonify({
            "emotion": emotion,
            "confidence": confidence,
            "response": formatted_text
        })
    except Exception as e:
        print("\n❌ Error in analyze-camera:", e)
        return jsonify({"response": "Error analyzing camera image."}), 500


if __name__ == "__main__":
    print("🚀 Backend running on http://0.0.0.0:5012")
    app.run(host="0.0.0.0", port=5012)
