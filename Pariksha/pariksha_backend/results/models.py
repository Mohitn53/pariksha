from django.db import models
from django.conf import settings
from tests.models import Test, Question

class TestResult(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='test_results')
    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name='results')
    score = models.DecimalField(max_digits=5, decimal_places=2)
    time_taken = models.IntegerField(help_text='Time taken in seconds')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_passed = models.BooleanField()
    total_questions = models.IntegerField()
    attempted_questions = models.IntegerField()
    correct_answers = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'test_results'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.test.title} - {self.score}%"

class QuestionResponse(models.Model):
    test_result = models.ForeignKey(TestResult, on_delete=models.CASCADE, related_name='question_responses')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_answer = models.CharField(max_length=1, choices=[
        ('A', 'A'), ('B', 'B'), ('C', 'C'), ('D', 'D')
    ], null=True, blank=True)
    is_correct = models.BooleanField()
    marks_obtained = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'question_responses'
        ordering = ['question__id']

    def __str__(self):
        return f"{self.test_result} - Question {self.question.id}" 