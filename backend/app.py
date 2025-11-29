# backend/app.py
import os
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

from simulator import ArchConfig, simulate

app = Flask(__name__, static_folder="../frontend/dist", static_url_path="/")

app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-key")
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///arch_sim.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

CORS(app, supports_credentials=True)
db = SQLAlchemy(app)

# ---------- MODELS ----------

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)

class Config(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    data = db.Column(db.JSON, nullable=False)

# ---------- UTILS ----------

def current_user():
    uid = session.get("user_id")
    if not uid:
        return None
    return User.query.get(uid)

# ---------- AUTH ROUTES ----------

@app.route("/api/register", methods=["POST"])
def register():
    data = request.json or {}
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()
    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists"}), 400

    user = User(
        username=username,
        password_hash=generate_password_hash(password)
    )
    db.session.add(user)
    db.session.commit()
    session["user_id"] = user.id
    return jsonify({"message": "Registered", "username": username})

@app.route("/api/login", methods=["POST"])
def login():
    data = request.json or {}
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()
    user = User.query.filter_by(username=username).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid credentials"}), 401
    session["user_id"] = user.id
    return jsonify({"message": "Logged in", "username": username})

@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out"})

@app.route("/api/me", methods=["GET"])
def me():
    user = current_user()
    if not user:
        return jsonify({"user": None})
    return jsonify({"user": {"username": user.username}})

# ---------- SIMULATION ROUTE ----------

@app.route("/api/simulate", methods=["POST"])
def api_simulate():
    data = request.json or {}
    # Fill config with defaults where missing
    cfg = ArchConfig(
        cache_size_kb=float(data.get("cache_size_kb", 32.0)),
        cache_block_size_b=int(data.get("cache_block_size_b", 64)),
        cache_associativity=int(data.get("cache_associativity", 4)),
        cache_hit_time_ns=float(data.get("cache_hit_time_ns", 1.0)),
        mem_size_gb=float(data.get("mem_size_gb", 8.0)),
        mem_bandwidth_gbs=float(data.get("mem_bandwidth_gbs", 25.0)),
        mem_latency_ns=float(data.get("mem_latency_ns", 80.0)),
        reg_count=int(data.get("reg_count", 32)),
        reg_width_bits=int(data.get("reg_width_bits", 64)),
        bus_width_bits=int(data.get("bus_width_bits", 64)),
        bus_freq_ghz=float(data.get("bus_freq_ghz", 2.4)),
        clock_freq_ghz=float(data.get("clock_freq_ghz", 3.0)),
        pipeline_depth=int(data.get("pipeline_depth", 14)),
        issue_width=int(data.get("issue_width", 4)),
        alu_width_bits=int(data.get("alu_width_bits", 64)),
        branch_predictor=str(data.get("branch_predictor", "bimodal")),
    )
    result = simulate(cfg)
    return jsonify(result)

# ---------- PREDEFINED CONFIGS ----------

PREDEFINED_CONFIGS = [
    {
        "id": "small-l1",
        "name": "Small L1, Simple Core",
        "config": {
            "cache_size_kb": 16,
            "cache_block_size_b": 32,
            "cache_associativity": 2,
            "mem_size_gb": 4,
            "mem_bandwidth_gbs": 15,
            "mem_latency_ns": 100,
            "reg_count": 16,
            "reg_width_bits": 64,
            "bus_width_bits": 32,
            "bus_freq_ghz": 1.8,
            "clock_freq_ghz": 2.0,
            "pipeline_depth": 10,
            "issue_width": 2,
            "alu_width_bits": 32,
            "branch_predictor": "static",
        },
    },
    {
        "id": "balanced",
        "name": "Balanced Desktop Core",
        "config": {
            "cache_size_kb": 32,
            "cache_block_size_b": 64,
            "cache_associativity": 4,
            "mem_size_gb": 8,
            "mem_bandwidth_gbs": 25,
            "mem_latency_ns": 80,
            "reg_count": 32,
            "reg_width_bits": 64,
            "bus_width_bits": 64,
            "bus_freq_ghz": 2.4,
            "clock_freq_ghz": 3.0,
            "pipeline_depth": 14,
            "issue_width": 4,
            "alu_width_bits": 64,
            "branch_predictor": "bimodal",
        },
    },
    {
        "id": "high-perf",
        "name": "High-Performance OoO Core",
        "config": {
            "cache_size_kb": 64,
            "cache_block_size_b": 64,
            "cache_associativity": 8,
            "mem_size_gb": 16,
            "mem_bandwidth_gbs": 50,
            "mem_latency_ns": 60,
            "reg_count": 128,
            "reg_width_bits": 64,
            "bus_width_bits": 128,
            "bus_freq_ghz": 3.6,
            "clock_freq_ghz": 4.0,
            "pipeline_depth": 20,
            "issue_width": 6,
            "alu_width_bits": 128,
            "branch_predictor": "tournament",
        },
    },
]

@app.route("/api/predefined-configs", methods=["GET"])
def get_predefined_configs():
    return jsonify(PREDEFINED_CONFIGS)

# ---------- SAVED CONFIGS (AUTH REQUIRED) ----------

@app.route("/api/configs", methods=["GET", "POST"])
def user_configs():
    user = current_user()
    if not user:
        return jsonify({"error": "Not authenticated"}), 401

    if request.method == "POST":
        data = request.json or {}
        name = data.get("name", "Unnamed config").strip()
        cfg_data = data.get("config", {})
        if not isinstance(cfg_data, dict):
            return jsonify({"error": "config must be a JSON object"}), 400

        cfg = Config(user_id=user.id, name=name, data=cfg_data)
        db.session.add(cfg)
        db.session.commit()
        return jsonify({"message": "Saved"})

    # GET
    configs = Config.query.filter_by(user_id=user.id).all()
    return jsonify([
        {"id": c.id, "name": c.name, "config": c.data}
        for c in configs
    ])

# ---------- FRONTEND STATIC ----------

@app.route("/")
def index():
    # Serve the built React app
    return app.send_static_file("index.html")

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(host="0.0.0.0", port=5050, debug=True)
