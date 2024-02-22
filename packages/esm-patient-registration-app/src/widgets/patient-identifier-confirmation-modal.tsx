import React, { useCallback } from 'react';
import styles from './delete-identifier-modal.scss';
import { useTranslation } from 'react-i18next';
import { Button } from '@carbon/react';

interface PatientIdentifierConfirmationModalProps {
  closeModal: (x: boolean) => void;
  identifierName: string;
  identifierValue: string;
}

const PatientIdentifierConfirmationModal: React.FC<PatientIdentifierConfirmationModalProps> = ({
  closeModal,
  identifierName,
  identifierValue,
}) => {
  const { t } = useTranslation();
  return (
    <div className={styles.modalContent}>
      <h1 className={styles.productiveHeading}>{t('patientIdentifierModalHeading', 'Information')}</h1>
      <h3 className={styles.modalSubtitle}>
        {identifierName}
        {t('patientIdentifierModalText', ' has a value of ')} {identifierValue}
      </h3>
      <p className={styles.modalBody}>
        {t('confirmIdentifierDeletionText', 'Are you sure you want to remove this identifier?')}
      </p>
      <div className={styles.buttonSet}>
        <Button kind="secondary" size="lg" onClick={() => closeModal(false)}>
          {t('cancel', 'Cancel')}
        </Button>
        <Button kind="danger" size="lg" onClick={() => closeModal(false)}>
          {t('removeIdentifierButton', 'Remove Identifier')}
        </Button>
      </div>
    </div>
  );
};

export default PatientIdentifierConfirmationModal;
