from django.contrib import admin

from .models import NoteModel


@admin.register(NoteModel)
class NoteAdmin(admin.ModelAdmin):
    list_display = ("id", "owner", "title", "scheduled_at", "recurrence", "archived", "created_at")
    list_filter = ("recurrence", "archived", "created_at")
    search_fields = ("title", "content")
    autocomplete_fields = ("owner",)
    ordering = ("-created_at",)