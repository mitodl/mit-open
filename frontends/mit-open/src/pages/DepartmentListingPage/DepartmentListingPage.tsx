import React from "react"
import {
  Container,
  Typography,
  styled,
  PlainList,
  Chip,
  Stack,
  List,
  ListItem,
  ListItemLink,
  ListItemText,
} from "ol-components"
import type { TypographyProps } from "ol-components"
import { pluralize } from "ol-utilities"
import type {
  LearningResourceSchool,
  LearningResourceSearchResponse,
} from "api"
import {
  useLearningResourcesSearch,
  useSchoolsList,
} from "api/hooks/learningResources"
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined"

const FullWidthBackground = styled.div`
  background-image: url("/static/images/background_steps.jpeg");
  background-size: cover;
  padding-top: 48px;
  padding-bottom: 48px;
  color: ${({ theme }) => theme.custom.colors.white};
`

const Page = styled.div(({ theme }) => ({
  backgroundColor: theme.custom.colors.white,
}))

const HeaderDesription = styled(Typography)(({ theme }) => ({
  maxWidth: theme.breakpoints.values.sm,
  marginTop: theme.spacing(1),
}))

const SchoolTitle: React.FC<TypographyProps> = styled(Typography)(
  ({ theme }) => ({
    paddingTop: "16px",
    paddingBottom: "16px",
    borderBottom: `1px solid ${theme.custom.colors.silverGrayLight}`,
    "& > svg": {
      verticalAlign: "text-top",
      marginRight: "8px",
    },
  }),
)

const DepartmentLink = styled(ListItemLink)(({ theme }) => ({
  borderBottom: `1px solid ${theme.custom.colors.lightGray2}`,
  paddingTop: "16px",
  paddingBottom: "16px",
  paddingLeft: "32px", // Icon (24px) + 8px icon padding
}))

type SchoolDepartmentProps = {
  school: LearningResourceSchool
  courseCounts: Record<string, number>
  programCounts: Record<string, number>
  className?: string
  as?: React.ElementType
}
const SchoolDepartments: React.FC<SchoolDepartmentProps> = ({
  school,
  courseCounts,
  programCounts,
  className,
  as: Component = "div",
}) => {
  return (
    <Component className={className}>
      <SchoolTitle variant="h5" component="h2">
        <PaletteOutlinedIcon />
        {school.name}
      </SchoolTitle>
      <List disablePadding>
        {school.departments.map((department) => {
          const courses = courseCounts[department.department_id] ?? 0
          const programs = programCounts[department.department_id] ?? 0
          return (
            <ListItem disablePadding key={department.department_id}>
              <DepartmentLink href={department.channel_url ?? ""}>
                <Stack direction="row" columnGap={1} alignItems="center">
                  <ListItemText
                    primaryTypographyProps={{ variant: "subtitle1" }}
                    primary={department.name}
                  />
                  {courses ? (
                    <Chip
                      variant="outlined"
                      label={`${courses} ${pluralize("Course", courses)}`}
                    />
                  ) : null}
                  {programs ? (
                    <Chip
                      variant="outlined"
                      label={`${programs} ${pluralize("Program", programs)}`}
                    />
                  ) : null}
                </Stack>
              </DepartmentLink>
            </ListItem>
          )
        })}
      </List>
    </Component>
  )
}

const aggregateByDepartment = (
  data: LearningResourceSearchResponse,
): Record<string, number> => {
  const buckets = data.metadata.aggregations["department"] ?? []
  return Object.fromEntries(
    buckets.map((bucket) => {
      return [bucket.key, bucket.doc_count]
    }),
  )
}

const DepartmentListingPage: React.FC = () => {
  const schoolsQuery = useSchoolsList()
  const courseQuery = useLearningResourcesSearch({
    resource_type: ["course"],
    aggregations: ["department"],
  })
  const programQuery = useLearningResourcesSearch({
    resource_type: ["program"],
    aggregations: ["department"],
  })
  const courseCounts = courseQuery.data
    ? aggregateByDepartment(courseQuery.data)
    : {}
  const programCounts = programQuery.data
    ? aggregateByDepartment(programQuery.data)
    : {}

  return (
    <Page>
      <FullWidthBackground>
        <Container>
          <Typography variant="subtitle3">MIT / Departments</Typography>
          <Typography variant="h1">Departments</Typography>
          <HeaderDesription>
            At MIT, academic departments span a wide range of disciplines, from
            science and engineering to Humanities. Select a department below to
            explore all of its online course offerings
          </HeaderDesription>
        </Container>
      </FullWidthBackground>
      <Container>
        <PlainList marginTop={10} marginBottom={10} itemSpacing={5}>
          {schoolsQuery.data?.results?.map((school) => (
            <SchoolDepartments
              as="li"
              key={school.id}
              school={school}
              courseCounts={courseCounts}
              programCounts={programCounts}
            />
          ))}
        </PlainList>
      </Container>
    </Page>
  )
}

export default DepartmentListingPage
