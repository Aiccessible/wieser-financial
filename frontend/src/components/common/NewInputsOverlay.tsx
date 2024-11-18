import React, { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../hooks'
import * as Dialog from '../../components/native/Dialog'
import { X } from 'lucide-react-native'
import { useTransition, animated, config } from '@react-spring/native'
import { Dimensions, TextInput, TouchableOpacity, View, Text } from 'react-native'
import { CustomTextBox } from './CustomTextBox'
import { financialProjectionKeys } from '../hooks/useDefaultValuesForProjection'
import { generateClient } from 'aws-amplify/api'
import { getFinancialProjection } from '../../../src/features/analysis'

export const NewInputsOverlay = ({
    inputs,
    handleInputChange,
}: {
    inputs: Record<string, any>
    handleInputChange: ({ target: { name, value } }: { target: { name: string; value: string } }) => void
}) => {
    const newInputs = useAppSelector((state) => state.analysis.newSimulationInputs)
    const filteredInputs = newInputs?.filter((key) => !financialProjectionKeys.has(key as any))
    const s3Key = useAppSelector((state) => state.analysis.activeSimulationKey)
    const description = useAppSelector((state) => state.analysis.activeSimulationDescription)
    const [open, setOpen] = useState(false)
    useEffect(() => {
        console.info(newInputs, 838383)
        if (newInputs?.length) setOpen(true)
    }, [newInputs])
    const transitions = useTransition(newInputs, {
        from: { opacity: 0, y: -10 },
        enter: { opacity: 1, y: 0 },
        leave: { opacity: 0, y: 10 },
        config: config.wobbly,
    })
    const dispatch = useAppDispatch()

    if (!newInputs) {
        return <></>
    }

    const client = generateClient()
    const getProjection = () => {
        dispatch(
            getFinancialProjection({
                client,
                input: {
                    inputs: { ...(inputs as any) },
                    s3_key: s3Key,
                } as any,
                path: '/v1/analyze/analyze',
            })
        )
        setOpen(false)
    }
    return (
        <Dialog.Root open={open}>
            <Dialog.Portal>
                {transitions((styles, item: any) =>
                    item ? (
                        <>
                            <Dialog.Overlay className="bg-black/95 fixed inset-0 z-9999">
                                <animated.View
                                    className="relative dark:bg-gray-800 w-full max-w-3xl rounded-lg shadow-3xl overflow-hidden"
                                    style={{
                                        opacity: styles.opacity,
                                    }}
                                />
                            </Dialog.Overlay>
                            <Dialog.Content className="fixed inset-0 flex items-center justify-center p-4 z-9999">
                                <animated.View
                                    className="relative dark:bg-gray-800 w-full max-w-3xl rounded-lg shadow-3xl overflow-hidden"
                                    style={styles}
                                >
                                    <View
                                        style={{
                                            width: Dimensions.get('screen').width,
                                            height: Dimensions.get('screen').height,
                                        }}
                                        className="relative flex  dark:bg-gray-800 w-full max-w-3xl rounded-lg shadow-3xl bg-black align-center"
                                    >
                                        <View className=" items-center justify-between p-4 bg-gray-100 dark:bg-gray-900 hide-scrollbar border-b border-gray-300 dark:border-gray-700">
                                            <Dialog.Close onClick={() => setOpen(false)} asChild>
                                                <TouchableOpacity
                                                    style={{ alignSelf: 'flex-end' }}
                                                    className="text-red-500 hover:text-red-700 text-4xl"
                                                >
                                                    <X size={36} />
                                                </TouchableOpacity>
                                            </Dialog.Close>
                                        </View>
                                        <Text className="font-bold text-lg ml-[10px] text-white">
                                            New Inputs Needed
                                        </Text>
                                        {filteredInputs?.map((field) => (
                                            <View key={field} style={{ marginLeft: 15, marginTop: 10 }}>
                                                <View
                                                    className="block text-sm font-medium capitalize "
                                                    style={{ paddingBottom: 2 }}
                                                >
                                                    <CustomTextBox>
                                                        {field.replace('initial_', '').replace(/_/g, ' ')}
                                                    </CustomTextBox>
                                                </View>
                                                <TextInput
                                                    onChangeText={(e) =>
                                                        handleInputChange({ target: { name: field, value: e } })
                                                    }
                                                    keyboardType="numeric"
                                                    value={(inputs as any)?.[field] ?? ''}
                                                    className="w-[90%] p-2 text-primary text-primary border rounded ml-4"
                                                />
                                                521200
                                            </View>
                                        ))}
                                        <View style={{ marginTop: 10, marginHorizontal: 10 }}>
                                            <CustomTextBox>{description}</CustomTextBox>
                                        </View>
                                        <TouchableOpacity
                                            style={{ marginTop: 10, marginHorizontal: 10 }}
                                            className="bg-gradient-to-r text-center bg-primary active:scale-95 text-black py-4 px-6 rounded-lg shadow-lg transform transition duration-300 ease-in-out mt-4"
                                            onPressOut={getProjection}
                                        >
                                            <Text className="text-xl text-center font-bold tracking-wider text-black">
                                                Run Wieser Simulation
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </animated.View>
                            </Dialog.Content>
                        </>
                    ) : null
                )}
            </Dialog.Portal>
        </Dialog.Root>
    )
}