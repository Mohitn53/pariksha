from rest_framework import serializers
from .models import Test, Question

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ('id', 'question_text', 'option_a', 'option_b', 'option_c', 'option_d',
                 'correct_answer', 'marks', 'explanation')
        extra_kwargs = {'correct_answer': {'write_only': True}}

class TestListSerializer(serializers.ModelSerializer):
    creator_name = serializers.CharField(source='creator.username', read_only=True)
    question_count = serializers.IntegerField(source='questions.count', read_only=True)

    class Meta:
        model = Test
        fields = ('id', 'title', 'description', 'creator_name', 'subject', 'difficulty',
                 'time_limit', 'total_marks', 'passing_marks', 'question_count', 'created_at')

class TestDetailSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True)
    creator_name = serializers.CharField(source='creator.username', read_only=True)

    class Meta:
        model = Test
        fields = ('id', 'title', 'description', 'creator_name', 'subject', 'difficulty',
                 'time_limit', 'total_marks', 'passing_marks', 'is_public', 'access_code',
                 'questions', 'created_at')
        read_only_fields = ('id', 'created_at')

    def create(self, validated_data):
        questions_data = validated_data.pop('questions')
        test = Test.objects.create(**validated_data)
        for question_data in questions_data:
            Question.objects.create(test=test, **question_data)
        return test

    def update(self, instance, validated_data):
        questions_data = validated_data.pop('questions', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if questions_data is not None:
            instance.questions.all().delete()
            for question_data in questions_data:
                Question.objects.create(test=instance, **question_data)

        return instance 