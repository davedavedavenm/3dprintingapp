from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "Service is running"}), 200

@app.route('/api/v1/materials', methods=['GET'])
def get_materials():
    materials = [
        {"id": 1, "name": "PLA", "price_per_gram": 0.025, "density": 1.24},
        {"id": 2, "name": "PETG", "price_per_gram": 0.035, "density": 1.27},
        {"id": 3, "name": "ABS", "price_per_gram": 0.028, "density": 1.04},
        {"id": 4, "name": "TPU", "price_per_gram": 0.045, "density": 1.21}
    ]
    return jsonify(materials)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
