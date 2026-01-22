from django.contrib import admin
from django.urls import path
from . import views


urlpatterns = [
    path('scrape/', views.scrape),
    path('batch_scrape/', views.batch_scrape),
]
