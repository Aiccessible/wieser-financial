import { useState } from 'react';
import { get, post } from 'aws-amplify/api';
import { ConsoleLogger } from 'aws-amplify/utils';
import { Button, Flex } from '@aws-amplify/ui-react';
import { useAppDispatch } from '../hooks'
import { setPublicToken } from '../features/auth';
import PlaidLink from './PlaidLink';
import { usePlaidHooks } from './hooks/usePlaidHooks';

const logger = new ConsoleLogger("Plaid");

const apiName = "plaidapi";

export default function Plaid({ getItems }) {
  const { handleGetToken, handleSuccess, token, connecting, setConnecting } = usePlaidHooks({ getItems })
  const {
      handleGetToken: handleGetStockToken,
      handleSuccess: handleStockSuccess,
      token: stockToken,
  } = usePlaidHooks({ getItems, getPath: '/v1/tokens/get_investment_token' })
  return (
      <Flex>
          <Button variation="primary" isLoading={connecting} onClick={handleGetToken}>
              CONNECT BANK ACCOUNT PLAID
          </Button>
          <Button variation="primary" isLoading={connecting} onClick={handleGetStockToken}>
              CONNECT INVESTMENT ACCOUNT WITH PLAID
          </Button>
          {token ? <PlaidLink token={token} onSuccess={handleSuccess} onExit={() => setConnecting(false)} /> : null}
          {stockToken ? (
              <PlaidLink
                  token={stockToken}
                  onSuccess={async (public_token , metadata) => {
                      await handleStockSuccess(public_token, metadata)
                      const { body } = await post({
                          apiName,
                          path: `/v1/items/${metadata.account_id}/refresh/holdings`,
                      }).response
                  }}
                  onExit={() => setConnecting(false)}
              />
          ) : null}
      </Flex>
  )
}
