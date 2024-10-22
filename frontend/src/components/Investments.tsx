import { useState, useEffect, useCallback } from 'react'
import { generateClient } from 'aws-amplify/api'
import { ConsoleLogger } from 'aws-amplify/utils'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell, Title } from '@tremor/react'
import { getInvestments } from '../graphql/queries'
import RefreshHoldings from './RefreshHoldings'
import { Holding, Investment as InvestmentType, Security } from '../../src/API'
import Investment from './Investment'
import { Loader } from 'lucide-react'
import { Button } from '@aws-amplify/ui-react'
import { CustomTextBox } from './common/CustomTextBox'
import { useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks'
import { getInvestementsAsync } from '../features/investments'
import { getAccountsAsync } from '../features/accounts'
const ID_SEPERATOR = '-'
const logger = new ConsoleLogger('Holdings')

export interface InvestmentViewModel {
    security: Security | undefined
    holding: Holding
}

export default function Investments({}: { id: string; accounts: any }) {
    const loading = useAppSelector((state) => state.investments.loading)

    const client = generateClient()
    const { id } = useParams()
    const investments = useAppSelector((state) => state.investments.investments)
    const cursor = useAppSelector((state) => state.investments.cursor)
    const dispatch = useAppDispatch()

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
        getInvestments()
    }, [])
    console.log(investments)
    const holdingsAndSecuritiesJoined = Object.values(getIdToSecurityAndHolding()).filter((entity) => entity.security)
    return (
        <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
            <RefreshHoldings item_id={id || ''} />
            <Title>Investments</Title>
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
                            return <Investment investment={investmentViewModel} />
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
