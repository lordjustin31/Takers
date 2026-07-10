from django.core.management.base import BaseCommand
from marketplace.models import Product


class Command(BaseCommand):
    help = 'Activate all inactive products and approve them (for testing)'

    def handle(self, *args, **options):
        inactive_products = Product.objects.filter(is_active=False)
        
        count = inactive_products.count()
        
        if count == 0:
            self.stdout.write(
                self.style.WARNING('No inactive products to activate')
            )
            return
        
        # Activate and approve all
        inactive_products.update(
            is_active=True,
            moderation_status=Product.ModerationStatus.APPROVED
        )
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully activated and approved {count} products')
        )
        
        # Show activated products
        for product in Product.objects.filter(id__in=inactive_products.values_list('id', flat=True)):
            self.stdout.write(f"  - {product.title} by {product.seller.username}")
