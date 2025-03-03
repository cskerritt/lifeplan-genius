from rest_framework import serializers
from django.contrib.auth.models import User
from lifecare.models import Evaluee, LifeCarePlan, CarePlanEntry, GeographicFactor, CPTCode

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']

class EvalueeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Evaluee
        fields = '__all__'

class CarePlanEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = CarePlanEntry
        fields = '__all__'

class LifeCarePlanSerializer(serializers.ModelSerializer):
    entries = CarePlanEntrySerializer(many=True, read_only=True)
    
    class Meta:
        model = LifeCarePlan
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # Ensure the current user is set as the plan owner
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class GeographicFactorSerializer(serializers.ModelSerializer):
    class Meta:
        model = GeographicFactor
        fields = '__all__'

class CPTCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CPTCode
        fields = '__all__'
