import React, { useState, ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { CustomTextBox } from './common/CustomTextBox'
import { Dimensions, TouchableOpacity, View } from 'react-native'

interface ExpandableTextWithModalProps {
    maxHeight?: string // Max height for the preview, e.g., '4rem' or '80px'
    children: ReactNode // The full text as children
}

const ExpandableTextWithModal: React.FC<ExpandableTextWithModalProps> = ({
    maxHeight = '4rem', // Default max height
    children,
}) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    return (
        <View>
            {/* Preview Text with max-height and overflow */}
            <View
                className="overflow-hidden text-gray-700"
                style={{
                    maxHeight: Dimensions.get('window').height * 0.5,
                }}
            >
                <CustomTextBox>{children}</CustomTextBox>
            </View>

            {/* "Read more" Button */}
            <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <Dialog.Trigger asChild>
                    <TouchableOpacity className="text-blue-500 underline mt-2">
                        <CustomTextBox>Read more</CustomTextBox>
                    </TouchableOpacity>
                </Dialog.Trigger>

                {/* Modal Content */}
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" style={{ zIndex: 998 }} />
                    <Dialog.Content className="z-999 overflow-y-auto max-h-[75vh] fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-md w-full bg-white p-6 rounded-lg shadow-xl">
                        <Dialog.Title className="text-lg font-semibold mb-4">My Investment Report</Dialog.Title>
                        <Dialog.Description className="text-gray-700">{children}</Dialog.Description>
                        <Dialog.Close asChild>
                            <TouchableOpacity className="mt-4 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">
                                <CustomTextBox>Close</CustomTextBox>
                            </TouchableOpacity>
                        </Dialog.Close>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </View>
    )
}

export default ExpandableTextWithModal
