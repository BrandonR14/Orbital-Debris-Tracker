from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import Satellite, TLEEntry, RiskReport, PredictionReport, User
import requests as http_requests
import os
import time as time_module

# Simple in-memory TLE cache to avoid hammering Space-Track
_TLE_CACHE: dict = {}
_TLE_CACHE_TTL = 1800  # 30 minutes
from .serializers import (
    SatelliteSerializer, TLEEntrySerializer, RiskReportSerializer,
    PredictionReportSerializer, UserSerializer, LoginSerializer
)
from .tasks import run_prediction_task


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
        user = authenticate(username=email, password=password)
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
        return Response({'detail': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)
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
    sat1_id = request.data.get('sat1_id')
    sat2_id = request.data.get('sat2_id')

    if not sat1_id or not sat2_id:
        return Response(
            {'detail': 'Both sat1_id and sat2_id are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        task = run_prediction_task.delay(sat1_id, sat2_id, request.user.id)
        return Response({
            'message': 'Prediction task started',
            'task_id': task.id,
            'status': 'PENDING',
        }, status=status.HTTP_202_ACCEPTED)
    except Exception as e:
        return Response(
            {'detail': f'Failed to start prediction: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_prediction_status(request, task_id):
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
        return Response(
            {'detail': f'Failed to get task status: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def prediction_history(request):
    reports = PredictionReport.objects.filter(user=request.user).order_by('-created_at')
    serializer = PredictionReportSerializer(reports, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def satellite_tle_data(request):
    reports = PredictionReport.objects.filter(user=request.user)
    norad_ids = set()
    for r in reports:
        if r.sat1_id:
            norad_ids.add(str(r.sat1_id))
        if r.sat2_id:
            norad_ids.add(str(r.sat2_id))

    if not norad_ids:
        return Response([])

    now = time_module.time()
    result = []
    ids_to_fetch = []

    for nid in norad_ids:
        if nid in _TLE_CACHE and now - _TLE_CACHE[nid]['ts'] < _TLE_CACHE_TTL:
            result.append(_TLE_CACHE[nid]['data'])
        else:
            ids_to_fetch.append(nid)

    if ids_to_fetch:
        st_user = os.getenv('SPACETRACK_USER', '')
        st_pass = os.getenv('SPACETRACK_PASS', '')
        if not st_user or not st_pass:
            return Response(result)

        try:
            session = http_requests.Session()
            login_resp = session.post(
                'https://www.space-track.org/ajaxauth/login',
                data={'identity': st_user, 'password': st_pass},
                timeout=15,
            )
            if 'Failed' in login_resp.text or 'failed' in login_resp.text:
                return Response({'detail': 'Space-Track login failed'}, status=status.HTTP_502_BAD_GATEWAY)

            ids_str = ','.join(ids_to_fetch)
            url = (
                f'https://www.space-track.org/basicspacedata/query/class/gp'
                f'/NORAD_CAT_ID/{ids_str}/orderby/EPOCH%20desc/limit/{len(ids_to_fetch)}/format/json'
            )
            tle_resp = session.get(url, timeout=20)
            tle_resp.raise_for_status()
            entries = tle_resp.json()

            seen = set()
            for entry in entries:
                nid = str(entry.get('NORAD_CAT_ID', ''))
                if nid in seen:
                    continue
                seen.add(nid)
                data = {
                    'norad_id': nid,
                    'name': entry.get('OBJECT_NAME', f'NORAD {nid}'),
                    'tle_line1': entry.get('TLE_LINE1', ''),
                    'tle_line2': entry.get('TLE_LINE2', ''),
                }
                _TLE_CACHE[nid] = {'ts': now, 'data': data}
                result.append(data)
        except Exception as e:
            return Response({'detail': f'TLE fetch error: {str(e)}'}, status=status.HTTP_502_BAD_GATEWAY)

    return Response(result)
