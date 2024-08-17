from MotorInsuranceCompany.models import *
from .serializer import *
from rest_framework import viewsets, generics
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from MotorInsuranceCompany.renderers import UserRenderer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta
# views.py
import stripe
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

stripe.api_key = settings.STRIPE_SECRET_KEY

@csrf_exempt
def create_payment_intent(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        try:
            intent = stripe.PaymentIntent.create(
                amount=data['amount'],
                currency='usd',
            )
            return JsonResponse({'clientSecret': intent['client_secret']})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Invalid request method'}, status=400)

class CreatePaymentIntentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        data = request.data
        try:
            intent = stripe.PaymentIntent.create(
                amount=data['amount'],
                currency='usd',
            )
            return Response({'clientSecret': intent['client_secret']})
        except Exception as e:
            return Response({'error': str(e)}, status=400)

# Token generation function
def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

# User registration view
class UserRegistrationView(APIView):
    renderer_classes = [UserRenderer]

    def post(self, request, format=None):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            user = serializer.save()
            token = get_tokens_for_user(user)
            return Response({'token': token, 'msg': 'Registration Successful'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# User login view
class UserLoginView(APIView):
    renderer_classes = [UserRenderer]

    def post(self, request, format=None):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            email = serializer.data.get('email')
            password = serializer.data.get('password')
            user = authenticate(email=email, password=password)
            if user is not None:
                token = get_tokens_for_user(user)
                return Response({'token': token, 'msg': 'Login Successful'}, status=status.HTTP_200_OK)
            return Response({'errors': {'non_field_error': ['Email or Password is invalid.']}}, status=status.HTTP_404_NOT_FOUND)

# User profile view
class UserProfileView(APIView):
    renderer_classes = [UserRenderer]
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

# User change password view
class UserChangePasswordView(APIView):
    renderer_classes = [UserRenderer]
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        serializer = UserChangePasswordSerializer(data=request.data, context={'user': request.user})
        if serializer.is_valid(raise_exception=True):
            return Response({'msg': 'Password Changed Successfully'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Send password reset email view
class SendPasswordResetEmailView(APIView):
    renderer_classes = [UserRenderer]

    def post(self, request, format=None):
        serializer = SendPasswordResetEmailSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            return Response({'msg': 'Password Reset link sent. Please check your Email'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# User password reset view
class UserPasswordResetView(APIView):
    renderer_classes = [UserRenderer]

    def post(self, request, uid, token, format=None):
        serializer = UserPasswordResetSerializer(data=request.data, context={'uid': uid, 'token': token})
        if serializer.is_valid(raise_exception=True):
            return Response({'msg': 'Password Reset Successfully'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Vehicle create view
class VehicleCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AddVehicleSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VehicleDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, vehicle_number):
        try:
            vehicle = Vehicle.objects.get(vehicle_number=vehicle_number, user=request.user)
            serializer = AddVehicleSerializer(vehicle)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Vehicle.DoesNotExist:
            return Response({'error': 'Vehicle not found'}, status=status.HTTP_404_NOT_FOUND)


# Policy create view
class PolicyCreateView(generics.CreateAPIView):
    queryset = Policy.objects.all()
    serializer_class = PolicySerializer
    permission_classes = [IsAuthenticated]

# Policy detail view
class PolicyDetailView(generics.RetrieveAPIView):
    queryset = Policy.objects.all()
    serializer_class = PolicySerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        vehicle_number = self.kwargs.get("vehicle_number")
        try:
            vehicle = Vehicle.objects.get(vehicle_number=vehicle_number)
            return Policy.objects.get(vehicle=vehicle)
        except Vehicle.DoesNotExist:
            raise serializers.ValidationError({'error': 'Vehicle not found'})
        except Policy.DoesNotExist:
            raise serializers.ValidationError({'error': 'Policy not found'})

# Policy update view
class PolicyUpdateView(generics.UpdateAPIView):
    queryset = Policy.objects.all()
    serializer_class = PolicySerializer
    permission_classes = [IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        instance = self.get_object()
        if 'payment_status' in request.data:
            instance.payment_status = request.data['payment_status']
            if instance.payment_status:
                instance.policy_status = "Active"
                instance.effective_from = timezone.now().date()
                instance.expires_on = instance.effective_from + timedelta(days=365)
        instance.save()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

# Send policy on email view
class SendPolicyOnEmailView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        serializer = SendPolicyOnEmailSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            return Response({'msg': 'Policy Details are sent to you. Please check your Email.'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Claim create view
class ClaimCreateView(generics.CreateAPIView):
    queryset = Claim.objects.all()
    serializer_class = ClaimSerializer
    permission_classes = [IsAuthenticated]

# Claim detail view
class ClaimDetailView(generics.RetrieveAPIView):
    queryset = Claim.objects.all()
    serializer_class = ClaimSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        vehicle_number = self.kwargs.get("vehicle_number")
        try:
            vehicle = Vehicle.objects.get(vehicle_number=vehicle_number)
            return Claim.objects.get(vehicle=vehicle)
        except Vehicle.DoesNotExist:
            raise serializers.ValidationError({'error': 'Vehicle not found'})
        except Claim.DoesNotExist:
            raise serializers.ValidationError({'error': 'Claim not found'})
