import { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/api';
import { ConsoleLogger } from 'aws-amplify/utils';
import Account from './Account';
import { Loader } from 'lucide-react';
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell, Title } from '@tremor/react'
import { useParams } from 'react-router-dom';
import { CustomTextBox } from './common/CustomTextBox';
import { completeChatFromPrompt, getTechnicalWordsWhereWeCanGoDeeper } from '../libs/gpt'
import makeLinksOfTechnicalPhrases from '../libs/utlis';
import { useAppDispatch, useAppSelector } from '../hooks'
import { getAccountRecommendationAsync, getAccountsAsync } from '../features/accounts';
const logger = new ConsoleLogger("Accounts");

export default function Accounts({ updateAccounts }) {

  const [loading, setLoading] = useState(true);
  const [linkedAnalysisText, setLinkedAnalysisTextState] = useState('')
  const { id } = useParams()
  const client = generateClient();
  const accounts = useAppSelector((state) => state.accounts.accounts);
  const gptAnalysis = useAppSelector((state) => state.accounts.acccountRecommendation);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (gptAnalysis) {
      console.log('set32')
      setLinkedAnalysisText(gptAnalysis)
    }
  }, [gptAnalysis])
  const getGptAnalysis = async () => {
    dispatch(getAccountRecommendationAsync({ id }))
  }

  const setLinkedAnalysisText = async (gptAnalysis) => {
      const res = await getTechnicalWordsWhereWeCanGoDeeper(gptAnalysis)
      console.log('Technical phrases', res)
      const linkedText = getLinksOfTechnicalPhrases(gptAnalysis, res);
      console.log(linkedText)
      setLinkedAnalysisTextState(linkedText)
  }

  const getLinksOfTechnicalPhrases = useCallback((gptAnalysis, technicalPhrases) => {
      return makeLinksOfTechnicalPhrases({ technicalPhrases, gptAnalysis, analysisType: 'accounts', id })
  }, [id])

  const getAccounts = async () => {
    setLoading(true);
    try {
      dispatch(getAccountsAsync({ client, id }))
    } catch (err) {
      setLoading(false);
      logger.error('unable to get accounts', err);
    }
  }

  useEffect(() => {
      if (accounts && updateAccounts) {
          getGptAnalysis(accounts)
          setLoading(false)
      }
  }, [accounts, updateAccounts])

  useEffect(() => {
    getAccounts();
  }, []);

  return (
      <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <Title>Accounts</Title>
          {linkedAnalysisText && linkedAnalysisText}
          {!linkedAnalysisText && gptAnalysis && <CustomTextBox>{gptAnalysis}</CustomTextBox>}
          <Table highlightOnHover={true} variation="striped">
              <TableHead>
                  <TableRow>
                      <TableHeaderCell>Name</TableHeaderCell>
                      <TableHeaderCell>Balances</TableHeaderCell>
                      <TableHeaderCell>Type</TableHeaderCell>
                      <TableHeaderCell>Subtype</TableHeaderCell>
                      <TableHeaderCell>Mask</TableHeaderCell>
                  </TableRow>
              </TableHead>
              <TableBody>
                  {loading ? (
                      <TableRow>
                          <TableCell>
                              <Loader />
                          </TableCell>
                      </TableRow>
                  ) : accounts.length ? (
                      accounts.map((account) => {
                          return <Account key={account.account_id} account={account} />
                      })
                  ) : (
                      <TableRow>
                          <TableCell>No accounts found</TableCell>
                      </TableRow>
                  )}
              </TableBody>
          </Table>
      </div>
  )
}
