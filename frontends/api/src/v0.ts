

// export { ChannelTypeEnum } from "@mitodl/open-api-axios/v1"

export * from "@mitodl/open-api-axios/v0"

// TODO belowe items are not in latest published api client yet

export const CertificateDesiredEnumDescriptions = {
  yes: "Yes, I am looking for a certificate",
  no: "No, I am not looking for a certificate",
  "not-sure-yet": "Not Sure",
} as const

export const CurrentEducationEnumDescriptions = {
  Doctorate: "Doctorate",
  "Master's or professional degree": "Master's or professional degree",
  "Bachelor's degree": "Bachelor's degree",
  "Associate degree": "Associate degree",
  "Secondary/high school": "Secondary/high school",
  "Junior secondary/junior high/middle school":
    "Junior secondary/junior high/middle school",
  "No formal education": "No formal education",
  "Other education": "Other education",
} as const


export const GoalsEnumDescriptions = {
  "academic-excellence": "Academic Boost",
  "career-growth": "Career Growth",
  "lifelong-learning": "Lifelong Learning",
} as const

export const DeliveryEnumDescriptions = {
  online: "Online",
  hybrid: "Hybrid",
  in_person: "In-Person",
  offline: "Offline",
} as const
