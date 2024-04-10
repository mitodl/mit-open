import React from "react"
import { Link } from "react-router-dom"
import * as routes from "../../common/urls"
import { BannerPage, styled, Container } from "ol-components"
import { useChannelDetail } from "api/hooks/fields"
import FieldMenu from "@/components/FieldMenu/FieldMenu"
import FieldAvatar from "@/components/FieldAvatar/FieldAvatar"

export const FieldTitleRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  h1 a {
    margin-left: 1em;

    &:hover {
      text-decoration: none;
    }
  }
`

export const FieldControls = styled.div`
  position: relative;
  flex-grow: 0.95;
  justify-content: flex-end;
  min-height: 38px;
  display: flex;
  align-items: center;
`

interface FieldSkeletonProps {
  children: React.ReactNode
  channelType: string
  name: string
}

/**
 * Common structure for field-oriented pages.
 *
 * Renders the field title and avatar in a banner.
 */
const FieldSkeletonProps: React.FC<FieldSkeletonProps> = ({
  children,
  channelType,
  name,
}) => {
  const field = useChannelDetail(String(channelType), String(name))

  return (
    <BannerPage
      src={field.data?.banner ?? ""}
      alt=""
      omitBackground={field.isLoading}
      bannerContent={
        <Container>
          <FieldTitleRow>
            {field.data && (
              <>
                <FieldAvatar field={field.data} imageSize="medium" />
                <h1>
                  <Link
                    to={routes.makeFieldViewPath(
                      field.data.channel_type,
                      field.data.name,
                    )}
                  >
                    {field.data.title}
                  </Link>
                </h1>
                <FieldControls>
                  {field.data?.is_moderator ? (
                    <FieldMenu
                      channelType={String(channelType)}
                      name={String(name)}
                    />
                  ) : null}
                </FieldControls>
              </>
            )}
          </FieldTitleRow>
        </Container>
      }
    >
      {children}
    </BannerPage>
  )
}

export default FieldSkeletonProps
