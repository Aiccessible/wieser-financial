import React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { CustomTextBox } from './CustomTextBox'
import { Heading } from '@aws-amplify/ui-react'
import { useAppSelector } from '../../hooks'
import Markdown from 'react-markdown'
import { getIdFromSecurity } from '@/src/libs/utlis'

interface Props {
    activeStock?: any // Type this based on your actual activeStock structure
    onClose: () => void // Function to close the modal
}

const StockOverlayComponent: React.FC<Props> = ({ activeStock, onClose }) => {
    const stockKnoweldge = useAppSelector((state) => state.investments.investmentKnoweldge)
    return (
        <Dialog.Root open={!!activeStock} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Trigger asChild>
                {/* Optional: Add a button here if you want to trigger the modal manually */}
                <button className="hidden">Open Overlay</button>
            </Dialog.Trigger>

            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 z-50" />
                <Dialog.Content className="fixed max-h-[75vh] overflow-y-auto top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-4xl w-full bg-white dark:bg-boxdark p-6 rounded-lg shadow-lg flex space-x-4 z-50">
                    {/* News Section */}
                    <div className="w-1/2 p-4 border-r dark:border-strokedark">
                        <Heading level={4} className="text-lg font-semibold mb-2">
                            <CustomTextBox>News</CustomTextBox>
                        </Heading>
                        {/* Replace with your actual news content */}
                        <div className="text-gray-700 dark:text-gray-300">
                            <CustomTextBox>
                                <Markdown>{stockKnoweldge[activeStock]?.news}</Markdown>
                            </CustomTextBox>
                        </div>
                    </div>

                    {/* Analysis Section */}
                    <div className="w-1/2 p-4">
                        <Heading level={4} className="text-lg font-semibold mb-2">
                            <CustomTextBox>Analysis</CustomTextBox>
                        </Heading>
                        {/* Replace with your actual analysis content */}
                        <div className="text-gray-700 dark:text-gray-300">
                            <CustomTextBox>
                                <Markdown>{stockKnoweldge[activeStock]?.analysis}</Markdown>
                            </CustomTextBox>
                        </div>
                    </div>

                    {/* Close Button */}
                    <Dialog.Close asChild>
                        <button className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white">
                            ×
                        </button>
                    </Dialog.Close>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}

export default StockOverlayComponent
