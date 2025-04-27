from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TestResultViewSet, QuestionResponseViewSet

router = DefaultRouter()
router.register(r'', TestResultViewSet, basename='results')

result_router = DefaultRouter()
result_router.register(r'responses', QuestionResponseViewSet, basename='result-responses')

urlpatterns = [
    path('', include(router.urls)),
    path('<int:test_result_pk>/', include(result_router.urls)),
] 