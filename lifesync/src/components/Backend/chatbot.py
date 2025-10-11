# chatbot.py
from flask import Flask, request, jsonify
import google.generativeai as genai
from flask_cors import CORS
import re
import datetime
import os
import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
from PIL import Image

app = Flask(__name__)
CORS(app)

# ✅ Configure Gemini API key
genai.configure(api_key="AIzaSyAygmI8uJSmmhafEnB2e4-56zfu9FAGTwY")  # replace with your real key

# ✅ Load your trained emotion detection model
MODEL_PATH = "facial_analysis_model.h5"
if os.path.exists(MODEL_PATH):
    emotion_model = load_model(MODEL_PATH)
    print("✅ Facial analysis model loaded successfully.")
else:
    emotion_model = None
    print("❌ Facial analysis model not found. Place it in backend directory.")

# ✅ Emotion labels (must match your dataset order)
EMOTION_LABELS = ["happy", "sad", "surprise", "neutral", "angry", "ahegao"]

# ✅ Helper: Format text from Gemini
def format_response(text):
    if not text:
        return ""
    formatted = text
    formatted = re.sub(r"---+", "", formatted)
    lines = formatted.split("\n")
    count = 1
    sub_count = 0
    in_subsection = False
    new_lines = []

    for line in lines:
        stripped = line.strip()
        if stripped.startswith("###"):
            heading_text = stripped.replace("###", "").strip()
            sub_count = 0
            in_subsection = True
            if re.match(r"^\d+\.", heading_text):
                new_line = f"<b>{heading_text}</b>"
            else:
                new_line = f"<b>{count}. {heading_text}</b>"
                count += 1
            new_lines.append(new_line)
        elif re.match(r"^\d+\.\s", stripped) and in_subsection:
            sub_count += 1
            sub_text = re.sub(r"^\d+\.\s*", "", stripped)
            if ":" in sub_text:
                before_colon, after_colon = sub_text.split(":", 1)
                new_line = f"<b>{count-1}.{sub_count} {before_colon}</b>:{after_colon}"
            else:
                new_line = f"<b>{count-1}.{sub_count} {sub_text}</b>"
            new_lines.append(new_line)
        else:
            new_lines.append(line)
    formatted = "\n".join(new_lines)
    formatted = re.sub(r"\*\*(.*?)\*\*", r"<b>\1</b>", formatted)
    formatted = re.sub(r"\*(.*?)\*", r"\1", formatted)
    formatted = re.sub(r"\n{2,}", "\n\n", formatted)
    return formatted.strip()


# ✅ Existing Gemini chat route (unchanged)
@app.route("/gemini-chat", methods=["POST"])
def gemini_chat():
    try:
        data = request.get_json()
        user_input = data.get("input", "").strip()
        print("\n========== NEW REQUEST ==========")
        print(f"[{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}]")
        print(f"User Input: {user_input}")

        if not user_input:
            return jsonify({"response": "Please say something!"})

        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(user_input)
        raw_text = response.text
        formatted_text = format_response(raw_text)

        print("\n--- RAW RESPONSE ---")
        print(raw_text)
        print("\n--- FORMATTED RESPONSE ---")
        print(formatted_text)

        return jsonify({"response": formatted_text})
    except Exception as e:
        print("\n❌ Error:", e)
        return jsonify({"response": "Sorry, I'm having trouble connecting to Gemini right now."})


# ✅ NEW: Facial Emotion Analysis Route
@app.route("/analyze-face", methods=["POST"])
def analyze_face():
    try:
        print("\n🧠 New facial analysis request received.")
        if "image" not in request.files:
            return jsonify({"response": "No image uploaded."}), 400

        img_file = request.files["image"]

        # Save temporarily
        img_path = "temp_image.jpg"
        img_file.save(img_path)

        # Load and preprocess image for your model
        img = Image.open(img_path).convert("RGB")
        img = img.resize((224, 224))  # resize to model input size
        img_array = image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        img_array /= 255.0

        # Predict emotion
        preds = emotion_model.predict(img_array)
        emotion_idx = np.argmax(preds)
        emotion = EMOTION_LABELS[emotion_idx]

        print(f"🎯 Detected emotion: {emotion}")

        # Define prompt for Gemini
        emotion_prompts = {
            "happy": "The detected emotion is happiness. Explain what this emotion reflects psychologically and suggest two ways to maintain this positivity.",
            "sad": "The detected emotion is sadness. Explain this emotion deeply and provide two comforting recommendations for emotional healing.",
            "surprise": "The detected emotion is surprise. Explain what this emotion means and suggest two grounding techniques to stabilize sudden emotional shifts.",
            "neutral": "The detected emotion is neutral. Explain this state of emotional balance and provide two tips to enhance self-awareness and mindfulness.",
            "angry": "The detected emotion is anger. Explain what this emotion indicates and suggest two healthy coping strategies for managing anger constructively.",
            "ahegao": "The detected emotion is ahegao. Explain what this facial expression signifies and suggest two ways to handle emotional overstimulation or intensity calmly."
        }

        # Generate Gemini response
        model = genai.GenerativeModel("gemini-2.5-flash")
        prompt = emotion_prompts.get(emotion, "Explain this emotional state briefly.")
        response = model.generate_content(prompt)
        formatted_text = format_response(response.text)

        print("\n--- EMOTION RESPONSE ---")
        print(formatted_text)

        # Clean temp
        os.remove(img_path)

        return jsonify({
            "emotion": emotion,
            "response": formatted_text
        })
    except Exception as e:
        print("\n❌ Error in analyze-face:", e)
        return jsonify({"response": "Error analyzing image."}), 500


if __name__ == "__main__":
    print("🚀 Gemini Chatbot backend running on http://0.0.0.0:5012")
    app.run(host="0.0.0.0", port=5012)
