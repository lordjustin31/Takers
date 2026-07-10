from django.core.management.base import BaseCommand
from marketplace.models import Notification, Comment


class Command(BaseCommand):
    help = 'Check notifications and comments'

    def handle(self, *args, **options):
        # Count notifications
        total_notifications = Notification.objects.count()
        comment_notifications = Notification.objects.filter(notification_type='comment').count()
        
        self.stdout.write(f'\n=== Notification Summary ===')
        self.stdout.write(f'Total notifications: {total_notifications}')
        self.stdout.write(f'Comment notifications: {comment_notifications}')
        
        # Show recent comment notifications
        self.stdout.write(f'\n=== Recent Comment Notifications ===')
        recent = Notification.objects.filter(notification_type='comment').order_by('-created_at')[:10]
        
        if recent.exists():
            for notif in recent:
                status = '✓ Read' if notif.is_read else '✗ Unread'
                self.stdout.write(
                    f'  [{status}] {notif.title} for {notif.user.username} - {notif.created_at.strftime("%Y-%m-%d %H:%M")}'
                )
        else:
            self.stdout.write('  No comment notifications found')
        
        # Show total comments
        total_comments = Comment.objects.count()
        self.stdout.write(f'\n=== Comment Summary ===')
        self.stdout.write(f'Total comments: {total_comments}')
        
        # Show recent comments
        self.stdout.write(f'\n=== Recent Comments ===')
        recent_comments = Comment.objects.select_related('user', 'product').order_by('-created_at')[:10]
        
        if recent_comments.exists():
            for comment in recent_comments:
                self.stdout.write(
                    f'  {comment.user.username} on "{comment.product.title}" by {comment.product.seller.username}'
                )
                self.stdout.write(f'    "{comment.body[:50]}..."')
        else:
            self.stdout.write('  No comments found')
        
        self.stdout.write('\n' + '='*50 + '\n')
