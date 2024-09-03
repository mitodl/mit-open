/**
 * JSDOM doesn't support changes to window.location, and Jest can't directly spy
 * on its properties because window.location is not configurable.
 *
 * This temporarily re-defines window.location to a plain object, which allows
 * us to spy on its properties.
 */
const withFakeLocation = async (
  cb: () => Promise<void> | void,
): Promise<Location> => {
  const originalLocation = window.location
  // @ts-expect-error We're deleting a required property, but we're about to re-assign it.
  delete window.location
  try {
    // copying an object with spread converts getters/setters to normal properties
    window.location = { ...originalLocation }
    await cb()
    return window.location
  } finally {
    window.location = originalLocation
  }
}

export { withFakeLocation }
