from django.core.management.base import BaseCommand
from marketplace.models import User


class Command(BaseCommand):
    help = 'Check all users and their staff/superuser status'

    def handle(self, *args, **options):
        users = User.objects.all()
        
        if not users:
            self.stdout.write(self.style.WARNING('No users found in database'))
            return
        
        self.stdout.write(self.style.SUCCESS(f'\nFound {users.count()} user(s):\n'))
        
        for user in users:
            self.stdout.write('-' * 60)
            self.stdout.write(f'Username: {user.username}')
            self.stdout.write(f'Email: {user.email}')
            self.stdout.write(f'is_staff: {user.is_staff}')
            self.stdout.write(f'is_superuser: {user.is_superuser}')
            self.stdout.write(f'is_active: {user.is_active}')
            self.stdout.write(f'has_usable_password: {user.has_usable_password()}')
            self.stdout.write('')
