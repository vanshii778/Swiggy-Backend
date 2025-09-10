from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'phone', 'profile_picture']
        read_only_fields = ['id']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        validators=[validate_password]
    )
    name = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ['email', 'password', 'name', 'phone']
        extra_kwargs = {
            'email': {'required': True},
        }

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        name = validated_data.pop('name')
        user = User.objects.create_user(
            email=validated_data['email'],
            first_name=name,
            last_name='',
            phone=validated_data.get('phone', ''),
            password=validated_data['password']
        )
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)



class OTPSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    otp = serializers.CharField(max_length=6, required=True)

class ProfileSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    addresses = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'first_name', 'last_name', 'phone', 'profile_picture', 'addresses']
        read_only_fields = ['id', 'email', 'name']

    def get_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or "User"

    def get_addresses(self, obj):
        return [
            {
                'id': addr.id,
                'type': addr.type,
                'street_address': addr.street_address,
                'city': addr.city,
                'state': addr.state,
                'zip_code': addr.zip_code,
            }
            for addr in obj.addresses.all()
        ]

    def update(self, instance, validated_data):
        # Update basic fields
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.phone = validated_data.get('phone', instance.phone)
        instance.save()

        # Update addresses if provided
        addresses_data = self.initial_data.get('addresses')
        if addresses_data is not None:
            # Remove all old addresses and add new ones
            instance.addresses.all().delete()
            for addr in addresses_data:
                instance.addresses.create(
                    type=addr.get('type', 'Home'),
                    street_address=addr.get('street_address', ''),
                    city=addr.get('city', ''),
                    state=addr.get('state', ''),
                    zip_code=addr.get('zip_code', ''),
                )
        return instance

class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, validators=[validate_password])

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data
