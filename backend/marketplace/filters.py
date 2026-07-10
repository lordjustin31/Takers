import django_filters

from .models import Product


class NumberInFilter(django_filters.BaseInFilter, django_filters.NumberFilter):
    pass


class ProductFilter(django_filters.FilterSet):
    price_min = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    price_max = django_filters.NumberFilter(field_name="price", lookup_expr="lte")
    category = NumberInFilter(field_name="category_id", lookup_expr="in")
    location = django_filters.CharFilter(field_name="location", lookup_expr="icontains")

    class Meta:
        model = Product
        fields = [
            "category",
            "seller",
            "moderation_status",
            "is_featured",
            "condition",
            "location",
            "brand",
        ]
