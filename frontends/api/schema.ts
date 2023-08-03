/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

export interface paths {
  "/api/v0/fields/": {
    /** @description Viewset for Field Channels */
    get: operations["root_list"]
    /** @description Viewset for Field Channels */
    post: operations["root_create"]
  }
  "/api/v0/fields/{field_name}/": {
    /** @description Viewset for Field Channels */
    get: operations["root_retrieve"]
    /** @description Viewset for Field Channels */
    put: operations["root_update"]
    /** @description Viewset for Field Channels */
    delete: operations["root_destroy"]
    /** @description Viewset for Field Channels */
    patch: operations["root_partial_update"]
  }
  "/api/v0/fields/{field_name}/moderators/": {
    /** @description View for listing and adding moderators */
    get: operations["moderators_list"]
    /** @description View for listing and adding moderators */
    post: operations["moderators_create"]
  }
  "/api/v0/fields/{field_name}/moderators/{moderator_name}/": {
    /** @description Remove the user from the moderator groups for this website */
    delete: operations["moderators_destroy"]
  }
}

export type webhooks = Record<string, never>

export interface components {
  schemas: {
    /** @description Serializer for CourseTopic model */
    CourseTopic: {
      id: number
      name: string
    }
    /** @description Serializer for FieldChannel */
    FieldChannel: {
      name: string
      title: string
      about: {
        [key: string]: unknown
      } | null
      public_description: string
      subfields: readonly components["schemas"]["Subfield"][]
      featured_list: components["schemas"]["UserList"]
      lists: readonly components["schemas"]["UserList"][]
      /** @description Get the avatar image URL */
      avatar?: string
      /** @description Get the avatar image medium URL */
      avatar_medium: string
      /** @description Get the avatar image small URL */
      avatar_small: string
      /** @description Get the banner image URL */
      banner?: string
      widget_list: number | null
      /** Format: date-time */
      updated_on: string
      /** Format: date-time */
      created_on: string
      id: number
      ga_tracking_id: string | null
      /** @description Return true if user is a moderator for the channel */
      is_moderator: boolean
    }
    /** @description Write serializer for FieldChannel */
    FieldChannelCreate: {
      name: string
      title: string
      public_description?: string
      subfields?: components["schemas"]["Subfield"][]
      featured_list?: number | null
      lists?: components["schemas"]["UserList"][]
      about?: {
        [key: string]: unknown
      } | null
    }
    /** @description Similar to FieldChannelCreateSerializer, with read-only name */
    FieldChannelWrite: {
      name: string
      title: string
      public_description?: string
      subfields?: components["schemas"]["Subfield"][]
      featured_list?: number | null
      lists?: components["schemas"]["UserList"][]
      about?: {
        [key: string]: unknown
      } | null
      /** @description Get the avatar image URL */
      avatar?: string
      /** @description Get the banner image URL */
      banner?: string
    }
    /** @description Serializer for moderators */
    FieldModerator: {
      /** @description Returns the name for the moderator */
      moderator_name?: string
      /** @description Get the email from the associated user */
      email?: string
      /** @description Get the full name of the associated user */
      full_name: string
    }
    /** @description Serializer for UserListItem containing only the item id and userlist id. */
    MicroStaffListItem: {
      item_id: number
      list_id: number
      object_id: number
      content_type: string
    }
    /** @description Serializer for UserListItem containing only the item id and userlist id. */
    MicroUserListItem: {
      item_id: number
      list_id: number
      object_id: number
      content_type: string
    }
    PaginatedFieldChannelList: {
      /** @example 123 */
      count?: number
      /**
       * Format: uri
       * @example http://api.example.org/accounts/?offset=400&limit=100
       */
      next?: string | null
      /**
       * Format: uri
       * @example http://api.example.org/accounts/?offset=200&limit=100
       */
      previous?: string | null
      results?: components["schemas"]["FieldChannel"][]
    }
    /** @description Similar to FieldChannelCreateSerializer, with read-only name */
    PatchedFieldChannelWrite: {
      name?: string
      title?: string
      public_description?: string
      subfields?: components["schemas"]["Subfield"][]
      featured_list?: number | null
      lists?: components["schemas"]["UserList"][]
      about?: {
        [key: string]: unknown
      } | null
      /** @description Get the avatar image URL */
      avatar?: string
      /** @description Get the banner image URL */
      banner?: string
    }
    /** @description Serializer for Subfields */
    Subfield: {
      parent_field: string
      field_channel: string
      position?: number
    }
    /** @description Simplified serializer for UserList model. */
    UserList: {
      id: number
      /** @description Return the number of items in the list */
      item_count: number
      topics?: components["schemas"]["CourseTopic"][]
      /** @description get author name for userlist */
      author_name: string
      object_type: string
      /** @description Return the user list's image or the image of the first item */
      image_src: string
      /** @description Returns the audience for the user list */
      audience: readonly string[]
      /** @description Returns the certification for the user list */
      certification: readonly string[]
      is_favorite: boolean
      lists: readonly components["schemas"]["MicroUserListItem"][]
      stafflists: readonly components["schemas"]["MicroStaffListItem"][]
      title: string
      short_description?: string | null
      image_description?: string | null
      privacy_level?: string
      list_type: string
      author: number
      offered_by?: number[]
    }
  }
  responses: never
  parameters: never
  requestBodies: never
  headers: never
  pathItems: never
}

