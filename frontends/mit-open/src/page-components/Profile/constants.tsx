import React from "react"
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

export {
  LEARNING_FORMAT_CHOICES,
  GOALS_CHOICES,
  EDUCATION_LEVEL_OPTIONS,
  CERTIFICATE_CHOICES,
}
