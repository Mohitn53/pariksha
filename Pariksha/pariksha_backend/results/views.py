from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import TestResult, QuestionResponse
from .serializers import TestResultSerializer, QuestionResponseSerializer
from tests.models import Test

class TestResultViewSet(viewsets.ModelViewSet):
    serializer_class = TestResultSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return TestResult.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        # Add total questions count to the request data
        test = Test.objects.get(pk=request.data['test'])
        request.data['total_questions'] = test.questions.count()
        
        # Create serializer with question responses in context
        serializer = self.get_serializer(
            data=request.data,
            context={'question_responses': request.data.get('question_responses', [])}
        )
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class QuestionResponseViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = QuestionResponseSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return QuestionResponse.objects.filter(
            test_result_id=self.kwargs['test_result_pk'],
            test_result__user=self.request.user
        ) 