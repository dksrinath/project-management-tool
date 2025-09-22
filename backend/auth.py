from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from functools import wraps
import bcrypt

def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password, hashed):
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def role_required(allowed_roles):
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def wrapper(*args, **kwargs):
            from database import User
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            if user.role not in allowed_roles:
                return {'error': 'Insufficient permissions'}, 403
            return f(*args, **kwargs)
        return wrapper
    return decorator
