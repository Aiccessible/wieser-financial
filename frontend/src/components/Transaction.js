import { TableRow, TableCell } from '@aws-amplify/ui-react';
import { CustomTextBox } from './common/CustomTextBox'
import { CustomTableCell } from './common/CustomTableCell'
import Currency from './Currency';

export default function Transaction({ transaction, account }) {
  return (
      <TableRow>
          <CustomTableCell>
              <CustomTextBox>{transaction.name}</CustomTextBox>
          </CustomTableCell>
          <CustomTableCell>
              <CustomTextBox>
                  <Currency amount={transaction.amount} currency={transaction.iso_currency_code} />
              </CustomTextBox>
          </CustomTableCell>
          <CustomTableCell>
              <CustomTextBox>{transaction.date}</CustomTextBox>
          </CustomTableCell>
          <CustomTableCell>
              <CustomTextBox>{account ? account.name : transaction.account_id}</CustomTextBox>
          </CustomTableCell>
          <CustomTableCell>
              <CustomTextBox>{transaction.payment_channel}</CustomTextBox>
          </CustomTableCell>
          <CustomTableCell>
              <CustomTextBox>{transaction.transaction_type}</CustomTextBox>
          </CustomTableCell>
      </TableRow>
  )
}
