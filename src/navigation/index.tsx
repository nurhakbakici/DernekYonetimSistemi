import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AuthNavigator from './AuthNavigator';
import OnboardingNavigator from './OnboardingNavigator';
import MainNavigator from './MainNavigator';
import DuyuruNotificationBridge from '../components/DuyuruNotificationBridge';
import KullaniciBildirimBridge from '../components/KullaniciBildirimBridge';
import AidatIlkYuklemeBridge from '../components/AidatIlkYuklemeBridge';

export default function AppNavigator() {
  const { kullanici, yukleniyor, oturumAcik } = useAuth();

  if (yukleniyor) {
    return <LoadingSpinner mesaj="Yükleniyor..." />;
  }

  return (
    <NavigationContainer>
      {!oturumAcik ? (
        <AuthNavigator />
      ) : !kullanici ? (
        <OnboardingNavigator />
      ) : (
        <>
          <MainNavigator />
          <AidatIlkYuklemeBridge />
          <DuyuruNotificationBridge />
          <KullaniciBildirimBridge />
        </>
      )}
    </NavigationContainer>
  );
}
