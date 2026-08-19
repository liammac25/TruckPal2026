import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { C } from './lib/theme';

import HomeScreen from './screens/HomeScreen';
import HoursScreen from './screens/HoursScreen';
import DocumentsScreen from './screens/DocumentsScreen';
import MoreScreen from './screens/MoreScreen';
import ProfileScreen from './screens/ProfileScreen';

import WalkaroundScreen from './screens/WalkaroundScreen';
import TachoScreen from './screens/TachoScreen';
import InfringementsScreen from './screens/InfringementsScreen';
import ParkingScreen from './screens/ParkingScreen';
import ExpensesScreen from './screens/ExpensesScreen';

import AddInfringementScreen from './screens/AddInfringementScreen';
import InfringementDetailScreen from './screens/InfringementDetailScreen';
import AddTachoRecordScreen from './screens/AddTachoRecordScreen';
import TachoDetailScreen from './screens/TachoDetailScreen';
import AddDriveTimeScreen from './screens/AddDriveTimeScreen';
import AddBreakTimeScreen from './screens/AddBreakTimeScreen';
import AddExpenseScreen from './screens/AddExpenseScreen';
import ExpenseDetailScreen from './screens/ExpenseDetailScreen';
import AddDocumentScreen from './screens/AddDocumentScreen';
import ParkingDetailScreen from './screens/ParkingDetailScreen';
import AddWalkaroundScreen from './screens/AddWalkaroundScreen';
import WalkaroundDetailScreen from './screens/WalkaroundDetailScreen';
import SubscriptionScreen from './screens/SubscriptionScreen';
import DrivingActivityScreen from './screens/DrivingActivityScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

/* ── Error Boundary ── */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg, padding: 32 }}>
          <Ionicons name="warning-outline" size={48} color={C.warn} />
          <Text style={{ color: C.text, fontSize: 18, fontWeight: '700', marginTop: 16, textAlign: 'center' }}>
            Something went wrong
          </Text>
          <Text style={{ color: C.textSec, fontSize: 13, marginTop: 8, textAlign: 'center' }}>
            {this.state.error}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.tab,
          borderTopColor: C.tabBorder,
          borderTopWidth: 1,
          height: 64,
          paddingTop: 4,
          paddingBottom: 6,
        },
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.textMut,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          lineHeight: 16,
          marginTop: 4,
        },
        tabBarIconStyle: { marginBottom: 0 },
        tabBarIcon: ({ focused, color }) => {
          const icons: Record<string, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
            Home: ['home', 'home-outline'],
            Hours: ['time', 'time-outline'],
            Docs: ['folder', 'folder-outline'],
            More: ['grid', 'grid-outline'],
            Profile: ['person', 'person-outline'],
          };
          const [filled, outline] = icons[route.name] || ['ellipse', 'ellipse-outline'];
          return <Ionicons name={focused ? filled : outline} size={20} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Hours" component={HoursScreen} />
      <Tab.Screen name="Docs" component={DocumentsScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function Root() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={Tabs} />
      <Stack.Screen name="MoreWalkaround" component={WalkaroundScreen} />
      <Stack.Screen name="MoreTacho" component={TachoScreen} />
      <Stack.Screen name="MoreInfringements" component={InfringementsScreen} />
      <Stack.Screen name="MoreParking" component={ParkingScreen} />
      <Stack.Screen name="MoreExpenses" component={ExpensesScreen} />
      <Stack.Screen name="AddInfringement" component={AddInfringementScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="InfringementDetail" component={InfringementDetailScreen} />
      <Stack.Screen name="AddTachoRecord" component={AddTachoRecordScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="TachoDetail" component={TachoDetailScreen} />
      <Stack.Screen name="AddDriveTime" component={AddDriveTimeScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="AddBreakTime" component={AddBreakTimeScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="ExpenseDetail" component={ExpenseDetailScreen} />
      <Stack.Screen name="AddDocument" component={AddDocumentScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="ParkingDetail" component={ParkingDetailScreen} />
      <Stack.Screen name="AddWalkaround" component={AddWalkaroundScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="WalkaroundDetail" component={WalkaroundDetailScreen} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
      <Stack.Screen name="DrivingActivity" component={DrivingActivityScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({ ...Ionicons.font });

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.loadingTxt}>Loading TruckPal…</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <NavigationContainer>
          <Root />
          <StatusBar style="light" />
        </NavigationContainer>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg, gap: 16 },
  loadingTxt: { color: C.textSec, fontSize: 16 },
});
