import React from 'react';
import { ModalHeader, ModalBody, ModalFooter, Button } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import styles from './verification-modal.scss';

type VerificationModalProps = { clientData; closeModal };

const VerificationModal: React.FC<VerificationModalProps> = ({ clientData, closeModal }) => {
  const { t } = useTranslation();

  return (
    <div>
      <ModalHeader closeModal={closeModal} title={t('clientRegistry', 'Client registry')} />
      <ModalBody>
        <p>{t('clientRegistry', 'Client registry')}</p>
        <Card label="Name" value={`${clientData.firstName} ${clientData.middleName} ${clientData.lastName}`} />
        <Card
          label="Identification Type"
          value={clientData.identifications.map((id) => id.identificationType).join(' ')}
        />
        <Card
          label="Identication Number"
          value={clientData.identifications.map((id) => id.identificationNumber).join(' ')}
        />
        <Card label="Date of Birth" value={clientData.dateOfBirth} />
        <Card label={t('gender', 'Gender')} value={clientData.gender} />
      </ModalBody>
      <ModalFooter>
        <Button kind="secondary" onClick={() => {}}>
          {t('contactSupport', 'Contact supportt')}
        </Button>
        <Button kind="danger" onClick={closeModal}>
          {t('useValues', 'Use  Values')}
        </Button>
      </ModalFooter>
    </div>
  );
};

export default VerificationModal;

export const Card: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  return (
    <div className={styles.cardContainer}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
};
