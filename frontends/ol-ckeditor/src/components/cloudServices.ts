import type { CloudServicesConfig } from "@ckeditor/ckeditor5-cloud-services"
import axios from "axios"

const cloudServicesConfig = () =>
  ({
    uploadUrl: window.SETTINGS.ckeditor_upload_url,
    tokenUrl: async () => {
      const { data } = await axios.get("/api/v1/ckeditor/")
      return data as string
    },
  }) satisfies CloudServicesConfig

export default cloudServicesConfig
