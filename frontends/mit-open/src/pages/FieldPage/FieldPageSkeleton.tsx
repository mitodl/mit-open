import React from "react"
import { Link } from "react-router-dom"
import * as routes from "../../common/urls"
import { BannerPage, styled, Container } from "ol-components"
import { useFieldDetail } from "api/hooks/fields"
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
  name: string
}

/**
 * Common structure for field-oriented pages.
 *
 * Renders the field title and avatar in a banner.
 */
const FieldSkeletonProps: React.FC<FieldSkeletonProps> = ({
  children,
  name,
}) => {
  const field = useFieldDetail(name)

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
                  <Link to={routes.makeFieldViewPath(field.data.name)}>
                    {field.data.title}
                  </Link>
                </h1>
                <FieldControls>
                  {field.data?.is_moderator ? (
                    <FieldMenu fieldName={field.data.name} />
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
