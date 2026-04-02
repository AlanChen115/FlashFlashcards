from django.contrib import admin
from django.urls import path
from . import views


urlpatterns = [
    path('parse_website/', views.parse_website),
    path('parse_images/', views.parse_images),
]
