import MUIDataTable, { MUIDataTableColumn, MUIDataTableOptions } from 'mui-datatables';
import styled from '@emotion/styled';

const StyledMUIDataTable = styled(MUIDataTable)`
  width: 100%;
`;

export interface TableProps {
  title?: string;
  columns: MUIDataTableColumn[];
  data: Record<string, any>[];
  options?: MUIDataTableOptions;
}

const Table = ({ title, ...rest }: TableProps) => {
  return <StyledMUIDataTable title={title ?? ' '} {...rest} />;
};

export default Table;
