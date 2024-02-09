import {
  Button,
  DataTable,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
  Tile,
} from '@carbon/react';
import { Add } from '@carbon/react/icons';
import { ExtensionSlot, useConfig, usePagination } from '@openmrs/esm-framework';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type VisitQueueEntry } from '../active-visits/active-visits-table.resource';
import styles from '../active-visits/active-visits-table.scss';
import { type ConfigObject } from '../config-schema';

interface QueueTableProps {
  queueEntries: VisitQueueEntry[];
}

export function QueueTable({ queueEntries }: QueueTableProps) {
  const { t } = useTranslation();
  const { queueTableColumns } = useConfig<ConfigObject>();
  const [currentPageSize, setPageSize] = useState(10);
  const pageSizes = [10, 20, 30, 40, 50];
  const { goTo, results: paginatedQueueEntries, currentPage } = usePagination(queueEntries, currentPageSize);

  const headers = queueTableColumns.map((column) => ({ header: t(column.headerI18nKey), key: column.headerI18nKey }));
  const rowsData =
    paginatedQueueEntries?.map((queueEntry) => {
      const row: Record<string, JSX.Element | string> = { id: queueEntry.queueEntry.uuid };
      queueTableColumns.forEach((conf) => {
        row[conf.headerI18nKey] = <ExtensionSlot name={conf.extensionSlotName} state={{ queueEntry }} />;
      });

      return row;
    }) ?? [];

  return (
    <DataTable rows={rowsData} headers={headers}>
      {({ rows, headers, getTableProps, getHeaderProps, getRowProps, getToolbarProps, onInputChange }) => (
        <TableContainer className={styles.tableContainer}>
          <TableToolbar
            {...getToolbarProps()}
            style={{ position: 'static', height: '3rem', overflow: 'visible', backgroundColor: 'color' }}>
            <TableToolbarContent className={styles.toolbarContent}>
              <TableToolbarSearch
                className={styles.search}
                onChange={onInputChange}
                placeholder={t('searchThisList', 'Search this list')}
                size="sm"
              />
            </TableToolbarContent>
          </TableToolbar>
          <Table {...getTableProps()} className={styles.activeVisitsTable}>
            <TableHead>
              <TableRow>
                {headers.map((header) => (
                  <TableHeader {...getHeaderProps({ header })}>{header.header}</TableHeader>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow {...getRowProps({ row })}>
                  {row.cells.map((cell) => (
                    <TableCell key={cell.id}>{cell.value}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {rows.length === 0 ? (
            <div className={styles.tileContainer}>
              <Tile className={styles.tile}>
                <div className={styles.tileContent}>
                  <p className={styles.content}>{t('noPatientsToDisplay', 'No patients to display')}</p>
                  <p className={styles.helper}>{t('checkFilters', 'Check the filters above')}</p>
                </div>
                <p className={styles.separator}>{t('or', 'or')}</p>
                <Button kind="ghost" size="sm" renderIcon={(props) => <Add size={16} {...props} />} onClick={() => {}}>
                  {t('addPatientToList', 'Add patient to list')}
                </Button>
              </Tile>
            </div>
          ) : null}
          <Pagination
            forwardText="Next page"
            backwardText="Previous page"
            page={currentPage}
            pageSize={currentPageSize}
            pageSizes={pageSizes}
            totalItems={queueEntries?.length}
            className={styles.pagination}
            onChange={({ pageSize, page }) => {
              if (pageSize !== currentPageSize) {
                setPageSize(pageSize);
              }
              if (page !== currentPage) {
                goTo(page);
              }
            }}
          />
        </TableContainer>
      )}
    </DataTable>
  );
}
