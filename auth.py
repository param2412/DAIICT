from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_user, logout_user, current_user, login_required
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from app import db
from models import User
from forms import LoginForm, ProfileForm
from flask_wtf import FlaskForm
from wtforms import PasswordField, SubmitField, StringField, EmailField, BooleanField
from wtforms.validators import DataRequired, EqualTo, Length, Email

auth_bp = Blueprint('auth', __name__)

# Create a reset password form
class ResetPasswordForm(FlaskForm):
    password = PasswordField('New Password', validators=[DataRequired()])
    confirm_password = PasswordField('Confirm New Password', 
                                    validators=[DataRequired(), 
                                               EqualTo('password', message='Passwords must match')])
    submit = SubmitField('Reset Password')

# Define the registration form
class RegistrationForm(FlaskForm):
    username = StringField('Username', 
                          validators=[DataRequired(), 
                                     Length(min=2, max=20, 
                                           message="Username must be between 2 and 20 characters")])
    
    email = StringField('Email', 
                       validators=[DataRequired(), 
                                  Email(message="Please enter a valid email address")])
    
    password = PasswordField('Password', 
                            validators=[DataRequired(), 
                                       Length(min=6, 
                                             message="Password must be at least 6 characters long")])
    
    confirm_password = PasswordField('Confirm Password', 
                                    validators=[DataRequired(), 
                                               EqualTo('password', 
                                                      message='Passwords must match')])
    
    submit = SubmitField('Sign Up')
    
    # Custom validators to check for existing username/email
    def validate_username(self, username):
        user = User.query.filter_by(username=username.data).first()
        if user:
            raise ValidationError('Username already taken. Please choose a different one.')
    
    def validate_email(self, email):
        user = User.query.filter_by(email=email.data).first()
        if user:
            raise ValidationError('Email already registered. Please use a different email or log in.')

# Define the login form
class LoginForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired()])
    remember = BooleanField('Remember Me')  # Make sure this matches your HTML form
    submit = SubmitField('Login')

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
    form = LoginForm()
    
    if form.validate_on_submit():
        email = form.email.data
        password = form.password.data
        
        # Find user
        user = User.query.filter_by(email=email).first()
        
        # Validate user
        if user and check_password_hash(user.password, password):
            login_user(user, remember=form.remember.data if hasattr(form, 'remember') else False)
            flash('Login successful!', 'success')
            
            next_page = request.args.get('next')
            if not next_page or not next_page.startswith('/'):
                next_page = url_for('dashboard')  # Or 'career_bot' if you prefer
            
            return redirect(next_page)
        else:
            flash('Login failed. Check email and password.', 'danger')
    
    return render_template('auth/login.html', form=form)


@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
    form = RegistrationForm()
    if form.validate_on_submit():
        user = User(
            username=form.username.data,
            email=form.email.data
        )
        user.set_password(form.password.data)
        
        db.session.add(user)
        db.session.commit()
        
        flash('Registration successful! You can now log in.', 'success')
        return redirect(url_for('.login'))  # relative to current blueprint
    
    return render_template('auth/register.html', form=form)

@auth_bp.route('/signup', methods=['GET', 'POST'])
def signup():
    # Debug print to confirm the route is being hit
    print("Signup route accessed with method:", request.method)
    
    if request.method == 'POST':
        print("Form data received:", request.form)
        
        # Get form data directly
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        
        print(f"Processing signup for: {username}, {email}")
        
        # Simple validation
        if not username or not email or not password:
            flash('All fields are required', 'danger')
            return render_template('auth/signup.html')
            
        # Check if user exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            flash('Email already registered', 'warning')
            return render_template('auth/signup.html')
        
        try:
            # Create new user with simple password hashing
            hashed_password = generate_password_hash(password)
            new_user = User(username=username, email=email, password=hashed_password)
            
            db.session.add(new_user)
            db.session.commit()
            
            flash('Account created successfully! Please login.', 'success')
            # Direct URL redirect instead of url_for to avoid potential issues
            return redirect('/login')
            
        except Exception as e:
            db.session.rollback()
            print("Error creating user:", str(e))
            flash(f'Error creating account. Please try again.', 'danger')
    
    # GET request - render the signup form
    return render_template('auth/signup.html')

@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('index'))

@auth_bp.route('/update_profile', methods=['POST'])
@login_required
def update_profile():
    form = ProfileForm(
        original_username=current_user.username,
        original_email=current_user.email
    )
    
    if form.validate_on_submit():
        # Check if the current password is correct
        if form.current_password.data and not current_user.check_password(form.current_password.data):
            flash('Current password is incorrect.', 'danger')
            return redirect(url_for('profile'))
        
        # Update user information
        current_user.username = form.username.data
        current_user.email = form.email.data
        
        # Update password if provided
        if form.new_password.data:
            current_user.set_password(form.new_password.data)
        
        db.session.commit()
        flash('Your profile has been updated.', 'success')
    else:
        for field, errors in form.errors.items():
            for error in errors:
                flash(f"{getattr(form, field).label.text}: {error}", 'danger')
    
    return redirect(url_for('profile'))

@auth_bp.route('/reset_password', methods=['GET', 'POST'])
def reset_password():
    form = ResetPasswordForm()
    if form.validate_on_submit():
        # Process the form data here
        # e.g., update user's password in database
        flash('Your password has been reset!', 'success')
        return redirect(url_for('auth.login'))
    return render_template('auth/reset_password.html', form=form)
