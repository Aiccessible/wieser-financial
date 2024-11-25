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
          <Button
              className="bg-white px-4 w-[90%] py-3 rounded-lg items-center transition duration-300 hover:bg-green-700 ease-in-out justify-center mb-4"
              variation="primary"
              isLoading={connecting}
              onPress={handleGetToken}
          >
              <p className="text-black">ADD BANK ACCOUNT </p>
          </Button>
          <Button
              className="bg-white px-4 py-3 w-[90%] rounded-lg items-center transition duration-300 hover:bg-green-700 ease-in-out justify-center mb-4"
              variation="primary"
              isLoading={connecting}
              onPress={handleGetStockToken}
          >
              <p className="text-black whitespace-nowrap">ADD INVESTMENT ACCOUNT </p>
          </Button>
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
