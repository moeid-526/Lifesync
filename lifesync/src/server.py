from flask import Flask, request, jsonify
import json
import numpy as np
import pickle
import nltk
import tensorflow as tf
from nltk.stem import WordNetLemmatizer
from flask_cors import CORS
import traceback  # For detailed error logging
import os

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# File paths (raw strings to avoid invalid escape sequence warning)
MODEL_PATH = r"C:\Users\PMYLS\Desktop\Numl\Final Year Project\Model\Lifesync.h5"
WORDS_PATH = r"C:\Users\PMYLS\Desktop\Numl\Final Year Project\Model\words.pkl"
CLASSES_PATH = r"C:\Users\PMYLS\Desktop\Numl\Final Year Project\Model\classes.pkl"
ENCODER_PATH = r"C:\Users\PMYLS\Desktop\Numl\Final Year Project\Model\encoder.pkl"
INTENTS_PATH = r"C:\Users\PMYLS\Desktop\Datasets\newdataset.json"

# Load trained model and files with error handling
try:
    print("Loading model and data...")

    # Load the trained model
    model = tf.keras.models.load_model(MODEL_PATH)

    # Load words, classes, and encoder
    with open(WORDS_PATH, "rb") as w_file:
        words = pickle.load(w_file)

    with open(CLASSES_PATH, "rb") as c_file:
        classes = pickle.load(c_file)

    with open(ENCODER_PATH, "rb") as e_file:
        encoder = pickle.load(e_file)

    # Load intents data (responses)
    with open(INTENTS_PATH, "r", encoding="utf-8") as file:
        intents_data = json.load(file)

    print("✅ Model and files loaded successfully!")

except Exception as e:
    print(f"❌ Error loading model or data: {e}")
    traceback.print_exc()

# Initialize lemmatizer
lemmatizer = WordNetLemmatizer()

# Function to preprocess input text
def encode_input(text):
    try:
        print(f"\n🔹 User input: {text}")
        tokenized_words = nltk.word_tokenize(text)
        tokenized_words = [lemmatizer.lemmatize(word.lower()) for word in tokenized_words if word.isalnum()]

        print(f"🔹 Tokenized words: {tokenized_words}")

        # Create a bag-of-words representation
        bag = [1 if word in tokenized_words else 0 for word in words]
        print(f"🔹 Encoded input: {bag}")

        return np.array([bag])

    except Exception as e:
        print(f"❌ Error in encode_input: {e}")
        traceback.print_exc()
        return None

# Function to predict intent
def predict_intent(text):
    try:
        encoded_text = encode_input(text)
        if encoded_text is None:
            return None, 0.0

        prediction = model.predict(encoded_text)[0]
        print(f"🔹 Model prediction: {prediction}")

        predicted_index = np.argmax(prediction)
        confidence = prediction[predicted_index]
        intent_label = classes[predicted_index]

        print(f"🔹 Predicted intent: {intent_label} with confidence {confidence}")
        return intent_label, confidence

    except Exception as e:
        print(f"❌ Error in predict_intent: {e}")
        traceback.print_exc()
        return None, 0.0

# Function to get chatbot response based on intent
def get_response(intent):
    try:
        for intent_data in intents_data['intents']:
            if intent_data['tag'] == intent:
                response = np.random.choice(intent_data['responses'])
                print(f"🔹 Response selected: {response}")
                return response

        print("❌ No matching intent found!")
        return "I'm sorry, I didn't understand that."

    except Exception as e:
        print(f"❌ Error in get_response: {e}")
        traceback.print_exc()
        return "Sorry, something went wrong."

# ✅ API endpoint used by frontend
@app.route("/keras-chat", methods=["POST"])
def keras_chat():
    try:
        data = request.get_json()
        user_input = data.get("input", "").strip()

        if not user_input:
            return jsonify({"response": "Please enter a message."})

        intent, confidence = predict_intent(user_input)

        # If confidence is low, return fallback response
        if intent is None or confidence < 0.1:
            return jsonify({"response": "I'm not sure I understand. Can you rephrase that?"})

        response = get_response(intent)
        return jsonify({"response": response})

    except Exception as e:
        print(f"❌ Error in keras_chat endpoint: {e}")
        traceback.print_exc()
        return jsonify({"response": "An error occurred while processing your request."})

# Run the Flask app on port 5009
if __name__ == "__main__":
    print("🚀 Starting Flask server on port 5009...")
    app.run(debug=True, port=5009)
