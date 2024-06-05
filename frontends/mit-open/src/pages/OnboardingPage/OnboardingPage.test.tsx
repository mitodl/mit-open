import React from "react"
import { merge, times } from "lodash"

import {
  renderWithProviders,
  screen,
  waitFor,
  setMockResponse,
  user,
} from "../../test-utils"
import { allowConsoleErrors } from "ol-test-utilities"
import { urls } from "api/test-utils"
import * as factories from "api/test-utils/factories"
import {
  GoalsEnum,
  LearningFormatEnum,
  TimeCommitmentEnum,
  CurrentEducationEnum,
  CertificateDesiredEnum,
  type Profile,
} from "api/v0"

import OnboardingPage from "./OnboardingPage"

const STEPS_DATA: Partial<Profile>[] = [
  {
    topic_interests: [factories.learningResources.topic()],
  },
  {
    goals: [GoalsEnum.JustToLearn],
  },
  {
    certificate_desired: CertificateDesiredEnum.Yes,
  },
  {
    time_commitment: TimeCommitmentEnum._0To5Hours,
  },
  {
    current_education: CurrentEducationEnum.SecondaryOrHighSchool,
  },
  {
    learning_format: LearningFormatEnum.Hybrid,
  },
]

const baseProfile = factories.profiles.profile()

const profileForStep = (step: number) => {
  const stepsData = STEPS_DATA.slice(0, step)
  return merge({}, baseProfile, ...stepsData)
}

const STEP_TITLES = [
  "What are you interested in learning about?",
  "What do you want MIT online education to help you reach?",
  "Are you seeking to receive a certificate?",
  "What is your current level of education?",
  "How much time per week do you want to commit to learning?",
  "What course format are you interested in?",
]

const PROFILES_FOR_STEPS = times(STEPS_DATA.length, profileForStep)

const setup = async (profile: Profile) => {
  allowConsoleErrors()

  setMockResponse.get(urls.profileMe.get(), profile)
  setMockResponse.patch(urls.profileMe.patch(), (req: Partial<Profile>) => ({
    ...profile,
    ...req,
  }))

  renderWithProviders(<OnboardingPage />)
}

// this function sets up the test and progresses the UI to the designated step
const setupAndProgressToStep = async (step: number) => {
  await setup(PROFILES_FOR_STEPS[step])

  for (let stepIdx = 0; stepIdx < step; stepIdx++) {
    await user.click(await findNextButton())
  }
}

const findNextButton = async () => screen.findByRole("button", { name: "Next" })
const findBackButton = async () => screen.findByRole("button", { name: "Back" })
const findFinishButton = async () =>
  screen.findByRole("button", { name: "Finish" })

const queryNextButton = () => screen.queryByRole("button", { name: "Next" })
const queryBackButton = () => screen.queryByRole("button", { name: "Back" })
const queryFinishButton = () => screen.queryByRole("button", { name: "Finish" })

