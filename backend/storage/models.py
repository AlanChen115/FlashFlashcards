from django.db import models

# Create your models here.
class Flashcard(models.Model):
    front = models.TextField()
    back = models.TextField()
    lemma = models.CharField(max_length=255, db_index=True)
    language = models.CharField(max_length=20, null=True)
    content_hash = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
