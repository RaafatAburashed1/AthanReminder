import json

# Path to your original JSON file
original_file_path = './state.json'
# Path to the new JSON file where the modified data will be written
new_file_path = './states.json'

# Read the original JSON file with utf-8 encoding
with open(original_file_path, 'r', encoding='utf-8') as file:
    data = json.load(file)

# Process each object in the data
for obj in data:
    # Remove the 'latitude' and 'longitude' properties
    obj.pop('latitude', None)
    obj.pop('longitude', None)

# Write the modified data to the new file with utf-8 encoding
with open(new_file_path, 'w', encoding='utf-8') as file:
    json.dump(data, file, ensure_ascii=False)

print("Data modified and saved to a new file successfully.")