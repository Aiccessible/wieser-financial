import React, { useEffect, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { useAppDispatch, useAppSelector } from '../../../src/hooks'
import { getYesterdaySummaryAsyncThunk, setCurrentDateRange } from '../../features/transactions'
import { updateDateRange } from '../../../src/features/chat'
import { Calendar } from 'react-native-calendars'
import { generateClient } from 'aws-amplify/api'

interface MarkedDates {
    [date: string]: {
        startingDay?: boolean
        endingDay?: boolean
        color: string
        textColor: string
    }
}

export function DatePickerCustom() {
    const dateRange = useAppSelector((state) => state.transactions.currentDateRange)
    const dispatch = useAppDispatch()
    const client = generateClient()

    const [selectedRange, setSelectedRange] = useState<{
        startDate: string | null
        endDate: string | null
    }>({
        startDate: dateRange?.[0] ? new Date(dateRange[0]).toISOString().split('T')[0] : null,
        endDate: dateRange?.[1] ? new Date(dateRange[1]).toISOString().split('T')[0] : null,
    })

    useEffect(() => {
        if (selectedRange.startDate && selectedRange.endDate) {
            dispatch(getYesterdaySummaryAsyncThunk({ client, append: false }))
        }
    }, [selectedRange, dispatch])

    const handleDayPress = (day: any) => {
        const { startDate, endDate } = selectedRange

        if (!startDate || (startDate && endDate)) {
            // Reset range selection
            setSelectedRange({ startDate: day.dateString, endDate: null })
        } else {
            // Set end date if valid
            setSelectedRange({ startDate, endDate: day.dateString })
            const start = new Date(startDate).getTime()
            const end = new Date(day.dateString).getTime()
            dispatch(updateDateRange([start, end]))
            dispatch(setCurrentDateRange([start, end]))
        }
    }

    const getMarkedDates = (): MarkedDates => {
        const { startDate, endDate } = selectedRange
        const marked: MarkedDates = {}

        if (startDate) {
            marked[startDate] = { startingDay: true, color: '#a5d6a7', textColor: 'white' }
        }

        if (endDate) {
            marked[endDate] = { endingDay: true, color: '#a5d6a7', textColor: 'white' }
        }

        if (startDate && endDate) {
            getDatesInRange(startDate, endDate).forEach((date) => {
                if (date !== startDate && date !== endDate) {
                    marked[date] = { color: '#d5e8d4', textColor: 'black' }
                }
            })
        }

        return marked
    }

    const getDatesInRange = (startDate: string, endDate: string): string[] => {
        const dates: string[] = []
        let currentDate = new Date(startDate)
        const end = new Date(endDate)

        while (currentDate <= end) {
            dates.push(currentDate.toISOString().split('T')[0])
            currentDate.setDate(currentDate.getDate() + 1)
        }

        return dates
    }

    return (
        <View style={styles.container}>
            <Calendar
                markingType="period"
                markedDates={getMarkedDates()}
                onDayPress={handleDayPress}
                theme={{
                    calendarBackground: '#122011',
                    dayTextColor: '#a5d6a7',
                    arrowColor: '#a5d6a7',
                    textDayFontSize: 18,
                    textMonthFontSize: 20,
                    textDayHeaderFontSize: 16,
                }}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: '#122011',
        flex: 1,
    },
})
