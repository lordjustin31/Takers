from django.core.management.base import BaseCommand
from marketplace.models import Notification, User


class Command(BaseCommand):
    help = 'Create sample notifications for all users'

    def handle(self, *args, **kwargs):
        users = User.objects.all()
        
        if not users.exists():
            self.stdout.write(self.style.ERROR('No users found. Please create a user first.'))
            return
        
        notifications_data = [
            {
                'notification_type': Notification.Type.MESSAGE,
                'title': 'New Message',
                'message': 'Someone sent you a message about your listing',
            },
            {
                'notification_type': Notification.Type.LIKE,
                'title': 'Item Liked',
                'message': 'Your iPhone 12 Pro listing received a like',
            },
            {
                'notification_type': Notification.Type.PRICE_DROP,
                'title': 'Price Drop Alert',
                'message': 'An item in your favorites dropped in price',
            },
            {
                'notification_type': Notification.Type.OFFER,
                'title': 'New Offer',
                'message': 'You received an offer of $800 on your MacBook',
            },
            {
                'notification_type': Notification.Type.PAYMENT,
                'title': 'Payment Received',
                'message': 'Payment confirmed for your recent sale',
            },
        ]
        
        created_count = 0
        for user in users:
            for i, notif_data in enumerate(notifications_data):
                notification, created = Notification.objects.get_or_create(
                    user=user,
                    title=notif_data['title'],
                    defaults={
                        'notification_type': notif_data['notification_type'],
                        'message': notif_data['message'],
                        'is_read': i >= 3,  # First 3 are unread
                    }
                )
                if created:
                    created_count += 1
        
        self.stdout.write(self.style.SUCCESS(f'✓ Created {created_count} sample notifications'))
        self.stdout.write(f'Total notifications: {Notification.objects.count()}')
