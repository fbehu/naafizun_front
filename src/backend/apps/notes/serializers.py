from rest_framework import serializers

from .models import NoteModel


class NoteSerializer(serializers.ModelSerializer):
    owner = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = NoteModel
        fields = (
            'id', 'owner', 'title', 'content', 'created_at', 'updated_at',
            'scheduled_at', 'recurrence', 'archived',
        )
        read_only_fields = ('id', 'owner', 'created_at', 'updated_at')

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            validated_data['owner'] = request.user
        return super().create(validated_data)