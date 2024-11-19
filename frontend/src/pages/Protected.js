import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { ConsoleLogger } from 'aws-amplify/utils';
import { View, Heading, Flex } from '@aws-amplify/ui-react';
import { getItems as GetItems } from '../graphql/queries';
import Plaid from '../components/Plaid/Plaid';
import Institutions from '../components/Institution/Institutions';
import { CustomTextBox } from '../components/common/Custom/CustomTextBox';
import WelcomePage from '../components/WelcomePage';
import { usePlaidHooks } from '../components/hooks/usePlaidHooks';
import PlaidLink from '../components/Plaid/PlaidLink';
const logger = new ConsoleLogger("Protected");

export default function Protected() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false)
  const [done, setIsDone] = useState(false)
  const [token, setToken] = useState('')
  const [fetchingToken, setFetchingToken] = useState(false)
  const client = generateClient();
  const getItems = async () => {
    try {
      setLoading(true)
      const res = await client.graphql({
        query: GetItems
      });
      const ids = res.data.getItems.items.map((item) => item.item_id)
      logger.info(res);
      setLoading(false)
      setItems(res.data.getItems.items);
    } catch (err) {
      logger.error('unable to get items', err);
    }
  }
  const { handleGetToken, handleSuccess,   setConnecting } = usePlaidHooks({ getItems })

  useEffect(() => {
    getItems();
  }, []);
  useEffect(() => {
    const handler = async () => {
      const token = await handleGetToken()
      setToken(token)
    }
    if (!items?.length && !loading && !fetchingToken) {
        setFetchingToken(true)
        handler()
    }
  }, [items, loading, fetchingToken, setFetchingToken])

  if (!items?.length && !loading) {
      return (
          <>
              <WelcomePage setIsDone={setIsDone} />{' '}
              {token && done && <PlaidLink token={token} onSuccess={handleSuccess} onExit={() => setConnecting(false)} />}
          </>
      )
  }
  
  return (
      <Flex direction="column">
          <Plaid getItems={getItems} />
          {items && items.length ? (
              <View>
                  <Heading>
                      <CustomTextBox>Institutions</CustomTextBox>
                  </Heading>
                  <Institutions institutions={items} />
              </View>
          ) : (
              <div />
          )}
      </Flex>
  )
}
