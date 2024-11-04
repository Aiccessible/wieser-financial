import * as Accordion from '@radix-ui/react-accordion'
import { Alert, Button, Divider, Flex, Heading } from '@aws-amplify/ui-react'
import Loader from '../../components/common/Loader'
import React from 'react'
import { Transfer } from '../../libs/gpt'
import { CustomTextBox } from './CustomTextBox'
import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../hooks'
import { setAuthError, getTransferTokenAsync } from '../../features/auth'
import { Recommendation } from '@/src/API'
const RecommendationsAccordion = ({ recommendations, id }: { recommendations: Recommendation[]; id: string }) => {
    const loadingTransfer = useAppSelector((state) => state.auth.loadingTransfer)
    const dispatch = useAppDispatch()
    const accounts = useAppSelector((state) => state.accounts.accounts)

    const onClickTransfer = (transfer: Transfer, description: string) => {
        const fromAccount = accounts!.find((it) => it.name === transfer.fromAccountName)
        const toAccount = accounts!.find((it) => it.name === transfer.toAccountName)
        if (!fromAccount) {
            dispatch(setAuthError('Could not find ' + transfer.fromAccountName + ' in accounts'))
            return
        }
        if (!toAccount) {
            dispatch(setAuthError('Could not find ' + transfer.toAccountName + ' in accounts'))
            return
        }
        dispatch(
            getTransferTokenAsync({
                accountId: id,
                metadata: {
                    from_institution_id: id,
                    from_account: fromAccount.account_id!,
                    to_account: toAccount.account_id!,
                    to_institution_id: id,
                    amount: parseFloat(transfer.amount).toFixed(2),
                    legal_name: 'Owen Stadlwieser',
                    description: description.slice(0, 15),
                    currency:
                        accounts!.find((it) => it.name === transfer.fromAccountName)?.balances?.iso_currency_code ||
                        'USD',
                    client_name: accounts!.find((it) => it.name === transfer.fromAccountName)?.name!,
                },
            })
        )
    }
    return (
        <Accordion.Root className="space-y-4 max-h-[85vh] overflow-auto no-scrollbar hide-scrollbar" type="multiple">
            {recommendations &&
                recommendations.map((recommendation, index) => (
                    <div
                        key={index}
                        className=" flex-grow bg-transparent py-4 pl-9 pr-4 font-medium focus:outline-none text-black dark:placeholder-whiten dark:text-whiten dark:bg-secondary rounded-3xl relative"
                    >
                        <div
                            style={{ backgroundColor: recommendation.priority === 'High' ? '#fe0103' : '#fa8d03' }}
                            className={`absolute top-0 right-0 w-10 h-6 bg-${
                                recommendation.priority === 'High' ? 'danger1' : 'warning1'
                            } rounded-full translate-x-1/4 -translate-y-1/4`}
                        ></div>

                        <Heading>
                            <CustomTextBox
                                className=" hover:text-white-700 hover:underline-offset-2 transition duration-300 ease-in-out text-md"
                                key={index}
                            >
                                {recommendation.title}
                            </CustomTextBox>
                        </Heading>
                        <CustomTextBox className="font-normal text-left">{recommendation.explanation}</CustomTextBox>
                        <CustomTextBox className="font-normal text-left">
                            {recommendation!.action!.description}
                        </CustomTextBox>

                        {recommendation!.action!.transfers!.map((transfer, index) => (
                            <div
                                key={index}
                                className="flex justify-between items-center bg-gray-100 p-1 rounded-lg mb-1"
                            >
                                <div>
                                    <CustomTextBox className="text-sm font-semibold">
                                        From: {transfer!.fromAccountName}
                                    </CustomTextBox>
                                    <CustomTextBox className="text-sm font-semibold">
                                        To: {transfer!.toAccountName}
                                    </CustomTextBox>
                                </div>
                                <p className="text-lg font-semibold text-highlight">${transfer!.amount}</p>
                                {loadingTransfer ? (
                                    <Loader />
                                ) : (
                                    <button
                                        onClick={() =>
                                            onClickTransfer(
                                                transfer as Transfer,
                                                recommendation!.action!.description || ''
                                            )
                                        }
                                        className="bg-primary text-black font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-white transition-all duration-500  animate-fade m-0"
                                    >
                                        Confirm Transfers
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
        </Accordion.Root>
    )
}

export default RecommendationsAccordion
