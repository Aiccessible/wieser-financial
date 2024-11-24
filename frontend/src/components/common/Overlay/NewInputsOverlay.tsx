import React, { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../../hooks'
import * as Dialog from '../../native/Dialog'
import { X } from 'lucide-react'
import { useTransition, animated, config } from 'react-spring'
import { Dimensions } from 'react-native'
import { CustomTextBox } from '../Custom/CustomTextBox'
import { financialProjectionKeys } from '../../hooks/useDefaultValuesForProjection'
import { Button } from '@aws-amplify/ui-react'
import Markdown from 'react-markdown'
import { useSimulatedExperiment } from '../../../hooks/useSimulatedExperiment'
import { retryCodeBuildAsyncThunk } from '../../../../src/features/analysis'
import { generateClient } from 'aws-amplify/api'

export const NewInputsOverlay = ({
    inputs,
    handleInputChange,
}: {
    inputs: Record<string, any>
    handleInputChange: ({ target: { name, value } }: { target: { name: string; value: string } }) => void
}) => {
    const newInputs = useAppSelector((state) => state.analysis.newSimulationInputs)
    const filteredInputs = newInputs?.filter((key) => !financialProjectionKeys.has(key as any))
    const description = useAppSelector((state) => state.analysis.activeSimulationDescription)
    const [open, setOpen] = useState(false)
    const activeTitle = useAppSelector((state) => state.analysis.activeSimulationTitle)
    const { getProjection } = useSimulatedExperiment({ inputs, setOpen })
    const waiting = useAppSelector((state) => state.analysis.waitingForCodeGeneration)
    useEffect(() => {
        if (newInputs?.length) {
            setOpen(true)
            newInputs?.forEach((el) => handleInputChange({ target: { name: el.name, value: el.defaultValue } }))
        }
    }, [newInputs])
    const transitions = useTransition(newInputs, {
        from: { opacity: 0, y: -10 },
        enter: { opacity: 1, y: 0 },
        leave: { opacity: 0, y: 10 },
        config: config.wobbly,
    })
    const error = useAppSelector((state) => state.analysis.loadingProjectionsError)

    if (!newInputs) {
        return <></>
    }

    return (
        <Dialog.Root open={open}>
            <Dialog.Portal>
                {transitions((styles, item: any) =>
                    item ? (
                        <>
                            <Dialog.Overlay className="bg-black/95 fixed inset-0 z-9999">
                                <animated.div
                                    className="relative dark:bg-gray-800 w-full max-w-3xl rounded-lg shadow-3xl overflow-hidden"
                                    style={{
                                        opacity: styles.opacity,
                                    }}
                                />
                            </Dialog.Overlay>
                            <Dialog.Content className="fixed inset-0 flex  justify-center p-4 z-9999">
                                <animated.div
                                    className="relative dark:bg-gray-800 w-full max-w-3xl rounded-lg shadow-3xl overflow-auto hide-scrollbar"
                                    style={styles}
                                >
                                    <div
                                        style={{
                                            width: Dimensions.get('screen').width,
                                            height: Dimensions.get('screen').height,
                                            top: 10,
                                        }}
                                        className="relative flex flex-col  dark:bg-gray-800 w-full max-w-3xl rounded-lg shadow-3xl bg-black align-center"
                                    >
                                        <div className=" items-center justify-between p-4 bg-gray-100 dark:bg-gray-900 hide-scrollbar border-b border-gray-300 dark:border-gray-700">
                                            <Dialog.Close onClick={() => setOpen(false)} asChild>
                                                <Button
                                                    style={{
                                                        alignSelf: 'flex-end',
                                                        position: 'absolute',
                                                        right: 20,
                                                        top: 10,
                                                    }}
                                                    className="text-red-500 hover:text-red-700 text-4xl"
                                                >
                                                    <X size={36} />
                                                </Button>
                                            </Dialog.Close>
                                        </div>
                                        <CustomTextBox className="font-bold text-lg ml-[10px] text-white">
                                            {activeTitle}
                                        </CustomTextBox>
                                        {error && (
                                            <CustomTextBox className="font-bold text-lg ml-[10px] text-red">
                                                Something went wrong, regenerating Wieser simulation
                                            </CustomTextBox>
                                        )}
                                        {filteredInputs
                                            ?.map((el) => el.name)
                                            ?.map((field) => (
                                                <div key={field} style={{ marginLeft: 15, marginTop: 10 }}>
                                                    <div
                                                        className="block text-sm font-medium capitalize "
                                                        style={{ paddingBottom: 2 }}
                                                    >
                                                        <CustomTextBox>
                                                            {field.replace('initial_', '').replace(/_/g, ' ')}
                                                        </CustomTextBox>
                                                    </div>
                                                    <input
                                                        name={field}
                                                        onChange={handleInputChange}
                                                        value={
                                                            (inputs as any)?.[field] ??
                                                            filteredInputs.find((el) => el.name === field)
                                                                ?.defaultValue ??
                                                            ''
                                                        }
                                                        className="w-[90%] p-2 bg-black text-primary border rounded ml-4"
                                                    />
                                                </div>
                                            ))}
                                        <div style={{ marginTop: 10 }}>
                                            <CustomTextBox>
                                                <Markdown>{description}</Markdown>
                                            </CustomTextBox>
                                        </div>
                                        <Button
                                            style={{ marginTop: 10 }}
                                            className="bg-gradient-to-r text-center bg-primary hover:bg-green-700 active:scale-95 text-black py-4 px-6 rounded-lg shadow-lg transform transition duration-300 ease-in-out mt-4"
                                            onClick={getProjection}
                                            isLoading={waiting}
                                        >
                                            <p className="text-xl text-center font-bold tracking-wider text-black">
                                                {waiting ? 'Preparing Simulation' : 'Run Wieser Simulation'}
                                            </p>
                                        </Button>
                                    </div>
                                </animated.div>
                            </Dialog.Content>
                        </>
                    ) : null
                )}
            </Dialog.Portal>
        </Dialog.Root>
    )
}
