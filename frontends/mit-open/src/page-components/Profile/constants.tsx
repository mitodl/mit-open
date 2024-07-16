import React from "react"
import * as yup from "yup"
import {
  CertificateDesiredEnum,
  CertificateDesiredEnumDescriptions,
  CurrentEducationEnum,
  CurrentEducationEnumDescriptions,
  GoalsEnum,
  GoalsEnumDescriptions,
  LearningFormatEnum,
  LearningFormatEnumDescriptions,
} from "api/v0"
import { SimpleSelectOption } from "ol-components"

const LEARNING_FORMAT_CHOICES = [
  LearningFormatEnum.Online,
  LearningFormatEnum.InPerson,
  LearningFormatEnum.Hybrid,
].map((value) => ({
  value,
  label: LearningFormatEnumDescriptions[value],
}))

const GOALS_CHOICES = [
  {
    value: GoalsEnum.AcademicExcellence,
    label: GoalsEnumDescriptions[GoalsEnum.AcademicExcellence],
    description: "Supplemental learning to support me in earning a degree.",
  },
  {
    value: GoalsEnum.CareerGrowth,
    label: GoalsEnumDescriptions[GoalsEnum.CareerGrowth],
    description:
      "Looking for career growth through new skills & certification.",
  },
  {
    value: GoalsEnum.LifelongLearning,
    label: GoalsEnumDescriptions[GoalsEnum.LifelongLearning],
    description: "Learning about topics that interest me just for fun.",
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
  learning_format: yup
    .array()
    .of(
      yup.string().oneOf(LEARNING_FORMAT_CHOICES.map((choice) => choice.value)),
    ),
})

export {
  LEARNING_FORMAT_CHOICES,
  GOALS_CHOICES,
  EDUCATION_LEVEL_OPTIONS,
  CERTIFICATE_CHOICES,
  ProfileSchema,
}
