import { openmrsFetch, restBaseUrl } from '@openmrs/esm-framework';

export function saveQueueRoom(name: string, description: string, queueUuid: string) {
  const abortController = new AbortController();

  return openmrsFetch(`${restBaseUrl}/queueroom`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    signal: abortController.signal,
    body: {
      name: name,
      description: description,
      queue: {
        uuid: queueUuid,
      },
    },
  });
}
