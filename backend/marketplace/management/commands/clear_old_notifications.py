from django.core.management.base import BaseCommand
from marketplace.models import Notification


class Command(BaseCommand):
    help = 'Clear all old/test notifications from the database'

    def handle(self, *args, **options):
        count = Notification.objects.all().count()
        Notification.objects.all().delete()
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully deleted {count} notifications')
        )
