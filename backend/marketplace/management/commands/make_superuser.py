from django.core.management.base import BaseCommand
from marketplace.models import User


class Command(BaseCommand):
    help = 'Make a user a superuser with staff privileges'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username to make superuser')

    def handle(self, *args, **options):
        username = options['username']
        
        try:
            user = User.objects.get(username=username)
            user.is_staff = True
            user.is_superuser = True
            user.save()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully made {username} a superuser with staff privileges!'
                )
            )
            self.stdout.write(f'is_staff: {user.is_staff}')
            self.stdout.write(f'is_superuser: {user.is_superuser}')
            
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'User "{username}" does not exist')
            )
