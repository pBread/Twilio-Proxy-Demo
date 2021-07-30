export interface ApiResult {
  services: Service[];
  sessions: Session[];
  participants: Participant[];
  interactions: Interaction[];
  phoneNumbers: PhoneNumber[];
}

export interface Interaction {
  sid: string;
  sessionSid: string;
  serviceSid: string;
  accountSid: string;
  data: string;
  type: string;
  inboundParticipantSid: string;
  inboundResourceSid: string;
  inboundResourceStatus: string;
  inboundResourceType: string;
  inboundResourceUrl: string;
  outboundParticipantSid: string;
  outboundResourceSid: string;
  outboundResourceStatus: string;
  outboundResourceType: string;
  outboundResourceUrl: string;
  dateCreated: Date;
  dateUpdated: Date;
  url: string;
}

export interface Participant {
  sid: string;
  sessionSid: string;
  serviceSid: string;
  accountSid: string;
  friendlyName: null | string;
  identifier: string;
  proxyIdentifier: string;
  proxyIdentifierSid: string;
  dateDeleted: null;
  dateCreated: Date;
  dateUpdated: Date;
  url: string;
  links: ParticipantLinks;
}

export interface ParticipantLinks {
  message_interactions: string;
}

export interface PhoneNumber {
  sid: string;
  accountSid: string;
  serviceSid: string;
  dateCreated: Date;
  dateUpdated: Date;
  phoneNumber: string;
  friendlyName: string;
  isoCountry: string;
  capabilities: { [key: string]: boolean };
  url: string;
  isReserved: boolean;
  inUse: number;
}

export interface Service {
  sid: string;
  uniqueName: string;
  accountSid: string;
  chatInstanceSid: null;
  callbackUrl: null;
  defaultTtl: number;
  numberSelectionBehavior: string;
  geoMatchLevel: string;
  interceptCallbackUrl: null;
  outOfSessionCallbackUrl: string;
  dateCreated: Date;
  dateUpdated: Date;
  url: string;
  links: ServiceLinks;
}

export interface ServiceLinks {
  phone_numbers: string;
  short_codes: string;
  sessions: string;
}

export interface Session {
  sid: string;
  serviceSid: string;
  accountSid: string;
  dateStarted: Date;
  dateEnded: null;
  dateLastInteraction: Date;
  dateExpiry: null;
  uniqueName: string;
  status: string;
  closedReason: null;
  ttl: number;
  mode: string;
  dateCreated: Date;
  dateUpdated: Date;
  url: string;
  links: SessionLinks;
}

export interface SessionLinks {
  participants: string;
  interactions: string;
}
