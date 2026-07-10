from django.core.management.base import BaseCommand
from marketplace.models import Product


class Command(BaseCommand):
    help = 'Approve all pending products (for testing)'

    def handle(self, *args, **options):
        pending_products = Product.objects.filter(
            moderation_status=Product.ModerationStatus.PENDING
        )
        
        count = pending_products.count()
        
        if count == 0:
            self.stdout.write(
                self.style.WARNING('No pending products to approve')
            )
            return
        
        pending_products.update(moderation_status=Product.ModerationStatus.APPROVED)
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully approved {count} products')
        )
        
        # Show approved products
        for product in pending_products:
            self.stdout.write(f"  - {product.title} by {product.seller.username}")
