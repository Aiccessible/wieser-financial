import * as Accordion from '@radix-ui/react-accordion'
import { ChevronDownIcon, Loader } from 'lucide-react' // Optional: Chevron icon for accordion
import React from 'react'
import { Transfer } from '../../libs/gpt'
import { CustomTextBox } from './CustomTextBox'
import { Button } from '@aws-amplify/ui-react'
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
        <Accordion.Root className="space-y-4" type="multiple">
            {recommendations &&
                recommendations.map((recommendation, index) => (
                    <Accordion.Item
                        key={index}
                        value={`item-${index}`}
                        className="border text-black dark:text-white rounded-lg"
                    >
                        <Accordion.Header className="flex justify-between items-center p-4 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer">
                            <Accordion.Trigger className="flex items-center justify-between w-full text-lg font-semibold text-gray-700">
                                <Link
                                    to={`/institution/${id}/analyze/recommendation/${recommendation.title}`}
                                    className="technical-link hover:text-white-700 hover:underline-offset-2 transition duration-300 ease-in-out"
                                    key={index}
                                >
                                    {recommendation.title} {recommendation.priority} Priority
                                </Link>
                                <ChevronDownIcon className="w-5 h-5 ml-2 transition-transform duration-300 transform accordion-chevron" />
                            </Accordion.Trigger>
                        </Accordion.Header>
                        <Accordion.Content className="px-4 py-2 text-gray-600 bg-white rounded-b-lg rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
                            <CustomTextBox className="font-semibold">Explanation:</CustomTextBox>
                            <CustomTextBox className="font-normal text-left">
                                {recommendation.explanation}
                            </CustomTextBox>
                            <CustomTextBox className="font-semibold mt-2">Action:</CustomTextBox>
                            <CustomTextBox className="font-normal text-left">
                                {recommendation!.action!.description}
                            </CustomTextBox>

                            {recommendation!.action!.transfers!.map((transfer, index) => (
                                <div
                                    key={index}
                                    className="flex justify-between items-center bg-gray-100 p-4 rounded-lg mb-4"
                                >
                                    <div>
                                        <CustomTextBox className="text-sm font-semibold">
                                            From: {transfer!.fromAccountName}
                                        </CustomTextBox>
                                        <CustomTextBox className="text-sm font-semibold">
                                            To: {transfer!.toAccountName}
                                        </CustomTextBox>
                                    </div>
                                    <p className="text-lg font-semibold text-green-600">${transfer!.amount}</p>
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
                                            className="bg-gray-700 bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-blue-500 transition-all duration-500  animate-fade m-0"
                                        >
                                            Confirm Transfers
                                        </button>
                                    )}
                                </div>
                            ))}
                        </Accordion.Content>
                    </Accordion.Item>
                ))}
        </Accordion.Root>
    )
}

export default RecommendationsAccordion
