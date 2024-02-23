import { showModal } from '@openmrs/esm-framework';
import { useState } from 'react';
import { fetchPatientRecordFromClientRegistry } from '../patient-registration/patient-registration.resource';
import { defaultSelectedCountry } from './client-registry-constants';

export const handleSetFormValueFromClientRegistry = (clientData, setInitialFormValues, initialFormValues) => {
  setInitialFormValues({
    ...initialFormValues,
    familyName: clientData.lastName,
    givenName: clientData.firstName,
    middleName: clientData.middleName,
    gender: clientData.gender,
    birthdate: clientData.dateOfBirth,
    address: {
      address2: clientData.subCounty,
    },
  });
};

export const useClientRegistryForm = (setInitialFormValues, initialFormValues) => {
  const [clientRegistryData, setClientRegistryData] = useState<{
    country: string;
    identifierType: string;
    patientIdentifier: string;
    isSubmitting: boolean;
  }>({ country: defaultSelectedCountry, identifierType: '', patientIdentifier: '', isSubmitting: false });

  const handleOnChange = (data, key: 'country' | 'identifierType' | 'patientIdentifier') => {
    setClientRegistryData({ ...clientRegistryData, [key]: data });
  };

  const handleClientRegistryDataSubmit = () => {
    setClientRegistryData({ ...clientRegistryData, isSubmitting: true });
    fetchPatientRecordFromClientRegistry(
      clientRegistryData.patientIdentifier,
      clientRegistryData.identifierType,
      clientRegistryData.country,
    ).then((res) => {
      setClientRegistryData({ ...clientRegistryData, isSubmitting: false });
      if (res.clientExists) {
        const clientData = res.client;
        const closeModal = showModal('client-registry-modal', {
          clientData,
          closeModal: () => {
            closeModal();
            handleSetFormValueFromClientRegistry(clientData, setInitialFormValues, initialFormValues);
          },
        });
      } else {
        const clientData = res.client;
      }
    });
  };

  return { handleClientRegistryDataSubmit, handleOnChange, clientRegistryData };
};
