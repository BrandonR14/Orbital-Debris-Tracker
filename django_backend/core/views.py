from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
from .models import Satellite, TLEEntry, RiskReport, PredictionReport, User
from .serializers import (
    SatelliteSerializer, TLEEntrySerializer, RiskReportSerializer, 
    PredictionReportSerializer, UserSerializer, LoginSerializer
)
from .tasks import run_prediction_task
import json

class SatelliteViewSet(viewsets.ModelViewSet):
    queryset = Satellite.objects.all()
    serializer_class = SatelliteSerializer
    permission_classes = [IsAuthenticated]

class TLEEntryViewSet(viewsets.ModelViewSet):
    queryset = TLEEntry.objects.all()
    serializer_class = TLEEntrySerializer
    permission_classes = [IsAuthenticated]

class RiskReportViewSet(viewsets.ModelViewSet):
    queryset = RiskReport.objects.all()
    serializer_class = RiskReportSerializer
    permission_classes = [IsAuthenticated]

class PredictionReportViewSet(viewsets.ModelViewSet):
    queryset = PredictionReport.objects.all()
    serializer_class = PredictionReportSerializer
    permission_classes = [IsAuthenticated]

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'User registered successfully',
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        
        print(f"DEBUG: Attempting login with email: {email}")
        
        # Authenticate using email (since it's the USERNAME_FIELD)
        user = authenticate(username=email, password=password)
        
        print(f"DEBUG: Authentication result: {user}")
        
        if user is not None:
            refresh = RefreshToken.for_user(user)
            return Response({
                'message': 'Login successful',
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            })
        else:
            # Check if user exists
            try:
                existing_user = User.objects.get(email=email)
                print(f"DEBUG: User exists but authentication failed. User active: {existing_user.is_active}")
            except User.DoesNotExist:
                print(f"DEBUG: No user found with email: {email}")
            
            return Response({'detail': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)
    
    print(f"DEBUG: Serializer errors: {serializer.errors}")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        refresh_token = request.data.get('refresh_token')
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({'message': 'Logout successful'})
    except Exception:
        return Response({'detail': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile_view(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trigger_prediction(request):
    """Trigger a Celery task for orbital collision prediction"""
    try:
        data = request.data
        sat1_id = data.get('sat1_id')
        sat2_id = data.get('sat2_id')
        
        if not sat1_id or not sat2_id:
            return Response({
                'detail': 'Both sat1_id and sat2_id are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Trigger the Celery task
        task = run_prediction_task.delay(sat1_id, sat2_id)
        
        return Response({
            'message': 'Prediction task started successfully',
            'task_id': task.id,
            'status': 'PENDING'
        }, status=status.HTTP_202_ACCEPTED)
        
    except Exception as e:
        return Response({
            'detail': f'Failed to start prediction: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_prediction_status(request, task_id):
    """Get the status of a prediction task"""
    try:
        from celery.result import AsyncResult
        task_result = AsyncResult(task_id)
        
        response_data = {
            'task_id': task_id,
            'status': task_result.status,
        }
        
        if task_result.ready():
            if task_result.successful():
                response_data['result'] = task_result.result
            else:
                response_data['error'] = str(task_result.info)
        
        return Response(response_data)
        
    except Exception as e:
        return Response({
            'detail': f'Failed to get task status: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_prediction_report(request):
    try:
        data = request.data
        report = PredictionReport.objects.create(
            sat1_id=data.get('sat1_id'),
            sat2_id=data.get('sat2_id'),
            miss_distance=data.get('miss_distance'),
            probability=data.get('probability'),
            tca=data.get('tca')
        )
        serializer = PredictionReportSerializer(report)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