describe.skip("OnboardingPage", () => {
  describe("Topic Interests step", () => {
    const STEP = 0
    const TITLE = STEP_TITLES[STEP]

    beforeEach(async () => {
      await setupAndProgressToStep(STEP)
    })

    test(`Title should be '${TITLE}'`, async () => {
      expect(await screen.findByText(TITLE, { exact: false })).not.toBeNil()
    })

    test("Has 'Next' but not 'Back' or 'Finish' buttons", async () => {
      const backButton = queryBackButton()
      const nextButton = await findNextButton()
      const finishButton = queryFinishButton()

      expect(backButton).toBeNil()
      expect(nextButton).toBeDisabled()
      expect(finishButton).toBeNil()
    })
  })

  describe("Goals step", () => {
    const STEP = 1
    const TITLE = STEP_TITLES[STEP]

    beforeEach(async () => {
      await setupAndProgressToStep(STEP)
    })

    test(`Title should be '${TITLE}'`, async () => {
      expect(await screen.findByText(TITLE, { exact: false })).not.toBeNil()
    })

    test("Has 'Next' and 'Back' buttons", async () => {
      const backButton = await findBackButton()
      const nextButton = await findNextButton()
      const finishButton = queryFinishButton()

      expect(backButton).toBeEnabled()
      expect(nextButton).toBeDisabled()
      expect(finishButton).toBeNil()
    })

    test("Back button should go to previous step", async () => {
      const backButton = await findBackButton()

      await user.click(backButton)

      await waitFor(async () => {
        expect(
          await screen.findByText(STEP_TITLES[STEP - 1], { exact: false }),
        ).not.toBeNil()
      })
    })
  })

  describe("Certificate step", () => {
    const STEP = 2
    const TITLE = STEP_TITLES[STEP]

    beforeEach(async () => {
      await setupAndProgressToStep(STEP)
    })

    test(`Title should be '${TITLE}'`, async () => {
      expect(await screen.findByText(TITLE, { exact: false })).not.toBeNil()
    })

    test("Has 'Next' and 'Back' buttons", async () => {
      const backButton = await findBackButton()
      const nextButton = await findNextButton()
      const finishButton = queryFinishButton()

      expect(backButton).toBeEnabled()
      expect(nextButton).toBeDisabled()
      expect(finishButton).toBeNil()
    })

    test("Back button should go to previous step", async () => {
      const backButton = await findBackButton()

      await user.click(backButton)

      await waitFor(async () => {
        expect(
          await screen.findByText(STEP_TITLES[STEP - 1], { exact: false }),
        ).not.toBeNil()
      })
    })
  })

  describe("Current education step", () => {
    const STEP = 3
    const TITLE = STEP_TITLES[STEP]

    beforeEach(async () => {
      await setupAndProgressToStep(STEP)
    })

    test(`Title should be '${TITLE}'`, async () => {
      expect(await screen.findByText(TITLE, { exact: false })).not.toBeNil()
    })

    test("Has 'Next' and 'Back' buttons", async () => {
      const backButton = await findBackButton()
      const nextButton = await findNextButton()
      const finishButton = queryFinishButton()

      expect(backButton).toBeEnabled()
      expect(nextButton).toBeDisabled()
      expect(finishButton).toBeNil()
    })

    test("Back button should go to previous step", async () => {
      const backButton = await findBackButton()

      await user.click(backButton)

      await waitFor(async () => {
        expect(
          await screen.findByText(STEP_TITLES[STEP - 1], { exact: false }),
        ).not.toBeNil()
      })
    })
  })

  describe("Time commitment step", () => {
    const STEP = 4
    const TITLE = STEP_TITLES[STEP]

    beforeEach(async () => {
      await setupAndProgressToStep(STEP)
    })

    test(`Title should be '${TITLE}'`, async () => {
      expect(await screen.findByText(TITLE, { exact: false })).not.toBeNil()
    })

    test("Has 'Next' and 'Back' buttons", async () => {
      const backButton = await findBackButton()
      const nextButton = await findNextButton()
      const finishButton = queryFinishButton()

      expect(backButton).toBeEnabled()
      expect(nextButton).toBeDisabled()
      expect(finishButton).toBeNil()
    })

    test("Back button should go to previous step", async () => {
      const backButton = await findBackButton()

      await user.click(backButton)

      await waitFor(async () => {
        expect(
          await screen.findByText(STEP_TITLES[STEP - 1], { exact: false }),
        ).not.toBeNil()
      })
    })
  })

  describe("Learning format step", () => {
    const STEP = 5
    const TITLE = STEP_TITLES[STEP]

    beforeEach(async () => {
      await setupAndProgressToStep(STEP)
    })

    test(`Title should be '${TITLE}'`, async () => {
      expect(await screen.findByText(TITLE, { exact: false })).not.toBeNil()
    })

    test("Has 'Next' and 'Back' buttons", async () => {
      const backButton = await findBackButton()
      const nextButton = queryNextButton()
      const finishButton = await findFinishButton()

      expect(backButton).toBeEnabled()
      expect(nextButton).toBeNil()
      expect(finishButton).toBeDisabled()
    })

    test("Back button should go to previous step", async () => {
      const backButton = await findBackButton()

      await user.click(backButton)

      await waitFor(async () => {
        expect(
          await screen.findByText(STEP_TITLES[STEP - 1], { exact: false }),
        ).not.toBeNil()
      })
    })
  })
})