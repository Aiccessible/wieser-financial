import {  post } from 'aws-amplify/api';
import PlaidLink from '../Plaid/PlaidLink';
import { usePlaidHooks } from '../hooks/usePlaidHooks';
import { View, TouchableOpacity, Text } from 'react-native';
import { Button } from '@aws-amplify/ui-react';
import { CustomTextBox } from '../common/Custom/CustomTextBox';

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
          <div className="flex flex-col gap-2 mr-2">
              <Button
                  className="bg-black border border-white text-white text-center font-medium py-2 px-4 rounded-lg shadow hover:bg-blue-600 ease-in-out transition duration-300 w-full"
                  variation="primary"
                  isLoading={connecting}
                  onPress={handleGetToken}
              >
                  <p className="text-white">Add Spending Account</p>
              </Button>
              <Button
                  className="bg-black border border-white text-white text-center font-medium py-2 px-4 rounded-lg shadow hover:bg-blue-600 ease-in-out transition duration-300 w-full"
                  variation="primary"
                  isLoading={connecting}
                  onPress={handleGetStockToken}
              >
                  <p className="text-white whitespace-nowrap">Add Investment Account</p>
              </Button>
          </div>
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
