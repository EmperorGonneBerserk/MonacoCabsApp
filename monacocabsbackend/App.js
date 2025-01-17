import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage'; // For token storage
import BookingsScreen from './screens/BookingsScreen';
import CreateBookingScreen from './screens/CreateBookingsScreen';
import MapBookingScreen from './screens/MapBookingScreen';
import DriverRegistrationScreen from './screens/DriverRegistrationScreen';
import LoginScreen from './screens/LoginScreen'; // New Login Screen
import HomeScreen from './screens/HomeScreen'; // Moved HomeScreen to its own file
import SignupScreen from './screens/SignupScreen';

// Create a Stack Navigator
const Stack = createNativeStackNavigator();

const App = () => {
  const [token, setToken] = useState(null); // State to store the JWT token
  const [isLoading, setIsLoading] = useState(true); // Splash/loading state

  // Check if the user is logged in
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        if (storedToken) {
          setToken(storedToken);
        }
      } catch (error) {
        console.error('Error checking login status:', error);
      } finally {
        setIsLoading(false);
      }
    };
    checkLoginStatus();
  }, []);

  // Show a loading screen while checking login status
  if (isLoading) {
    return null; // Can replace this with a loading spinner or splash screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {/* Redirect to Login Screen if no token */}
        {!token ? (
          <>
          <Stack.Screen name="Login">
            {props => <LoginScreen {...props} setToken={setToken} />}
          </Stack.Screen>
          <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        ) : (
          <>
            {/* Main App Screens */}
            <Stack.Screen name="Home">
              {props => <HomeScreen {...props} setToken={setToken} />}
            </Stack.Screen>
            <Stack.Screen name="Bookings">
              {props => <BookingsScreen {...props} token={token} />}
            </Stack.Screen>
            <Stack.Screen name="CreateBooking">
              {props => <CreateBookingScreen {...props} token={token} />}
            </Stack.Screen>
            <Stack.Screen name="MapBookingScreen">
              {props => <MapBookingScreen {...props} token={token} />}
            </Stack.Screen>
            <Stack.Screen name="DriverRegistration" component={DriverRegistrationScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
