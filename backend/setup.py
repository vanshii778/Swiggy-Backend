import os
import sys
import subprocess

def run_command(command, cwd=None):
    """Run a shell command and return its output."""
    try:
        result = subprocess.run(
            command,
            cwd=cwd,
            shell=True,
            check=True,
            text=True,
            capture_output=True
        )
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {command}")
        print(f"Error: {e.stderr}")
        sys.exit(1)

def main():
    # Set environment variables
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'swiggy.settings')
    
    # Install requirements
    print("Installing requirements...")
    run_command("pip install -r requirements.txt")
    
    # Apply migrations
    print("\nApplying migrations...")
    run_command("python manage.py makemigrations")
    run_command("python manage.py migrate")
    
    # Create superuser if not exists
    print("\nCreating superuser...")
    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if not User.objects.filter(email='admin@example.com').exists():
            User.objects.create_superuser(
                email='admin@example.com',
                phone='+1234567890',
                name='Admin User',
                password='admin123'
            )
            print("Superuser created successfully!")
            print("Email: admin@example.com")
            print("Password: admin123")
        else:
            print("Superuser already exists.")
    except Exception as e:
        print(f"Error creating superuser: {str(e)}")
    
    print("\nSetup completed successfully!")

if __name__ == "__main__":
    main()
