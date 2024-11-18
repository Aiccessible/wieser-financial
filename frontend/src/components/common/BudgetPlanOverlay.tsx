import React from 'react'
import { useAppDispatch, useAppSelector } from '../../hooks'
import * as Dialog from '../../components/native/Dialog'
import { X } from 'lucide-react-native'
import { useTransition, animated, config } from '@react-spring/native'
import { setActiveBudgetPlan } from '../../../src/features/analysis'
import { AccountBalances, NetWorthChart } from '../Analysis/NetworthChart'
import { Dimensions, TouchableOpacity, View } from 'react-native'

export const BudgetPlanOverlay = () => {
    const projectedBalances = useAppSelector((state) => state.analysis.projectedAccountBalances)
    const budgetPlan = useAppSelector((state) => state.analysis.activeBudgetPlan)
    const budgetPlanProjections = useAppSelector((state) => state.analysis.budgetPlanProjections)
    const dispatch = useAppDispatch()
    const transitions = useTransition(budgetPlan, {
        from: { opacity: 0, y: -10 },
        enter: { opacity: 1, y: 0 },
        leave: { opacity: 0, y: 10 },
        config: config.wobbly,
    })
    if (!budgetPlan) {
        return <></>
    }
    return (
        <Dialog.Root open={!!budgetPlan} onOpenChange={() => dispatch(setActiveBudgetPlan(undefined))}>
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
                                        className="relative dark:bg-gray-800 w-full max-w-3xl rounded-lg shadow-3xl bg-black"
                                    >
                                        <View className=" items-center justify-between p-4 bg-gray-100 dark:bg-gray-900 hide-scrollbar border-b border-gray-300 dark:border-gray-700">
                                            <Dialog.Close onClick={() => setActiveBudgetPlan(false)} asChild>
                                                <TouchableOpacity
                                                    style={{ alignSelf: 'flex-end' }}
                                                    className="text-red-500 hover:text-red-700 text-4xl"
                                                >
                                                    <X size={36} />
                                                </TouchableOpacity>
                                            </Dialog.Close>
                                        </View>
                                        <NetWorthChart
                                            accountBalances={projectedBalances as any}
                                            title={budgetPlan + ' Projection'}
                                            comparativeBalances={
                                                budgetPlanProjections[budgetPlan ?? ''] as AccountBalances
                                            }
                                            comparativeKey={'Net Worth'}
                                            overrideTimeFrame={'Future'}
                                        />
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
