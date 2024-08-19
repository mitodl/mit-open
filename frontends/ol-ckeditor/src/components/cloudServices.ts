import type { CloudServicesConfig } from "@ckeditor/ckeditor5-cloud-services"
import axios from "axios"

const cloudServicesConfig = () =>
  ({
    uploadUrl: process.env.CKEDITOR_UPLOAD_URL,
    tokenUrl: async () => {
      const { data } = await axios.get("/api/v0/ckeditor/")
      return data.token as string
    },
  }) satisfies CloudServicesConfig

export default cloudServicesConfig
