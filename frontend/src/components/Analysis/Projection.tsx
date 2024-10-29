import { useAppDispatch } from '@/src/hooks'
import { useDataLoading } from '@/src/hooks/useDataLoading'
import { Button } from '@aws-amplify/ui-react'
import { generateClient } from 'aws-amplify/api'
import { useParams } from 'react-router-dom'

const Projection = () => {
    const { id } = useParams()
    const client = generateClient()
    const {} = useDataLoading({ id: id || '', client, loadTransactions: true })
    const dispatch = useAppDispatch()
    const getProjection = () => {}
    return <Button onClick={getProjection}>Get Projection</Button>
}
