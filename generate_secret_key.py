#!/usr/bin/env python3
"""
Generate a secure Django SECRET_KEY
Run this script to generate a new secret key for production
"""

from django.core.management.utils import get_random_secret_key

print("=" * 60)
print("  DJANGO SECRET_KEY GENERATOR")
print("=" * 60)
print()
print("Generated SECRET_KEY:")
print("-" * 60)
print(get_random_secret_key())
print("-" * 60)
print()
print("INSTRUCTIONS:")
print("1. Copy the key above")
print("2. Add to your .env file:")
print("   DJANGO_SECRET_KEY=<paste-key-here>")
print("3. NEVER commit this key to Git!")
print("4. Use different keys for dev/staging/production")
print()
print("=" * 60)
