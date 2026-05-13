import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { tamUyeOzelliklerineErisir } from '../utils/userAccess';

import HomeScreen from '../screens/home/HomeScreen';
import RoomsScreen from '../screens/rooms/RoomsScreen';
import ReservationFormScreen from '../screens/rooms/ReservationFormScreen';
import MyReservationsScreen from '../screens/rooms/MyReservationsScreen';
import ReservationCalendarScreen from '../screens/rooms/ReservationCalendarScreen';
import LibraryScreen from '../screens/library/LibraryScreen';
import BookDetailScreen from '../screens/library/BookDetailScreen';
import AddBookScreen from '../screens/library/AddBookScreen';
import ScholarshipsScreen from '../screens/scholarships/ScholarshipsScreen';
import ScholarshipDetailScreen from '../screens/scholarships/ScholarshipDetailScreen';
import EventsScreen from '../screens/events/EventsScreen';
import EventDetailScreen from '../screens/events/EventDetailScreen';
import AddEventScreen from '../screens/events/AddEventScreen';
import EditEventScreen from '../screens/events/EditEventScreen';
import MembershipScreen from '../screens/membership/MembershipScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';
import AdminScreen from '../screens/admin/AdminScreen';
import AdminReservationsScreen from '../screens/admin/AdminReservationsScreen';
import AdminEventsScreen from '../screens/admin/AdminEventsScreen';
import AdminMembershipScreen from '../screens/admin/AdminMembershipScreen';
import AdminStatusScreen from '../screens/admin/AdminStatusScreen';
import AdminScholarshipsScreen from '../screens/admin/AdminScholarshipsScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AddRoomScreen from '../screens/rooms/AddRoomScreen';
import AddScholarshipScreen from '../screens/scholarships/AddScholarshipScreen';
import DuyurularScreen from '../screens/announcements/DuyurularScreen';
import AdminDuyurularScreen from '../screens/admin/AdminDuyurularScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Duyurular" component={DuyurularScreen} />
    </Stack.Navigator>
  );
}

function RoomsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RoomsMain" component={RoomsScreen} />
      <Stack.Screen name="ReservationForm" component={ReservationFormScreen} />
      <Stack.Screen name="MyReservations" component={MyReservationsScreen} />
      <Stack.Screen name="ReservationCalendar" component={ReservationCalendarScreen} />
      <Stack.Screen name="AddRoom" component={AddRoomScreen} />
    </Stack.Navigator>
  );
}

function LibraryStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LibraryMain" component={LibraryScreen} />
      <Stack.Screen name="BookDetail" component={BookDetailScreen} />
      <Stack.Screen name="AddBook" component={AddBookScreen} />
    </Stack.Navigator>
  );
}

function ScholarshipsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ScholarshipsMain" component={ScholarshipsScreen} />
      <Stack.Screen name="ScholarshipDetail" component={ScholarshipDetailScreen} />
      <Stack.Screen name="AddScholarship" component={AddScholarshipScreen} />
    </Stack.Navigator>
  );
}

function EventsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="EventsMain" component={EventsScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      <Stack.Screen name="AddEvent" component={AddEventScreen} />
      <Stack.Screen name="EditEvent" component={EditEventScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="SifreDegistir" component={ChangePasswordScreen} />
      <Stack.Screen name="Membership" component={MembershipScreen} />
      <Stack.Screen name="Admin" component={AdminScreen} />
      <Stack.Screen name="AdminReservations" component={AdminReservationsScreen} />
      <Stack.Screen name="AdminEvents" component={AdminEventsScreen} />
      <Stack.Screen name="AdminMembership" component={AdminMembershipScreen} />
      <Stack.Screen name="AdminStatus" component={AdminStatusScreen} />
      <Stack.Screen name="AdminScholarships" component={AdminScholarshipsScreen} />
      <Stack.Screen name="AdminAddScholarship" component={AddScholarshipScreen} />
      <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
      <Stack.Screen name="AdminDuyurular" component={AdminDuyurularScreen} />
    </Stack.Navigator>
  );
}

export default function MainNavigator() {
  const insets = useSafeAreaInsets();
  const { kullanici } = useAuth();
  const tabBarBottomPad = Math.max(insets.bottom, 10);
  const tamErisim = tamUyeOzelliklerineErisir(kullanici);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingTop: 4,
          paddingBottom: tabBarBottomPad,
          minHeight: 52 + tabBarBottomPad,
        },
        tabBarActiveTintColor: Colors.primaryLight,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size, focused }) => {
          const icons: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
            Ana: { active: 'home', inactive: 'home-outline' },
            Odalar: { active: 'business', inactive: 'business-outline' },
            Kutuphane: { active: 'library', inactive: 'library-outline' },
            Etkinlikler: { active: 'calendar', inactive: 'calendar-outline' },
            Burslar: { active: 'school', inactive: 'school-outline' },
            Profil: { active: 'person', inactive: 'person-outline' },
          };
          const iconSet = icons[route.name];
          const iconName = iconSet ? (focused ? iconSet.active : iconSet.inactive) : 'help-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Ana" component={HomeStack} options={{ tabBarLabel: 'Ana Sayfa' }} />
      {tamErisim && (
        <>
          <Tab.Screen name="Odalar" component={RoomsStack} options={{ tabBarLabel: 'Odalar' }} />
          <Tab.Screen name="Kutuphane" component={LibraryStack} options={{ tabBarLabel: 'Kütüphane' }} />
        </>
      )}
      <Tab.Screen name="Etkinlikler" component={EventsStack} options={{ tabBarLabel: 'Etkinlikler' }} />
      <Tab.Screen name="Burslar" component={ScholarshipsStack} options={{ tabBarLabel: 'Burslar' }} />
      <Tab.Screen
        name="Profil"
        component={ProfileStack}
        options={{ tabBarLabel: 'Profil' }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Profil stack’i (ör. Yönetici Paneli) açık bırakılırsa sekmede takılı kalınıyordu;
            e.preventDefault();
            // sekmeye basınca her zaman hesap özeti + çıkış ekranına dön.
            navigation.navigate('Profil', { screen: 'ProfileMain' });
          },
        })}
      />
    </Tab.Navigator>
  );
}