import tensorflow as tf
from tensorflow import keras
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
import numpy as np
import json
import pandas as pd

# Load data from CSV
df = pd.read_csv("TensorFlowTraining/filtered_cleaned_original.csv")
texts = df['text'].tolist()
labels = df['category'].tolist()

# Tokenize text
tokenizer = Tokenizer(num_words=5000, oov_token="<OOV>")
tokenizer.fit_on_texts(texts)
sequences = tokenizer.texts_to_sequences(texts)
padded = pad_sequences(sequences, padding="post")

# Label encoding
label_map = {label: idx for idx, label in enumerate(set(labels))}
y_train = np.array([label_map[label] for label in labels])

# Build model
model = tf.keras.Sequential([
    tf.keras.layers.Embedding(5000, 16, input_length=len(padded[0])),
    tf.keras.layers.GlobalAveragePooling1D(),
    tf.keras.layers.Dense(16, activation='relu'),
    tf.keras.layers.Dense(len(label_map), activation='softmax')
])

model.compile(loss='sparse_categorical_crossentropy', optimizer='adam', metrics=['accuracy'])

# Train model
model.fit(padded, y_train, epochs=50, verbose=1)

# Save model
model.save("text_classifier.keras")

# Save tokenizer
with open("tokenizer.json", "w") as f:
    json.dump(tokenizer.word_index, f)
