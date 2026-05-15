from django.contrib import admin
from django.urls import path
from . import views


urlpatterns = [
    path('commit/', views.commit),
    path('similar/', views.similar),
    path('import/', views.import_flashcards),
]
