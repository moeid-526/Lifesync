from flask import Flask, request, jsonify
import pickle
import numpy as np
from keras.models import load_model
import nltk
from nltk.stem import WordNetLemmatizer
import json

app = Flask(__name__)
lemmatizer = WordNetLemmatizer()

model = load_model("C:/Users/PMYLS/Desktop/Numl/Final Year Project/Model/Lifesync.h5")
words = pickle.load(open("C:/Users/PMYLS/Desktop/Numl/Final Year Project/Model/words.pkl", "rb"))
classes = pickle.load(open("C:/Users/PMYLS/Desktop/Numl/Final Year Project/Model/classes.pkl", "rb"))
encoder = pickle.load(open("C:/Users/PMYLS/Desktop/Numl/Final Year Project/Model/encoder.pkl", "rb"))

def clean_up_sentence(sentence):
    sentence_words = nltk.word_tokenize(sentence)
    sentence_words = [lemmatizer.lemmatize(word.lower()) for word in sentence_words]
    return sentence_words

def bow(sentence, words):
    sentence_words = clean_up_sentence(sentence)
    bag = [0] * len(words)
    for s in sentence_words:
        for i, w in enumerate(words):
            if w == s:
                bag[i] = 1
    return np.array([bag])

@app.route("/chat", methods=["POST"])
def chat():
    input_data = request.json["input"]
    p = bow(input_data, words)
    res = model.predict(p)[0]
    index = np.argmax(res)
    tag = classes[index]
    response = encoder[tag] if tag in encoder else "I'm not sure how to respond to that."
    return jsonify({"response": response})

if __name__ == "__main__":
    app.run(port=5009)
