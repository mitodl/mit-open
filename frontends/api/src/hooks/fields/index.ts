import {
  UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { fieldsApi } from "../../clients"
import type {
  FieldsApiFieldsListRequest as FieldsApiListRequest,
  PatchedFieldChannelWriteRequest,
} from "../../generated/v0"
import fields from "./keyFactory"

const useFieldsList = (
  params: FieldsApiListRequest = {},
  opts: Pick<UseQueryOptions, "enabled"> = {},
) => {
  return useQuery({
    ...fields.list(params),
    ...opts,
  })
}

const useFieldDetail = (fieldName: string | undefined) => {
  return useQuery({
    ...fields.detail(fieldName ?? ""),
  })
}

const useFieldPartialUpdate = () => {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (
      data: PatchedFieldChannelWriteRequest & { field_name: string },
    ) =>
      fieldsApi
        .fieldsPartialUpdate({
          field_name: data.field_name,
          PatchedFieldChannelWriteRequest: data,
        })
        .then((response) => response.data),
    onSuccess: (_data) => {
      client.invalidateQueries(fields._def)
    },
  })
}

export { useFieldDetail, useFieldsList, useFieldPartialUpdate }
