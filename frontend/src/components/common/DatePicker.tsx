import { getYesterdaySummaryAsyncThunk, setCurrentDateRange } from '../../features/transactions'
import { useAppDispatch, useAppSelector } from '../../../src/hooks'
import React, { useEffect, useState } from 'react'
import DatePicker from 'react-multi-date-picker'
import { useParams } from 'react-router-dom'
import { generateClient } from 'aws-amplify/api'

export function DatePickerCustom() {
    const dateRange = useAppSelector((state) => state.transactions.currentDateRange)
    const dispatch = useAppDispatch()
    const { id } = useParams()
    const client = generateClient()
    useEffect(() => {
        console.log(dateRange)
        if (dateRange?.[0] && dateRange?.[1]) {
            console.log('dispatching')
            dispatch(getYesterdaySummaryAsyncThunk({ id: id || '', client, append: false }))
        }
    }, [dateRange])
    return (
        <DatePicker
            range
            value={dateRange ?? [new Date()]}
            onChange={(value) => {
                dispatch(setCurrentDateRange(value.map((date) => date.toDate().getTime())))
            }}
        />
    )
}
