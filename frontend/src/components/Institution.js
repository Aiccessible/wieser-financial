import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // Assuming React Navigation is used for navigation
import { CustomTextBox } from './common/CustomTextBox';

export default function Institution({ institution }) {
  const navigation = useNavigation();

  const handlePress = () => {
    navigation.navigate('InstitutionDetail', { id: institution.item_id }); // Adjust based on your navigation setup
  };

  return (
      <View style={styles.row}>
          <Pressable onPress={handlePress} style={styles.cell}>
              <CustomTextBox>{institution.institution_name}</CustomTextBox>
          </Pressable>
      </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  cell: {
    flex: 1,
  },
  linkText: {
    color: '#007AFF', // Link color
    textDecorationLine: 'underline',
  },
});