import { useDispatch } from 'react-redux'
import { useAppDispatch, useAppSelector } from '../hooks'
import { generateClient } from 'aws-amplify/api'
import { getFinancialProjection, retryCodeBuildAsyncThunk } from '../features/analysis'
import { createUserAnalysisAsync, createUserAnalysisFieldAsync } from '../features/simulations'
import { financialProjectionKeys } from '../components/hooks/useDefaultValuesForProjection'
import { useEffect } from 'react'

export const useSimulatedExperiment = ({
    inputs,
    setOpen,
}: {
    inputs: Record<string, any>
    setOpen?: (boolean: boolean) => void
}) => {
    const s3Key = useAppSelector((state) => state.analysis.activeSimulationKey)
    const activeSimulationName = useAppSelector((state) => state.analysis.activeSimulationName)
    const activeSimulationDescription = useAppSelector((state) => state.analysis.activeSimulationDescription)
    const activeSimulationDescriptions = useAppSelector((state) => state.analysis.activeSimulationDescriptions)
    const activeSimulationTitles = useAppSelector((state) => state.analysis.activeSimulationTitles)
    const retryCount = useAppSelector((state) => state.analysis.retryCount)
    const dispatch = useAppDispatch()
    const waitingForCodeGeneration = useAppSelector((state) => state.analysis.waitingForCodeGeneration)
    const client = generateClient()
    const newInputs = useAppSelector((state) => state.analysis.newSimulationInputs)
    const filteredInputs = newInputs?.filter((key) => !financialProjectionKeys.has(key as any))
    const parsedInputs = Object.fromEntries(
        Object.entries(inputs).map(([key, value]) => {
            return [key, typeof value === 'string' && !isNaN(parseFloat(value)) ? parseFloat(value) : value]
        })
    )
    const error = useAppSelector((state) => state.analysis.loadingProjectionsError)
    const activeS3Key = useAppSelector((state) => state.analysis.activeSimulationKey)

    useEffect(() => {
        if (error && activeS3Key && !waitingForCodeGeneration && retryCount < 2) {
            dispatch(
                retryCodeBuildAsyncThunk({
                    client: client,
                    input: {
                        s3Key: activeS3Key,
                        error: error,
                    },
                })
            )
        }
    }, [error, waitingForCodeGeneration, activeS3Key, retryCount])
    const getProjection = () => {
        dispatch(
            getFinancialProjection({
                client,
                input: {
                    inputs: { ...(parsedInputs as any) },
                    s3_key: s3Key,
                } as any,
                path: '/v1/analyze/analyze',
            })
        )
        dispatch(
            createUserAnalysisAsync({
                client,
                simulation: {
                    analysisName: activeSimulationName || 'Simulation',
                    s3Key: s3Key || '',
                    currentDescription: activeSimulationDescription,
                    currentInputs: filteredInputs?.map((el) => el.name) ?? [],
                    currentProjection: '',
                    descriptions: activeSimulationDescriptions,
                    titles: activeSimulationTitles,
                },
            })
        )
        filteredInputs
            ?.map((el) => el.name)
            ?.forEach((input) => {
                dispatch(
                    createUserAnalysisFieldAsync({
                        client,
                        simulation: {
                            inputName: input,
                            inputValue: inputs[input],
                        },
                    })
                )
            })
        setOpen && setOpen(false)
    }
    return { getProjection }
}
