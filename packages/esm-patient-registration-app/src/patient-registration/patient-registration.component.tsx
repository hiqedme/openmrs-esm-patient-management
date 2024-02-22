import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import classNames from 'classnames';
import { Button, Link, InlineLoading, Dropdown } from '@carbon/react';
import { XAxis } from '@carbon/react/icons';
import { useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Formik, Form, type FormikHelpers } from 'formik';
import {
  createErrorHandler,
  showSnackbar,
  useConfig,
  interpolateUrl,
  usePatient,
  showModal,
} from '@openmrs/esm-framework';
import { getValidationSchema } from './validation/patient-registration-validation';
import { type FormValues, type CapturePhotoProps } from './patient-registration.types';
import { PatientRegistrationContext } from './patient-registration-context';
import { type SavePatientForm, SavePatientTransactionManager } from './form-manager';
import { fetchPatientRecordFromClientRegistry, usePatientPhoto, fetchPerson } from './patient-registration.resource';
import { DummyDataInput } from './input/dummy-data/dummy-data-input.component';
import { cancelRegistration, filterUndefinedPatientIdenfier, scrollIntoView } from './patient-registration-utils';
import { useInitialAddressFieldValues, useInitialFormValues, usePatientUuidMap } from './patient-registration-hooks';
import { ResourcesContext } from '../offline.resources';
import { builtInSections, type RegistrationConfig, type SectionDefinition } from '../config-schema';
import { SectionWrapper } from './section/section-wrapper.component';
import BeforeSavePrompt from './before-save-prompt';
import styles from './patient-registration.scss';
import { TextInput } from '@carbon/react';

let exportedInitialFormValuesForTesting = {} as FormValues;

export interface PatientRegistrationProps {
  savePatientForm: SavePatientForm;
  isOffline: boolean;
}

