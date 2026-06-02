import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import MisafirDernekBasvuruScreen from '../screens/auth/MisafirDernekBasvuruScreen';

export type AuthStackParamList = {
  Giris: undefined;
  /** `yeniDernekBasvuru`: hesap açılır, dernek seçilmez; giriş sonrası platform başvuru formu. */
  Kayit: { yeniDernekBasvuru?: boolean };
  SifremiUnuttum: undefined;
  MisafirDernekBasvuru: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Giris" component={LoginScreen} />
      <Stack.Screen name="Kayit" component={RegisterScreen} />
      <Stack.Screen name="SifremiUnuttum" component={ForgotPasswordScreen} />
      <Stack.Screen name="MisafirDernekBasvuru" component={MisafirDernekBasvuruScreen} />
    </Stack.Navigator>
  );
}
