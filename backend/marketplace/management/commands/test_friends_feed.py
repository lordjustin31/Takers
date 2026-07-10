from django.core.management.base import BaseCommand
from django.db.models import Q
from marketplace.models import Friendship, Product, User


class Command(BaseCommand):
    help = 'Test friends feed functionality'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username to check friends feed for')

    def handle(self, *args, **options):
        username = options['username']
        
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'User "{username}" not found')
            )
            return
        
        self.stdout.write(
            self.style.SUCCESS(f'\n=== Testing Friends Feed for: {user.username} ===\n')
        )
        
        # Get friends
        friendships = Friendship.objects.filter(
            Q(requester=user, status=Friendship.Status.ACCEPTED) |
            Q(receiver=user, status=Friendship.Status.ACCEPTED)
        ).select_related('requester', 'receiver')
        
        friend_ids = []
        self.stdout.write('Friends:')
        for friendship in friendships:
            friend = friendship.receiver if friendship.requester == user else friendship.requester
            friend_ids.append(friend.id)
            self.stdout.write(f'  - {friend.username} (ID: {friend.id})')
        
        if not friend_ids:
            self.stdout.write(
                self.style.WARNING('\nNo friends found! User needs to accept some friend requests first.')
            )
            return
        
        # Get ALL active products from friends (no moderation check)
        products = Product.objects.filter(
            seller_id__in=friend_ids,
            is_active=True
        ).select_related('seller', 'category').order_by('-created_at')
        
        self.stdout.write(f'\n\nProducts from Friends (Total: {products.count()}):')
        
        if products.count() == 0:
            self.stdout.write(
                self.style.WARNING('\nNo products found from friends!')
            )
            self.stdout.write('\nPossible reasons:')
            self.stdout.write('  1. Friends haven\'t posted any products yet')
            self.stdout.write('  2. Products are not active (is_active=False)')
            
            # Check all products from friends (regardless of active status)
            all_friend_products = Product.objects.filter(
                seller_id__in=friend_ids
            ).select_related('seller')
            
            if all_friend_products.exists():
                self.stdout.write(f'\n\nFound {all_friend_products.count()} products from friends (all statuses):')
                for product in all_friend_products:
                    self.stdout.write(
                        f'  - {product.title} by {product.seller.username} '
                        f'[Active: {product.is_active}]'
                    )
        else:
            for product in products:
                self.stdout.write(
                    f'  - {product.title} by {product.seller.username} '
                    f'(${product.price}) - Posted: {product.created_at.strftime("%Y-%m-%d %H:%M")}'
                )
        
        self.stdout.write('\n' + '='*60 + '\n')
