import { useEffect, useCallback } from 'react'
import { generateClient } from 'aws-amplify/api'
import { ConsoleLogger } from 'aws-amplify/utils'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell, Title } from '@tremor/react'
import RefreshHoldings from './RefreshHoldings'
import { Holding, Investment as InvestmentType, Security } from '../../src/API'
import Investment from './Investment'
import { Loader } from 'lucide-react'
import { Alert, Button } from '@aws-amplify/ui-react'
import { CustomTextBox } from './common/CustomTextBox'
import { useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks'
import {
    getInvestementsAsync,
    getInvestmentAnalysis,
    getInvestmentNews,
    getInvestmentNewsSummary,
    setActiveStock,
} from '../features/investments'
import { getAccountsAsync } from '../features/accounts'
import Markdown from 'react-markdown'
import ExpandableTextWithModal from './ExpandableTextWithModal'
import StockOverlayComponent from './common/StockOverlayComponent'
import { getIdFromSecurity } from '../libs/utlis'
const ID_SEPERATOR = '-'
const logger = new ConsoleLogger('Holdings')

export interface InvestmentViewModel {
    security: Security | undefined
    holding: Holding
}

const PortfolioValue = ({ netWorth }: { netWorth: number }) => {
    return (
        <div className="bg-gray-800 p-1 rounded-lg text-white w-full">
            <CustomTextBox className="text-3xl font-bold mb-2">${netWorth.toFixed(2)}</CustomTextBox>
            <CustomTextBox className="text-green-400">+$11.33 / 0.25% today</CustomTextBox>
        </div>
    )
}

const NewsSection = ({ news }: { news: string | undefined }) => {
    if (!news) {
        return (
            <CustomTextBox>
                Loading News Summary...
                <Loader />
            </CustomTextBox>
        )
    }
    return (
        <>
            <Title>My Investment Report</Title>
            <Markdown>{news}</Markdown>
        </>
    )
}

export default function Investments({}: { id: string; accounts: any }) {
    const loading = useAppSelector((state) => state.investments.loading)

    const client = generateClient()
    const { id } = useParams()
    const investments = useAppSelector((state) => state.investments.investments)
    const investmentSummary = useAppSelector((state) => state.investments.investmentSummary)
    const cursor = useAppSelector((state) => state.investments.cursor)
    const error = useAppSelector((state) => state.investments.error)
    const investmentKnoweldge = useAppSelector((state) => state.investments.investmentKnoweldge)
    const activeStock = useAppSelector((state) => state.investments.activeStock)
    const dispatch = useAppDispatch()
    useEffect(() => {
        const asyncFetch = async () => {
            if (!investmentSummary && investments) {
                dispatch(getInvestmentNewsSummary({ client, id: id || '' }))
            }
        }
        asyncFetch()
    }, [investments, investmentSummary])
    const getInvestments = async () => {
        try {
            await dispatch(getInvestementsAsync({ client, id: id || '', append: false }))
        } catch (err) {
            logger.error('unable to get transactions', err)
        }
    }

    const handleLoadMore = async () => {
        try {
            await dispatch(getInvestementsAsync({ client, id: id || '', append: true }))
        } catch (err) {
            logger.error('unable to get holdings', err)
        }
    }

    const getId = (el: InvestmentType) => el.account_id + ID_SEPERATOR + el.security_id
    const getIdToSecurityAndHolding = useCallback(() => {
        const accountAndsecurityIdToEntity: Record<string, { security: Security | undefined; holding: Holding }> = {}
        investments?.forEach((el) => {
            if (el.plaid_type === 'Holding') {
                accountAndsecurityIdToEntity[getId(el)] = {
                    security: investments?.find(
                        (sec) => sec.plaid_type === 'Security' && sec.security_id === el.security_id
                    ) as Security | undefined,
                    holding: el as Holding,
                }
            }
        })
        return accountAndsecurityIdToEntity
    }, [investments])

    useEffect(() => {
        if (investments) {
            const accountAndsecurityIdToEntity = getIdToSecurityAndHolding()
            const fetchingAnalaysisAndNews = async () => {
                // Convert object values to an array
                const entities = Object.values(accountAndsecurityIdToEntity)
                const batchSize = 5

                // Function to process a batch of entities
                const processBatch = async (batch: typeof entities) => {
                    await Promise.all(
                        batch.map(async (el) => {
                            await dispatch(
                                getInvestmentAnalysis({
                                    security: el?.security,
                                    client,
                                    id: id || '',
                                })
                            )
                            await dispatch(
                                getInvestmentNews({
                                    security: el?.security,
                                    client,
                                    id: id || '',
                                })
                            )
                        })
                    )
                }

                // Process entities in batches of 5
                for (let i = 0; i < entities.length; i += batchSize) {
                    const batch = entities.slice(i, i + batchSize)
                    await processBatch(batch)
                }
            }

            fetchingAnalaysisAndNews()
        }
    }, [investments, getIdToSecurityAndHolding])

    const getNetWorth = (entities: Record<string, { security: Security | undefined; holding: Holding }>) => {
        const holdings = Object.values(entities)
        return holdings.reduce((val, holding) => {
            return val + (holding.holding.quantity ?? 0) * (holding.security?.close_price ?? 0)
        }, 0)
    }

    useEffect(() => {
        getInvestments()
    }, [])
    const holdingsAndSecuritiesJoined = Object.values(getIdToSecurityAndHolding()).filter((entity) => entity.security)
    return (
        <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
            {error && <Alert>{error}</Alert>}
            {activeStock && (
                <StockOverlayComponent activeStock={activeStock} onClose={() => dispatch(setActiveStock(undefined))} />
            )}
            <div className="grid grid-cols-4 gap-6 p-1">
                {/* Left Section (Portfolio Value) */}
                <div className="col-span-1">
                    <Title>Investments</Title>
                    <PortfolioValue netWorth={getNetWorth(getIdToSecurityAndHolding())} />
                </div>

                {/* Middle Section (Relevant News) */}
                <div className="col-span-2">
                    <ExpandableTextWithModal maxHeight="20rem">
                        <NewsSection news={investmentSummary} />
                    </ExpandableTextWithModal>
                </div>
                <div className="col-span-1">
                    <RefreshHoldings item_id={id || ''} />
                </div>
            </div>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableHeaderCell>Name</TableHeaderCell>
                        <TableHeaderCell>Last Close Price</TableHeaderCell>
                        <TableHeaderCell>Quantity</TableHeaderCell>
                        <TableHeaderCell>Cost</TableHeaderCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={6}>
                                <Loader />
                            </TableCell>
                        </TableRow>
                    ) : holdingsAndSecuritiesJoined.length ? (
                        holdingsAndSecuritiesJoined.map((investmentViewModel) => {
                            console.log(
                                investmentKnoweldge[getIdFromSecurity(investmentViewModel?.security)],
                                investmentKnoweldge,
                                getIdFromSecurity(investmentViewModel?.security)
                            )
                            return (
                                <Investment
                                    knoweldge={investmentKnoweldge[getIdFromSecurity(investmentViewModel?.security)]}
                                    investment={investmentViewModel}
                                />
                            )
                        })
                    ) : (
                        <TableRow>
                            <TableCell colSpan={6}>Waiting for holdings data...</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            {investments?.length ? (
                <Button isDisabled={!cursor} onClick={handleLoadMore} size="small">
                    <CustomTextBox>Load More</CustomTextBox>
                </Button>
            ) : (
                <div />
            )}
        </div>
    )
}
