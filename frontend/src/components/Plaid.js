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
  return (
    <Flex>
      <Button
        variation="primary"
        isLoading={connecting}
        onClick={handleGetToken}
      >
        CONNECT WITH PLAID
      </Button>
      {token ? (
        <PlaidLink
          token={token}
          onSuccess={handleSuccess}
          onExit={() => setConnecting(false)}
        />
      ) : null}
    </Flex>
  );
}
