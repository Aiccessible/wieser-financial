import React from 'react'
import { View, Text, FlatList, StyleSheet } from 'react-native'
import Institution from './Institution' // Ensure this component is also adapted for React Native
import { CustomTextBox } from './common/CustomTextBox' // Adapt this for React Native

export default function Institutions({ institutions = [] }) {
    return (
        <View style={styles.container}>
            {institutions.length ? (
                <FlatList
                    data={institutions}
                    keyExtractor={(item) => item.institution_id.toString()}
                    renderItem={({ item }) => <Institution institution={item} />}
                />
            ) : (
                <View style={styles.noDataRow}>
                    <Text style={styles.noDataText}>No institutions found</Text>
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
    },
    headerRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        backgroundColor: '#f0f0f0',
    },
    headerCell: {
        fontWeight: 'bold',
        flex: 1,
    },
    noDataRow: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    noDataText: {
        fontSize: 16,
        color: '#999',
    },
})
