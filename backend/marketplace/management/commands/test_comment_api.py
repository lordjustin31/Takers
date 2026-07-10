from django.core.management.base import BaseCommand
from marketplace.models import Comment, Product
import json


class Command(BaseCommand):
    help = 'Test comment API response format'

    def handle(self, *args, **options):
        # Get a product with comments
        product = Product.objects.filter(comments__isnull=False).first()
        
        if not product:
            self.stdout.write(self.style.WARNING('No products with comments found'))
            return
        
        self.stdout.write(f'\n=== Testing Product ===')
        self.stdout.write(f'Product ID: {product.id}')
        self.stdout.write(f'Title: {product.title}')
        self.stdout.write(f'Seller: {product.seller.username}')
        
        # Get comments
        comments = Comment.objects.filter(product=product).order_by('-created_at')
        
        self.stdout.write(f'\n=== Comments ({comments.count()}) ===')
        
        for comment in comments[:5]:
            self.stdout.write(f'\nComment ID: {comment.id}')
            self.stdout.write(f'  User: {comment.user.username}')
            self.stdout.write(f'  Body: {comment.body[:50]}')
            self.stdout.write(f'  Created: {comment.created_at}')
            self.stdout.write(f'  Parent: {comment.parent_id}')
        
        # Test API endpoint format
        self.stdout.write(f'\n=== API Endpoint to Test ===')
        self.stdout.write(f'GET /api/comments/?product={product.id}')
        
        self.stdout.write(f'\n=== Expected Response Format ===')
        self.stdout.write('Should return array of comment objects:')
        self.stdout.write('[')
        self.stdout.write('  {')
        self.stdout.write('    "id": 1,')
        self.stdout.write('    "user": { "username": "...", ... },')
        self.stdout.write('    "body": "comment text",')
        self.stdout.write('    "created_at": "...",')
        self.stdout.write('    "replies": [],')
        self.stdout.write('    "reply_count": 0')
        self.stdout.write('  }')
        self.stdout.write(']')
        
        self.stdout.write('\n' + '='*50 + '\n')
