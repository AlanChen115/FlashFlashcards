from django.contrib import admin
from django.urls import path
from . import views


urlpatterns = [
    path('anki/', views.anki),
    path('quizlet/', views.quizlet),
]
