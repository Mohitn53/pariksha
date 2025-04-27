from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TestViewSet, QuestionViewSet

router = DefaultRouter()
router.register(r'', TestViewSet)

test_router = DefaultRouter()
test_router.register(r'questions', QuestionViewSet, basename='test-questions')

urlpatterns = [
    path('', include(router.urls)),
    path('<int:test_pk>/', include(test_router.urls)),
] 