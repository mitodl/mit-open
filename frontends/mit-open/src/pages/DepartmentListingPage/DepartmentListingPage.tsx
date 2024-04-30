import React from "react"
import {
  Container,
  Typography,
  styled,
  PlainList,
  ChipLink,
  Stack,
} from "ol-components"
import { useSchoolsList } from "api/hooks/learningResources"

const FullWidthBackground = styled.div`
  background-image: url("/static/images/background_steps.jpeg");
  background-size: cover;
  padding-top: 48px;
  padding-bottom: 48px;
  color: ${({ theme }) => theme.custom.colors.white};
`
const HeaderDesription = styled(Typography)(({ theme }) => ({
  maxWidth: theme.breakpoints.values.sm,
  marginTop: theme.spacing(1),
}))

type ChannelListItemProps = {
  title: string
  subchannels: {
    name: string
    id: string
    channel_url: string | null
  }[]
  className?: string
}

const ChannelListItem = styled(
  ({ className, title, subchannels }: ChannelListItemProps) => {
    return (
      <li className={className}>
        <Typography variant="h5" component="span">
          {title}
        </Typography>
        <Typography
          variant="body3"
          color={(theme) => theme.custom.colors.silverGrayDark}
        >
          Courses 123 | Programs 123 | Resources 123
        </Typography>
        <Stack
          direction="row"
          marginTop={1}
          flexWrap="wrap"
          rowGap={1}
          columnGap={0.5}
        >
          {subchannels.map((sub) => {
            if (!sub.channel_url) {
              console.warn(`No channel_url found for ${sub.id}`)
              return
            }
            return (
              <ChipLink key={sub.id} href={sub.channel_url} label={sub.name} />
            )
          })}
        </Stack>
      </li>
    )
  },
)(({ theme }) => ({
  paddingTop: "24px",
  paddingBottom: "24px",
  "&:not(:last-child)": {
    borderBottom: `1px solid ${theme.custom.colors.lightGray2}`,
  },
}))

const DepartmentListingPage: React.FC = () => {
  const schoolsQuery = useSchoolsList()

  return (
    <>
      <FullWidthBackground>
        <Container>
          <Typography variant="subtitle3">MIT / Departments</Typography>
          <Typography variant="h1">Departments</Typography>
          <HeaderDesription>
            Lorem ipsum dolor sit amet consectetur. Vitae nunc ut donec viverra
            odio ac rutrum. Pellentesque ipsum tortor orci ut nulla.
          </HeaderDesription>
        </Container>
      </FullWidthBackground>
      <Container>
        <PlainList marginBottom={10} marginTop={10}>
          {schoolsQuery.data?.results?.map((school) => (
            <ChannelListItem
              key={school.id}
              title={school.name}
              subchannels={school.departments.map((d) => ({
                name: d.name,
                id: d.department_id,
                channel_url: d.channel_url,
              }))}
            />
          ))}
        </PlainList>
      </Container>
    </>
  )
}

export default DepartmentListingPage
