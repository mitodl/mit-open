import { RESOURCE_DRAWER_QUERY_PARAM } from "@/common/urls"
import { learningResourcesApi } from "api/clients"



const DEFAULT_OG_IMAGE = `${process.env.NEXT_PUBLIC_ORIGIN}/images/opengraph-image.jpg`


type MetadataAsyncProps = {
  title?: string
  description?: string
  image?: string
  imageAlt?: string
  searchParams?: { [key: string]: string | string[] | undefined }
  social?: boolean
}

export const getMetadataAsync = async ({
  title = "MIT Learn",
  description = "Learn with MIT",
  image = DEFAULT_OG_IMAGE,
  imageAlt,
  searchParams,
  social = true,
}: MetadataAsyncProps) => {

  title = `${title} | ${process.env.NEXT_PUBLIC_SITE_NAME}`

  // The learning resource drawer is open
  const learningResourceId = searchParams?.[RESOURCE_DRAWER_QUERY_PARAM]
  if (learningResourceId) {
    try {
      const { data } = await learningResourcesApi.learningResourcesRetrieve({ id: Number(learningResourceId) })

      title = `${data?.title} | ${process.env.NEXT_PUBLIC_SITE_NAME}`
      description = data?.description?.replace(/<\/[^>]+(>|$)/g, "") ?? ""
      image = data?.image?.url || image
      imageAlt = image === data?.image?.url ? imageAlt : (data?.image?.alt || "")

    } catch (error) {
      console.warn('Failed to fetch learning resource', { learningResourceId, error })
    }
  }

  return getMetadata({
    title,
    description,
    image,
    imageAlt,
    social
  })
}


type MetadataProps = Omit<MetadataAsyncProps, "searchParams">

export const getMetadata = ({
  title = "MIT Learn",
  description = "Learn with MIT",
  image = DEFAULT_OG_IMAGE,
  imageAlt,
  social = true,
}: MetadataProps) => {
  const socialMetadata = social ? {
    openGraph: {
      title,
      description,
      // url: process.env.NEXT_PUBLIC_ORIGIN,
      siteName: process.env.NEXT_PUBLIC_SITE_NAME,
      images: [
        {
          url: image,
          width: image === DEFAULT_OG_IMAGE ? "" : 967,
          height: image === DEFAULT_OG_IMAGE ? "" : 511,
          alt: imageAlt
        }
      ],
      videos: [],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image], // Must be an absolute URL
    },
  } : {}

  return {
    title,
    description,
    ...socialMetadata
  }
}
