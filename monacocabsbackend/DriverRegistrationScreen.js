import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';

const DriverRegistrationScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    contactNumber: '',
    address: '',
    vehicleInfo: '',
  });
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
  };

  const handleSelectDocuments = async () => {
    try {
      const results = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        multiple: true,
        copyToCacheDirectory: true
      });

      if (results.canceled) {
        return;
      }

      // Validate file sizes (max 5MB each)
      const invalidFiles = results.assets.filter(
        file => file.size > 5 * 1024 * 1024
      );
      
      if (invalidFiles.length > 0) {
        Alert.alert('Error', 'Some files are too large. Maximum size is 5MB per file.');
        return;
      }

      setDocuments(results.assets);
      Alert.alert('Success', `${results.assets.length} document(s) selected.`);
    } catch (err) {
      console.error('Error selecting documents:', err);
      Alert.alert('Error', 'Failed to select documents.');
    }
  };

  const validateForm = () => {
    if (Object.values(formData).some(value => !value.trim())) {
      Alert.alert('Error', 'All fields are required.');
      return false;
    }

    if (!validateEmail(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return false;
    }

    if (!validatePassword(formData.password)) {
      Alert.alert('Error', 'Password must be at least 6 characters long.');
      return false;
    }

    if (!validatePhone(formData.contactNumber)) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number.');
      return false;
    }

    if (documents.length === 0) {
      Alert.alert('Error', 'Please upload required documents.');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    const formDataToSend = new FormData();

    // Append form fields
    Object.keys(formData).forEach(key => {
      formDataToSend.append(key, formData[key]);
    });

    // Append documents
    documents.forEach((doc, index) => {
      formDataToSend.append('documents', {
        uri: doc.uri,
        type: doc.mimeType || 'application/octet-stream',
        name: doc.name || `document_${index}.${doc.uri.split('.').pop()}`,
      });
    });

    try {
      const response = await axios.post('http://192.168.224.14:5000/driver/register', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 10000, // 10 second timeout
      });

      Alert.alert(
        'Success',
        'Registration successful! Please wait for admin approval.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Home')
          }
        ]
      );
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to register. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Driver Registration</Text>

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={formData.name}
          onChangeText={(value) => handleInputChange('name', value)}
          placeholderTextColor="#666"
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={formData.email}
          onChangeText={(value) => handleInputChange('email', value)}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#666"
        />

        <TextInput
          style={styles.input}
          placeholder="Password (min 6 characters)"
          value={formData.password}
          onChangeText={(value) => handleInputChange('password', value)}
          secureTextEntry
          placeholderTextColor="#666"
        />

        <TextInput
          style={styles.input}
          placeholder="Contact Number (10 digits)"
          value={formData.contactNumber}
          onChangeText={(value) => handleInputChange('contactNumber', value)}
          keyboardType="phone-pad"
          maxLength={10}
          placeholderTextColor="#666"
        />

        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="Address"
          value={formData.address}
          onChangeText={(value) => handleInputChange('address', value)}
          multiline
          numberOfLines={3}
          placeholderTextColor="#666"
        />

        <TextInput
          style={styles.input}
          placeholder="Vehicle Info (e.g., Toyota Innova, KA-01-AB-1234)"
          value={formData.vehicleInfo}
          onChangeText={(value) => handleInputChange('vehicleInfo', value)}
          placeholderTextColor="#666"
        />

        <TouchableOpacity
          style={styles.documentButton}
          onPress={handleSelectDocuments}
        >
          <Text style={styles.documentButtonText}>
            {documents.length > 0 
              ? `Selected Documents: ${documents.length}`
              : 'Select Documents (License, RC, etc.)'
            }
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.registerButton, loading && styles.disabledButton]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.registerButtonText}>Register as Driver</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#333',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#333',
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 15,
  },
  documentButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginBottom: 15,
  },
  documentButtonText: {
    color: '#007AFF',
    textAlign: 'center',
    fontSize: 16,
  },
  registerButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  disabledButton: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DriverRegistrationScreen;