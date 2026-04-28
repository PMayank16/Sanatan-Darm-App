import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';

import HomeScreen from '../screens/HomeScreen';
import PaymentsScreen from '../screens/PaymentsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import StreakScreen from '../screens/StreakScreen';
import CustomTabBar from '../components/CustomTabBar';
import BookPanditScreen from '../screens/BookPanditScreen';

const Tab = createBottomTabNavigator();

export default function MainTabs({ user, onAction }) {
  return (
    <NavigationContainer>
      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="Home">
          {(props) => <HomeScreen {...props} user={user} onAction={onAction} />}
        </Tab.Screen>
        <Tab.Screen name="Payments">
          {(props) => <PaymentsScreen {...props} user={user} onBack={() => props.navigation.navigate('Home')} />}
        </Tab.Screen>
        <Tab.Screen name="Streak">
          {(props) => <StreakScreen {...props} user={user} />}
        </Tab.Screen>
        <Tab.Screen name="Profile">
          {(props) => <ProfileScreen {...props} onAction={onAction} />}
        </Tab.Screen>
        <Tab.Screen name="BookPandit">
          {(props) => <BookPanditScreen {...props} onAction={onAction} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}
