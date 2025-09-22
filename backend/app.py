from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from database import db
from routes import api
from dotenv import load_dotenv
import os
import logging

load_dotenv()

app = Flask(__name__)

# Use SQLite for development if DATABASE_URL is not set or PostgreSQL is not available
database_url = os.getenv('DATABASE_URL')
if not database_url or 'postgresql' not in database_url:
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///project_mgmt.db'
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url

app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'dev-secret-key')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

db.init_app(app)
jwt = JWTManager(app)
CORS(app)

app.register_blueprint(api, url_prefix='/api')

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    logger.error(f'Internal server error: {error}')
    return jsonify({'error': 'Internal server error'}), 500

@app.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Bad request'}), 400

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({'error': 'Token has expired'}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({'error': 'Invalid token'}), 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({'error': 'Authentication required'}), 401

if __name__ == '__main__':
    with app.app_context():
        try:
            db.create_all()
            from database import User
            from auth import hash_password

            if not User.query.filter_by(username='admin').first():
                admin = User(username='admin', password=hash_password('admin123'), role='admin')
                db.session.add(admin)
                db.session.commit()
                logger.info('Default admin user created')
            
            logger.info('Database initialized successfully')
        except Exception as e:
            logger.error(f'Database initialization failed: {e}')
            
    app.run(debug=True, port=5000)
