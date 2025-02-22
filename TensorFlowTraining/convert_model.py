import tensorflow as tf
from tensorflow import keras
import json
import os

# Load the model
model = keras.models.load_model('text_classifier.keras')

# Get the model architecture as JSON
model_json = model.to_json()

# Save the model architecture to a JSON file
with open('model.json', 'w') as json_file:
    json_file.write(model_json)

# Also save the weights separately
model.save_weights('model.weights.h5')

print("Model architecture saved as 'model.json'")
print("Model weights saved as 'model.weights.h5'")
