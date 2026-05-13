import React, { Fragment } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import DuyuruNotificationBridge from '../components/DuyuruNotificationBridge';
import AidatIlkYuklemeBridge from '../components/AidatIlkYuklemeBridge';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { kullanici, yukleniyor } = useAuth();

  if (yukleniyor) {
    return <LoadingSpinner mesaj="Yükleniyor..." />;
  }

  return (
    <NavigationContainer>
      {kullanici ? (
        <Fragment>
          <MainNavigator />
          <AidatIlkYuklemeBridge />
          <DuyuruNotificationBridge />
        </Fragment>
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}
