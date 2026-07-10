from django.core.management.base import BaseCommand
from marketplace.models import Message, User
import uuid


class Command(BaseCommand):
    help = 'Create test messages between users'

    def handle(self, *args, **kwargs):
        users = list(User.objects.all())
        
        if len(users) < 2:
            self.stdout.write(self.style.ERROR('Need at least 2 users to create messages.'))
            self.stdout.write('Please create another user account.')
            return
        
        # Create messages between first two users
        user1 = users[0]
        user2 = users[1]
        
        # Generate a thread ID for this conversation
        thread_id = uuid.uuid4()
        
        messages_data = [
            {"sender": user1, "recipient": user2, "body": "Hey! Is this item still available?"},
            {"sender": user2, "recipient": user1, "body": "Yes, it's still available! Interested?"},
            {"sender": user1, "recipient": user2, "body": "Absolutely! Can you do $50?"},
            {"sender": user2, "recipient": user1, "body": "How about $60 and I'll throw in free shipping?"},
            {"sender": user1, "recipient": user2, "body": "Deal! That works for me 👍"},
        ]
        
        created_count = 0
        for i, msg_data in enumerate(messages_data):
            message, created = Message.objects.get_or_create(
                sender=msg_data["sender"],
                recipient=msg_data["recipient"],
                body=msg_data["body"],
                defaults={
                    'thread_id': thread_id,
                    'is_read': i < 3  # First 3 are read, last 2 unread
                }
            )
            if created:
                created_count += 1
                sender_name = msg_data["sender"].display_name or msg_data["sender"].username
                self.stdout.write(f'✓ Created message from {sender_name}')
        
        self.stdout.write(self.style.SUCCESS(f'\n✓ Created {created_count} test messages'))
        self.stdout.write(f'Conversation between {user1.username} and {user2.username}')
        self.stdout.write(f'Total messages in system: {Message.objects.count()}')