export type external = Record<string, never>

export interface operations {
  /** @description Viewset for Field Channels */
  root_list: {
    parameters: {
      query?: {
        /** @description Number of results to return per page. */
        limit?: number
        /** @description The initial index from which to return the results. */
        offset?: number
      }
    }
    responses: {
      200: {
        content: {
          "application/json": components["schemas"]["PaginatedFieldChannelList"]
        }
      }
    }
  }
  /** @description Viewset for Field Channels */
  root_create: {
    requestBody: {
      content: {
        "application/json": components["schemas"]["FieldChannelCreate"]
        "application/x-www-form-urlencoded": components["schemas"]["FieldChannelCreate"]
        "multipart/form-data": components["schemas"]["FieldChannelCreate"]
      }
    }
    responses: {
      201: {
        content: {
          "application/json": components["schemas"]["FieldChannelCreate"]
        }
      }
    }
  }
  /** @description Viewset for Field Channels */
  root_retrieve: {
    parameters: {
      path: {
        field_name: string
      }
    }
    responses: {
      200: {
        content: {
          "application/json": components["schemas"]["FieldChannel"]
        }
      }
    }
  }
  /** @description Viewset for Field Channels */
  root_update: {
    parameters: {
      path: {
        field_name: string
      }
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["FieldChannelWrite"]
        "application/x-www-form-urlencoded": components["schemas"]["FieldChannelWrite"]
        "multipart/form-data": components["schemas"]["FieldChannelWrite"]
      }
    }
    responses: {
      200: {
        content: {
          "application/json": components["schemas"]["FieldChannelWrite"]
        }
      }
    }
  }
  /** @description Viewset for Field Channels */
  root_destroy: {
    parameters: {
      path: {
        field_name: string
      }
    }
    responses: {
      /** @description No response body */
      204: never
    }
  }
  /** @description Viewset for Field Channels */
  root_partial_update: {
    parameters: {
      path: {
        field_name: string
      }
    }
    requestBody?: {
      content: {
        "application/json": components["schemas"]["PatchedFieldChannelWrite"]
        "application/x-www-form-urlencoded": components["schemas"]["PatchedFieldChannelWrite"]
        "multipart/form-data": components["schemas"]["PatchedFieldChannelWrite"]
      }
    }
    responses: {
      200: {
        content: {
          "application/json": components["schemas"]["FieldChannelWrite"]
        }
      }
    }
  }
  /** @description View for listing and adding moderators */
  moderators_list: {
    parameters: {
      path: {
        field_name: string
      }
    }
    responses: {
      200: {
        content: {
          "application/json": components["schemas"]["FieldModerator"][]
        }
      }
    }
  }
  /** @description View for listing and adding moderators */
  moderators_create: {
    parameters: {
      path: {
        field_name: string
      }
    }
    requestBody?: {
      content: {
        "application/json": components["schemas"]["FieldModerator"]
        "application/x-www-form-urlencoded": components["schemas"]["FieldModerator"]
        "multipart/form-data": components["schemas"]["FieldModerator"]
      }
    }
    responses: {
      201: {
        content: {
          "application/json": components["schemas"]["FieldModerator"]
        }
      }
    }
  }
  /** @description Remove the user from the moderator groups for this website */
  moderators_destroy: {
    parameters: {
      path: {
        field_name: string
        moderator_name: string
      }
    }
    responses: {
      /** @description No response body */
      204: never
    }
  }
}
