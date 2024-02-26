import React from 'react';
import { type FormValues } from '../patient-registration/patient-registration.types';
import {} from '@carbon/react';
import { Dropdown, TextInput, Button, InlineLoading } from '@carbon/react';
import styles from './client-registry.scss';
import { useTranslation } from 'react-i18next';
import { useClientRegistryForm } from './utils';
import { countries, identifierTypes } from './client-registry-constants';

type ClientRegistryProps = {
  setInitialFormValues: (initialValues) => void;
  initialFormValues: FormValues;
};

export const ClientRegistry: React.FC<ClientRegistryProps> = ({ setInitialFormValues, initialFormValues }) => {
  const { t } = useTranslation();
  const { handleClientRegistryDataSubmit, handleOnChange, clientRegistryData } = useClientRegistryForm(
    setInitialFormValues,
    initialFormValues,
  );
  return (
    <div className={styles.patientVerification}>
      <h3 className={styles.productiveHeading02} style={{ color: '#161616' }}>
        {t('patientVerification', 'Patient Verification')}
      </h3>
      <Dropdown
        id="default"
        titleText="Country"
        label="Select country"
        items={countries}
        onChange={({ selectedItem }) => handleOnChange(selectedItem?.id, 'country')}
        initialSelectedItem={countries[0]}
        itemToString={(item) => (item ? item.text : '')}
      />
      <Dropdown
        id="default"
        titleText="Verification ID Type"
        label="Select verification ID Type"
        items={identifierTypes}
        onChange={({ selectedItem }) => handleOnChange(selectedItem?.id, 'identifierType')}
        itemToString={(item) => (item ? item.text : '')}
      />
      <TextInput
        disabled={clientRegistryData.identifierType === ''}
        onChange={(e) => handleOnChange(e.target.value, 'patientIdentifier')}
        id="patientIdentifier"
        type="text"
        labelText="Patient identifier"
        placeholder="Enter patient identifier"
      />
      {clientRegistryData.isSubmitting ? (
        <InlineLoading
          description={`${t('searchRegistry', 'Searching registry')} ...`}
          iconDescription="searching registry ..."
          status="active"
        />
      ) : (
        <Button
          disabled={clientRegistryData.isSubmitting || clientRegistryData.patientIdentifier === ''}
          onClick={() => handleClientRegistryDataSubmit()}>
          {t('searchRegistry', 'Search Registry')}
        </Button>
      )}
    </div>
  );
};