export const PatientRegistration: React.FC<PatientRegistrationProps> = ({ savePatientForm, isOffline }) => {
  const { currentSession, addressTemplate, identifierTypes } = useContext(ResourcesContext);
  const { search } = useLocation();
  const config = useConfig() as RegistrationConfig;
  const [target, setTarget] = useState<undefined | string>();
  const { patientUuid: uuidOfPatientToEdit } = useParams();
  const { isLoading: isLoadingPatientToEdit, patient: patientToEdit } = usePatient(uuidOfPatientToEdit);
  const { t } = useTranslation();
  const [capturePhotoProps, setCapturePhotoProps] = useState<CapturePhotoProps | null>(null);
  const [initialFormValues, setInitialFormValues] = useInitialFormValues(uuidOfPatientToEdit);
  const [initialAddressFieldValues] = useInitialAddressFieldValues(uuidOfPatientToEdit);
  const [patientUuidMap] = usePatientUuidMap(uuidOfPatientToEdit);
  const location = currentSession?.sessionLocation?.uuid;
  const inEditMode = isLoadingPatientToEdit ? undefined : !!(uuidOfPatientToEdit && patientToEdit);
  const showDummyData = useMemo(() => localStorage.getItem('openmrs:devtools') === 'true' && !inEditMode, [inEditMode]);
  const { data: photo } = usePatientPhoto(patientToEdit?.id);
  const savePatientTransactionManager = useRef(new SavePatientTransactionManager());
  const fieldDefinition = config?.fieldDefinitions?.filter((def) => def.type === 'address');
  const validationSchema = getValidationSchema(config);
  const [clientRegistryData, setClientRegistryData] = useState<{
    country: string;
    identifierType: string;
    patientIdentifier: string;
    isSubmitting: boolean;
  }>({ country: 'KE', identifierType: '', patientIdentifier: '', isSubmitting: false });

  const handleClientRegistryData = (data, key: 'country' | 'identifierType' | 'patientIdentifier') => {
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
        const confirmPatientIdentifierModal = showModal('patient-identifier-confirmation-modal', {
          closeModal: () => cancelRegistration(),
          clientData,
        });
      } else {
        const clientData = res.client;
      }
    });
  };

  useEffect(() => {
    exportedInitialFormValuesForTesting = initialFormValues;
  }, [initialFormValues]);

  const sections: Array<SectionDefinition> = useMemo(() => {
    return config.sections
      .map(
        (sectionName) =>
          config.sectionDefinitions.filter((s) => s.id == sectionName)[0] ??
          builtInSections.filter((s) => s.id == sectionName)[0],
      )
      .filter((s) => s);
  }, [config.sections, config.sectionDefinitions]);

  const onFormSubmit = async (values: FormValues, helpers: FormikHelpers<FormValues>) => {
    const abortController = new AbortController();
    helpers.setSubmitting(true);

    const updatedFormValues = { ...values, identifiers: filterUndefinedPatientIdenfier(values.identifiers) };
    try {
      await savePatientForm(
        !inEditMode,
        updatedFormValues,
        patientUuidMap,
        initialAddressFieldValues,
        capturePhotoProps,
        location,
        initialFormValues['identifiers'],
        currentSession,
        config,
        savePatientTransactionManager.current,
        abortController,
      );

      showSnackbar({
        subtitle: inEditMode
          ? t('updatePatientSuccessSnackbarSubtitle', "The patient's information has been successfully updated")
          : t(
              'registerPatientSuccessSnackbarSubtitle',
              'The patient can now be found by searching for them using their name or ID number',
            ),
        title: inEditMode
          ? t('updatePatientSuccessSnackbarTitle', 'Patient Details Updated')
          : t('registerPatientSuccessSnackbarTitle', 'New Patient Created'),
        kind: 'success',
        isLowContrast: true,
      });

      const afterUrl = new URLSearchParams(search).get('afterUrl');
      const redirectUrl = interpolateUrl(afterUrl || config.links.submitButton, { patientUuid: values.patientUuid });

      setTarget(redirectUrl);
    } catch (error) {
      if (error.responseBody?.error?.globalErrors) {
        error.responseBody.error.globalErrors.forEach((error) => {
          showSnackbar({
            title: inEditMode
              ? t('updatePatientErrorSnackbarTitle', 'Patient Details Update Failed')
              : t('registrationErrorSnackbarTitle', 'Patient Registration Failed'),
            subtitle: error.message,
            kind: 'error',
          });
        });
      } else if (error.responseBody?.error?.message) {
        showSnackbar({
          title: inEditMode
            ? t('updatePatientErrorSnackbarTitle', 'Patient Details Update Failed')
            : t('registrationErrorSnackbarTitle', 'Patient Registration Failed'),
          subtitle: error.responseBody.error.message,
          kind: 'error',
        });
      } else {
        createErrorHandler()(error);
      }

      helpers.setSubmitting(false);
    }
  };

  const displayErrors = (errors) => {
    if (errors && typeof errors === 'object' && !!Object.keys(errors).length) {
      Object.keys(errors).forEach((error) => {
        showSnackbar({
          subtitle: t(`${error}LabelText`, error),
          title: t('incompleteForm', 'The following field has errors:'),
          kind: 'warning',
          isLowContrast: true,
          timeoutInMs: 5000,
        });
      });
    }
  };

  return (
    <Formik
      enableReinitialize
      initialValues={initialFormValues}
      validationSchema={validationSchema}
      onSubmit={onFormSubmit}>
      {(props) => (
        <Form className={styles.form}>
          <BeforeSavePrompt when={props.dirty} redirect={target} />
          <div className={styles.formContainer}>
            <div>
              <div className={styles.stickyColumn}>
                <h4>
                  {inEditMode ? t('edit', 'Edit') : t('createNew', 'Create New')} {t('patient', 'Patient')}
                </h4>
                {showDummyData && <DummyDataInput setValues={props.setValues} />}
                <p className={styles.label01}>{t('jumpTo', 'Jump to')}</p>
                {sections.map((section) => (
                  <div className={classNames(styles.space05, styles.touchTarget)} key={section.name}>
                    <Link className={styles.linkName} onClick={() => scrollIntoView(section.id)}>
                      <XAxis size={16} /> {t(`${section.id}Section`, section.name)}
                    </Link>
                  </div>
                ))}
                <Button
                  className={styles.submitButton}
                  type="submit"
                  onClick={() => props.validateForm().then((errors) => displayErrors(errors))}
                  // Current session and identifiers are required for patient registration.
                  // If currentSession or identifierTypes are not available, then the
                  // user should be blocked to register the patient.
                  disabled={!currentSession || !identifierTypes || props.isSubmitting}>
                  {props.isSubmitting ? (
                    <InlineLoading
                      className={styles.spinner}
                      description={`${t('submitting', 'Submitting')} ...`}
                      iconDescription="submitting"
                      status="active"
                    />
                  ) : inEditMode ? (
                    t('updatePatient', 'Update Patient')
                  ) : (
                    t('registerPatient', 'Register Patient')
                  )}
                </Button>
                <Button className={styles.cancelButton} kind="tertiary" onClick={cancelRegistration}>
                  {t('cancel', 'Cancel')}
                </Button>
              </div>
            </div>
            <div className={styles.infoGrid}>
              <PatientRegistrationContext.Provider
                value={{
                  identifierTypes: identifierTypes,
                  validationSchema,
                  values: props.values,
                  inEditMode,
                  setFieldValue: props.setFieldValue,
                  setCapturePhotoProps,
                  currentPhoto: photo?.imageSrc,
                  isOffline,
                  initialFormValues: props.initialValues,
                  setInitialFormValues,
                }}>
                <div className={styles.patientVerification}>
                  <h2>Patient Verification</h2>
                  <Dropdown
                    id="default"
                    titleText="Country"
                    label="Select country"
                    items={[
                      { text: 'Kenya', id: 'KE' },
                      { text: 'Uganda', id: 'UG' },
                      { text: 'Tanzania', id: 'TZ' },
                    ]}
                    onChange={({ selectedItem }) => handleClientRegistryData(selectedItem?.id, 'country')}
                    initialSelectedItem={{ text: 'Kenya', id: '1' }}
                    itemToString={(item) => (item ? item.text : '')}
                  />
                  <Dropdown
                    id="default"
                    titleText="Verification ID Type"
                    label="Select verification ID Type"
                    items={[
                      { text: 'National ID number', id: '58a47054-1359-11df-a1f1-0026b9348838' },
                      { text: 'Passport number', id: 'ced014a1-068a-4a13-b6b3-17412f754af2' },
                      { text: 'Birth Certificate Entry Number', id: '7924e13b-131a-4da8-8efa-e294184a1b0d' },
                    ]}
                    onChange={({ selectedItem }) => handleClientRegistryData(selectedItem?.id, 'identifierType')}
                    itemToString={(item) => (item ? item.text : '')}
                  />
                  <TextInput
                    disabled={clientRegistryData.identifierType === ''}
                    onChange={(e) => handleClientRegistryData(e.target.value, 'patientIdentifier')}
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
                      size="sm"
                      disabled={clientRegistryData.isSubmitting || clientRegistryData.patientIdentifier === ''}
                      onClick={() => handleClientRegistryDataSubmit()}>
                      {t('searchRegistry', 'Search Registry')}
                    </Button>
                  )}
                </div>
                {sections.map((section, index) => (
                  <SectionWrapper
                    key={`registration-section-${section.id}`}
                    sectionDefinition={section}
                    index={index}
                  />
                ))}
              </PatientRegistrationContext.Provider>
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );
};

/**
 * @internal
 * Just exported for testing
 */
export { exportedInitialFormValuesForTesting as initialFormValues };
function dispose() {
  throw new Error('Function not implemented.');
}
