import moment from "moment"

export const formatDate = (date: string | Date, format = "MMM D, YYYY") => {
  return moment(date).format(format)
}
