import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { CustomerView } from '../screens/CustomerView';
import { AdminQueue } from '../screens/AdminQueue';
import { AdminAnalytics } from '../screens/AdminAnalytics';
import { PrivacyPolicy } from '../screens/PrivacyPolicy';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  const { t, i18n } = useTranslation();
  const { theme, isDark, toggleTheme } = useTheme();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'ckb' : i18n.language === 'ckb' ? 'ar' : 'en';
    i18n.changeLanguage(nextLang);
  };

  const renderHeaderRight = (navigation: any) => (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <TouchableOpacity
        onPress={toggleLanguage}
        style={{
          marginRight: 14,
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 8,
          backgroundColor: theme.backgroundSecondary,
          borderWidth: 1,
          borderColor: theme.border,
        }}
      >
        <Text style={{ color: theme.primary, fontWeight: '800', fontSize: 13, letterSpacing: 0.5 }}>{i18n.language.toUpperCase()}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={toggleTheme}
        style={{
          marginRight: 14,
          padding: 6,
          borderRadius: 10,
          backgroundColor: theme.backgroundSecondary,
          borderWidth: 1,
          borderColor: theme.border,
        }}
      >
        <Ionicons name={isDark ? 'sunny' : 'moon'} size={20} color={theme.primary} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate('AdminQueue')}
        style={{
          padding: 6,
          borderRadius: 10,
          backgroundColor: theme.primaryLight,
          borderWidth: 1,
          borderColor: theme.border,
        }}
      >
        <MaterialCommunityIcons name="shield-account" size={22} color={theme.primary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={({ navigation }: { navigation: any }) => ({
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.primary,
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '800', fontSize: 20, letterSpacing: 1.2, color: theme.text },
          headerRight: () => renderHeaderRight(navigation),
        })}
      >
        <Stack.Screen 
          name="CustomerView" 
          component={CustomerView} 
          options={{ title: 'RABAR BARBER' }} 
        />
        <Stack.Screen 
          name="AdminQueue" 
          component={AdminQueue} 
          options={({ navigation }: { navigation: any }) => ({
            title: t('adminQueue').toUpperCase(),
            headerRight: () => (
              <TouchableOpacity
                onPress={() => navigation.navigate('AdminAnalytics')}
                style={{
                  padding: 6,
                  borderRadius: 10,
                  backgroundColor: theme.primaryLight,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
              >
                <Ionicons name="stats-chart" size={20} color={theme.primary} />
              </TouchableOpacity>
            )
          })} 
        />
        <Stack.Screen 
          name="AdminAnalytics" 
          component={AdminAnalytics} 
          options={{ title: t('adminAnalytics').toUpperCase() }} 
        />
        <Stack.Screen
          name="PrivacyPolicy"
          component={PrivacyPolicy}
          options={{ title: t('privacyPolicy') }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
