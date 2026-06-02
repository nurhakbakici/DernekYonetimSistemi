import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OnboardingDernekScreen from '../screens/onboarding/OnboardingDernekScreen';
import DernekBasvuruFormScreen from '../screens/onboarding/DernekBasvuruFormScreen';
import BasvuruBekleniyorScreen from '../screens/onboarding/BasvuruBekleniyorScreen';
import type { OnboardingStackParamList } from './onboardingTypes';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export default function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DernekSecimi" component={OnboardingDernekScreen} />
      <Stack.Screen name="DernekBasvuruForm" component={DernekBasvuruFormScreen} />
      <Stack.Screen name="BasvuruBekleniyor" component={BasvuruBekleniyorScreen} />
    </Stack.Navigator>
  );
}
