from django.contrib import admin
from django.urls import path
from . import views


urlpatterns = [
    path('parse/', views.parse),
    path('batch_parse/', views.batch_parse),
]
