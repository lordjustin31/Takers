from django.core.management.base import BaseCommand
from marketplace.models import User


class Command(BaseCommand):
    help = 'Create admin user with proper password hashing'

    def handle(self, *args, **options):
        username = 'admin'
        email = 'admin@marketplace.com'
        password = 'admin123'
        
        # Delete existing admin if exists
        User.objects.filter(username=username).delete()
        
        # Create new superuser with proper password hashing
        user = User.objects.create_superuser(
            username=username,
            email=email,
            password=password,
            is_staff=True,
            is_superuser=True
        )
        
        self.stdout.write(self.style.SUCCESS(f'\n✅ Admin user created successfully!\n'))
        self.stdout.write(f'Username: {username}')
        self.stdout.write(f'Password: {password}')
        self.stdout.write(f'Email: {email}')
        self.stdout.write(f'\nis_staff: {user.is_staff}')
        self.stdout.write(f'is_superuser: {user.is_superuser}')
        self.stdout.write(f'is_active: {user.is_active}')
        self.stdout.write(f'\n🔗 Login at: http://127.0.0.1:8000/admin/\n')
