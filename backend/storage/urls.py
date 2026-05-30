from django.contrib import admin
from django.urls import path
from . import views


urlpatterns = [
    path('commit/', views.commit),
    path('similar/', views.similar),
    path('import/', views.import_flashcards),
    path('clear/', views.clear),
    path('remove/', views.remove),
    path('list/', views.all_flashcards),
    path('search/', views.search),
    path('languages/', views.languages),
    path('update/', views.update),
]
