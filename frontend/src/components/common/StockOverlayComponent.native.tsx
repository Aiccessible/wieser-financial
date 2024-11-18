import React, { useEffect } from 'react'
import { Dimensions } from 'react-native'
import { WebView } from 'react-native-webview'
import * as Dialog from '@radix-ui/react-dialog'
import { CustomTextBox } from './CustomTextBox'
import { Heading } from '@aws-amplify/ui-react'
import { useAppDispatch, useAppSelector } from '../../hooks'
import Markdown from '../../components/native/Markdown'
import Loader from '../../components/common/Loader'
import { getInvestmentAnalysis, getInvestmentNews } from '../../../src/features/investments'
import { generateClient } from 'aws-amplify/api'
import { Security } from '../../../src/API'
import { getIdFromSecurity } from '../../../src/libs/utlis'

interface Props {
    activeStock?: Security
    onClose: () => void
}

const screenWidth = Dimensions.get('window').width

const StockOverlayComponent: React.FC<Props> = ({ activeStock, onClose }) => {
    const stockKnowledge = useAppSelector((state) => state.investments.investmentKnoweldge)
    const dispatch = useAppDispatch()
    const client = generateClient()

    useEffect(() => {
        const activeKnowledge = stockKnowledge[getIdFromSecurity(activeStock)]
        if (!activeKnowledge?.news && !activeKnowledge?.loadingNews) {
            dispatch(
                getInvestmentNews({
                    client: client,
                    security: activeStock,
                })
            )
            dispatch(
                getInvestmentAnalysis({
                    client: client,
                    security: activeStock,
                })
            )
        }
    }, [])

    const priceData = stockKnowledge[getIdFromSecurity(activeStock)]?.priceData || []
    const loadingNews = stockKnowledge[getIdFromSecurity(activeStock)]?.loadingNews
    const loadingAnalysis = stockKnowledge[getIdFromSecurity(activeStock)]?.loadingAnalysis

    const chartOptions = {
        xAxis: {
            categories: priceData.map((_, index) => {
                const startDate = new Date()
                startDate.setDate(startDate.getDate() - 14 + index)
                return startDate.toDateString()
            }),
        },
        series: [
            {
                data: priceData,
                name: 'Price',
            },
        ],
        title: {
            text: '2 weeks price chart',
        },
        stockTools: {
            gui: {
                enabled: true,
            },
        },
    }

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <script src="https://code.highcharts.com/highstock.js"></script>
        <script src="https://code.highcharts.com/modules/exporting.js"></script>
        <script src="https://code.highcharts.com/modules/accessibility.js"></script>
        <script src="https://code.highcharts.com/modules/stock-tools.js"></script>
      </head>
      <body>
        <div id="container" style="width: 100%; height: 100%;"></div>
        <script>
          document.addEventListener('DOMContentLoaded', function () {
            Highcharts.stockChart('container', ${JSON.stringify(chartOptions)});
          });
        </script>
      </body>
    </html>
  `

    return (
        <Dialog.Root open={!!activeStock} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Trigger asChild>
                <button className="hidden">Open Overlay</button>
            </Dialog.Trigger>

            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" style={{ zIndex: 998 }} />
                <Dialog.Content className="z-999 fixed max-h-[75vh] overflow-y-auto top-1/2 left-1/4 transform -translate-x-1/4 -translate-y-1/2 max-w-7xl w-full bg-white dark:bg-boxdark p-6 rounded-lg shadow-lg flex space-x-4 z-10001">
                    {/* News Section */}
                    <div className="w-1/2 p-4 border-r dark:border-strokedark">
                        <Heading level={4} className="text-lg font-semibold mb-2">
                            <CustomTextBox>News</CustomTextBox>
                        </Heading>
                        {loadingNews && <Loader />}
                        <div className="text-gray-700 dark:text-gray-300">
                            <CustomTextBox>
                                <Markdown>{stockKnowledge[getIdFromSecurity(activeStock)]?.news}</Markdown>
                            </CustomTextBox>
                        </div>
                    </div>

                    {/* Chart Section */}
                    {priceData.length > 0 && (
                        <div className="w-1/2 p-4 border-r dark:border-strokedark">
                            <Heading level={4} className="text-lg font-semibold mb-2">
                                <CustomTextBox>Pricing</CustomTextBox>
                            </Heading>
                            <WebView
                                originWhitelist={['*']}
                                source={{ html: htmlContent }}
                                style={{ height: 400, width: screenWidth }}
                                javaScriptEnabled
                                domStorageEnabled
                            />
                        </div>
                    )}

                    {/* Analysis Section */}
                    <div className="w-1/2 p-4">
                        <Heading level={4} className="text-lg font-semibold mb-2">
                            <CustomTextBox>Analysis</CustomTextBox>
                        </Heading>
                        {loadingAnalysis && <Loader />}
                        <div className="text-gray-700 dark:text-gray-300">
                            <CustomTextBox>
                                <Markdown>{stockKnowledge[getIdFromSecurity(activeStock)]?.analysis}</Markdown>
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
