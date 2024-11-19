import { Table, TableHead, TableRow, TableCell, TableBody } from '@aws-amplify/ui-react';
import Institution from './Institution';
import { CustomTextBox } from '../common/Custom/CustomTextBox';
export default function Institutions({ institutions = []}) {
  return (
      <Table highlightOnHover={true} >
          <TableHead>
              <TableRow>
                  <TableCell as="th">
                      <CustomTextBox>Name</CustomTextBox>
                  </TableCell>
              </TableRow>
          </TableHead>
          <TableBody>
              {institutions.length ? (
                  institutions.map((institution) => {
                      return <Institution key={institution.institution_id} institution={institution} />
                  })
              ) : (
                  <TableRow>
                      <TableCell>No institutions found</TableCell>
                  </TableRow>
              )}
          </TableBody>
      </Table>
  )
}
