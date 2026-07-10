from django.core.management.base import BaseCommand
from marketplace.models import Category
from django.utils.text import slugify


class Command(BaseCommand):
    help = 'Create initial categories'

    def handle(self, *args, **kwargs):
        categories = [
            "Electronics",
            "Fashion",
            "Home & Garden",
            "Sports & Outdoors",
            "Toys & Games",
            "Books & Media",
            "Automotive",
            "Health & Beauty",
            "Office Supplies",
            "Pet Supplies",
        ]
        
        created_count = 0
        for name in categories:
            category, created = Category.objects.get_or_create(
                name=name,
                defaults={'slug': slugify(name), 'is_active': True}
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'✓ Created category: {name}'))
            else:
                self.stdout.write(f'- Category already exists: {name}')
        
        self.stdout.write(self.style.SUCCESS(f'\nSuccessfully created {created_count} new categories'))
        self.stdout.write(f'Total categories: {Category.objects.count()}')
