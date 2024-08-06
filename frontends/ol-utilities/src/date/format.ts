import moment from "moment"

export const formatDate = (
  /**
   * Date string or date.
   */
  date: string | Date,
  /**
   * A momentjs format string. See https://momentjs.com/docs/#/displaying/format/
   */
  format = "MMM D, YYYY",
) => {
  return moment(date).format(format)
}
