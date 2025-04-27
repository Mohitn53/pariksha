from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Test, Question
from .serializers import TestListSerializer, TestDetailSerializer, QuestionSerializer

# Create your views here.

class TestViewSet(viewsets.ModelViewSet):
    queryset = Test.objects.all()
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    
    def get_serializer_class(self):
        if self.action == 'list':
            return TestListSerializer
        return TestDetailSerializer

    def get_queryset(self):
        queryset = Test.objects.all()
        if self.action == 'list':
            # Filter public tests and tests created by the user
            if self.request.user.is_authenticated:
                queryset = queryset.filter(is_public=True) | queryset.filter(creator=self.request.user)
            else:
                queryset = queryset.filter(is_public=True)
        
        # Apply filters
        subject = self.request.query_params.get('subject', None)
        difficulty = self.request.query_params.get('difficulty', None)
        
        if subject:
            queryset = queryset.filter(subject=subject)
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
            
        return queryset

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

    @action(detail=True, methods=['post'])
    def access_test(self, request, pk=None):
        test = self.get_object()
        access_code = request.data.get('access_code')

        if not test.is_public and (test.access_code != access_code):
            return Response(
                {'error': 'Invalid access code'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = TestDetailSerializer(test)
        return Response(serializer.data)

class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Question.objects.filter(test_id=self.kwargs['test_pk'])

    def perform_create(self, serializer):
        serializer.save(test_id=self.kwargs['test_pk'])
