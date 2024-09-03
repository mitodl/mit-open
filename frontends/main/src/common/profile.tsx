import React from "react"
import * as yup from "yup"
import {
  CertificateDesiredEnum,
  CertificateDesiredEnumDescriptions,
  CurrentEducationEnum,
  CurrentEducationEnumDescriptions,
  GoalsEnum,
  GoalsEnumDescriptions,
  DeliveryEnum,
  DeliveryEnumDescriptions,
} from "api/v0"
import { SimpleSelectOption } from "ol-components"

const DELIVERY_CHOICES = [
  DeliveryEnum.Online,
  DeliveryEnum.InPerson,
  DeliveryEnum.Hybrid,
  DeliveryEnum.Offline,
].map((value) => ({
  value,
  label: DeliveryEnumDescriptions[value],
}))

const GOALS_CHOICES = [
  {
    value: GoalsEnum.AcademicExcellence,
    label: GoalsEnumDescriptions[GoalsEnum.AcademicExcellence],
    description: "Support my degree studies with supplemental learning.",
  },
  {
    value: GoalsEnum.CareerGrowth,
    label: GoalsEnumDescriptions[GoalsEnum.CareerGrowth],
    description: "Advance my career through new skills and certifications.",
  },
  {
    value: GoalsEnum.LifelongLearning,
    label: GoalsEnumDescriptions[GoalsEnum.LifelongLearning],
    description: "Learn about topics that spark my curiosity.",
  },
]

const EDUCATION_LEVEL_OPTIONS: SimpleSelectOption[] = [
  {
    label: <em>Please Select</em>,
    disabled: true,
    value: "",
  },
  ...Object.values(CurrentEducationEnum).map((value) => ({
    value,
    label: CurrentEducationEnumDescriptions[value],
  })),
]

const CERTIFICATE_CHOICES = [
  CertificateDesiredEnum.Yes,
  CertificateDesiredEnum.No,
  CertificateDesiredEnum.NotSureYet,
].map((value) => ({
  value,
  label: CertificateDesiredEnumDescriptions[value],
}))

const ProfileSchema = yup.object().shape({
  topic_interests: yup.array().of(yup.string()),
  goals: yup
    .array()
    .of(yup.string().oneOf(GOALS_CHOICES.map((choice) => choice.value))),
  certificate_desired: yup
    .string()
    .oneOf(CERTIFICATE_CHOICES.map((choice) => choice.value)),
  current_education: yup
    .string()
    .oneOf(EDUCATION_LEVEL_OPTIONS.map((choice) => choice.value)),
  delivery: yup
    .array()
    .of(yup.string().oneOf(DELIVERY_CHOICES.map((choice) => choice.value))),
})

export {
  DELIVERY_CHOICES,
  GOALS_CHOICES,
  EDUCATION_LEVEL_OPTIONS,
  CERTIFICATE_CHOICES,
  ProfileSchema,
}
