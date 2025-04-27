from rest_framework import serializers
from .models import TestResult, QuestionResponse
from tests.serializers import QuestionSerializer

class QuestionResponseSerializer(serializers.ModelSerializer):
    question_detail = QuestionSerializer(source='question', read_only=True)

    class Meta:
        model = QuestionResponse
        fields = ('id', 'question', 'question_detail', 'selected_answer', 'is_correct',
                 'marks_obtained', 'created_at')
        read_only_fields = ('id', 'is_correct', 'marks_obtained', 'created_at')

class TestResultSerializer(serializers.ModelSerializer):
    question_responses = QuestionResponseSerializer(many=True, read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    test_title = serializers.CharField(source='test.title', read_only=True)

    class Meta:
        model = TestResult
        fields = ('id', 'user', 'user_name', 'test', 'test_title', 'score', 'time_taken',
                 'start_time', 'end_time', 'is_passed', 'total_questions',
                 'attempted_questions', 'correct_answers', 'question_responses', 'created_at')
        read_only_fields = ('id', 'score', 'is_passed', 'created_at')

    def create(self, validated_data):
        question_responses_data = self.context.get('question_responses', [])
        test_result = TestResult.objects.create(**validated_data)

        # Calculate score and other metrics
        total_marks = sum(q.marks for q in test_result.test.questions.all())
        marks_obtained = 0
        correct_answers = 0

        for response_data in question_responses_data:
            question = response_data['question']
            selected_answer = response_data['selected_answer']
            is_correct = selected_answer == question.correct_answer
            marks = question.marks if is_correct else 0
            
            QuestionResponse.objects.create(
                test_result=test_result,
                question=question,
                selected_answer=selected_answer,
                is_correct=is_correct,
                marks_obtained=marks
            )

            marks_obtained += marks
            if is_correct:
                correct_answers += 1

        # Update test result with calculated values
        test_result.score = (marks_obtained / total_marks) * 100
        test_result.is_passed = test_result.score >= test_result.test.passing_marks
        test_result.attempted_questions = len(question_responses_data)
        test_result.correct_answers = correct_answers
        test_result.save()

        return test_result 