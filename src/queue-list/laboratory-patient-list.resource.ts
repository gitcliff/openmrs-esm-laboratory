import { PatientQueue, UuidDisplay } from "../types/patient-queues";
import dayjs from "dayjs";
import useSWR from "swr";

import {
  formatDate,
  openmrsFetch,
  parseDate,
  restBaseUrl,
} from "@openmrs/esm-framework";

export interface MappedPatientQueueEntry {
  id: string;
  name: string;
  patientAge: number;
  patientSex: string;
  patientDob: string;
  patientUuid: string;
  priority: string;
  priorityComment: string;
  status: string;
  waitTime: string;
  locationFrom?: string;
  locationToName?: string;
  visitNumber: string;
  identifiers: Array<UuidDisplay>;
  dateCreated: string;
  creatorUuid: string;
  creatorUsername: string;
  creatorDisplay: string;
}

export function usePatientQueuesList(
  currentQueueRoomLocationUuid: string,
  status: string
) {
  const apiUrl = `${restBaseUrl}/patientqueue?v=full&room=${currentQueueRoomLocationUuid}&status=${status}`;
  return usePatientQueueRequest(apiUrl);
}

export function usePatientQueueRequest(apiUrl: string) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<
    { data: { results: Array<PatientQueue> } },
    Error
  >(apiUrl, openmrsFetch, { refreshInterval: 3000 });

  const mappedQueues = data?.data?.results.map((queue: PatientQueue) => {
    return {
      ...queue,
      id: queue.uuid,
      name: queue.patient?.person.display,
      patientUuid: queue.patient?.uuid,
      priorityComment: queue.priorityComment,
      encounter: queue.encounter,
      priority:
        queue.priorityComment === "Urgent" ? "Priority" : queue.priorityComment,
      priorityLevel: queue.priority,
      waitTime: queue.dateCreated
        ? `${dayjs().diff(dayjs(queue.dateCreated), "minutes")}`
        : "--",
      status: queue.status,
      patientAge: queue.patient?.person?.age,
      patientSex: queue.patient?.person?.gender === "M" ? "MALE" : "FEMALE",
      patientDob: queue.patient?.person?.birthdate
        ? formatDate(parseDate(queue.patient.person.birthdate), { time: false })
        : "--",
      identifiers: queue.patient?.identifiers,
      locationFrom: queue.locationFrom?.uuid,
      locationFromName: queue.locationFrom?.name,
      locationTo: queue.locationTo?.uuid,
      locationToName: queue.locationTo?.name,
      queueRoom: queue.locationTo?.display,
      visitNumber: queue.visitNumber,
      dateCreated: queue.dateCreated
        ? formatDate(parseDate(queue.dateCreated), { time: false })
        : "--",
      creatorUuid: queue.creator?.uuid,
      creatorUsername: queue.creator?.username,
      creatorDisplay: queue.creator?.display,
    };
  });

  return {
    patientQueueEntries: mappedQueues || [],
    patientQueueCount: mappedQueues?.length ?? 0,
    isLoading,
    isError: error,
    isValidating,
    mutate,
  };
}
