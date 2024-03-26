import { fieldsApi } from "../../clients"
import type { FieldsApiFieldsListRequest as FieldsApiListRequest } from "../../generated/v0"
import { createQueryKeys } from "@lukemorales/query-key-factory"

const fields = createQueryKeys("field", {
  detail: (fieldName: string) => ({
    queryKey: [fieldName],
    queryFn: () => {
      return fieldsApi
        .fieldsRetrieve({ field_name: fieldName })
        .then((res) => res.data)
    },
  }),
  list: (params: FieldsApiListRequest) => ({
    queryKey: [params],
    queryFn: () => fieldsApi.fieldsList(params).then((res) => res.data),
  }),
})

export default fields
