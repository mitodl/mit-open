
type MetaTagsProps = {
  title?: string
  description?: string
  image?: string
  imageAlt?: string
  canonicalLink?: string
  children?: React.ReactNode
  social?: boolean
}

const DEFAULT_OG_IMAGE = `${process.env.NEXT_PUBLIC_ORIGIN}/images/opengraph-image.jpg`

export const getMetadata = ({
  title = "MIT Learn",
  description = "Learn with MIT",
  image = DEFAULT_OG_IMAGE,
  imageAlt,
  children,
  social = true,
  isResourceDrawer,
}: MetaTagsProps) => {

  title = `${title} | ${process.env.NEXT_PUBLIC_SITE_NAME}`

  const siteName = process.env.NEXT_PUBLIC_SITE_NAME

  const socialMetadata = social ? {
    openGraph: {
      title,
      description,
      url: process.env.NEXT_PUBLIC_ORIGIN,
      siteName: process.env.NEXT_PUBLIC_SITE_NAME,
      images: [
        {
          url: image,
          width: 967, // TODO pass as props
          height: 511,
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