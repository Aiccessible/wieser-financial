import {  post } from 'aws-amplify/api';
import { ConsoleLogger } from 'aws-amplify/utils';
import PlaidLink from '../Plaid/PlaidLink';
import { usePlaidHooks } from '../hooks/usePlaidHooks';
import { View, TouchableOpacity, Text } from 'react-native';

const apiName = "plaidapi";

export default function Plaid({ getItems }) {
  const { handleGetToken, handleSuccess, token, connecting, setConnecting } = usePlaidHooks({ getItems })
  const {
      handleGetToken: handleGetStockToken,
      handleSuccess: handleStockSuccess,
      token: stockToken,
  } = usePlaidHooks({ getItems, getPath: '/v1/tokens/get_investment_token' })
  return (
      <View style={{ alignItems: 'center' }}>
          <TouchableOpacity
              className="bg-primary px-4 w-[90%] py-3 rounded-lg items-center justify-center mb-4"
              variation="primary"
              isLoading={connecting}
              onPress={handleGetToken}
          >
              <Text>CONNECT BANK ACCOUNT PLAID</Text>
          </TouchableOpacity>
          <TouchableOpacity
              className="bg-primary px-4 py-3 w-[90%] rounded-lg items-center justify-center mb-4"
              variation="primary"
              isLoading={connecting}
              onPress={handleGetStockToken}
          >
              <Text>CONNECT INVESTMENT ACCOUNT WITH PLAID</Text>
          </TouchableOpacity>
          {token ? <PlaidLink token={token} onSuccess={handleSuccess} onExit={() => setConnecting(false)} /> : null}
          {stockToken ? (
              <PlaidLink
                  token={stockToken}
                  onSuccess={async (public_token, metadata) => {
                      await handleStockSuccess(public_token, metadata)
                      const { body } = await post({
                          apiName,
                          path: `/v1/items/${metadata.account_id}/refresh/holdings`,
                      }).response
                  }}
                  onExit={() => setConnecting(false)}
              />
          ) : null}
      </View>
  )
}
