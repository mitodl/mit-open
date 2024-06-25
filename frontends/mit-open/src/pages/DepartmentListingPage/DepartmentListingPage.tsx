import React from "react"
import {
  Container,
  Typography,
  styled,
  PlainList,
  List,
  ListItem,
  ListItemLink,
  ListItemText,
  Grid,
  Banner,
  Breadcrumbs,
} from "ol-components"
import { MetaTags, pluralize } from "ol-utilities"
import type {
  LearningResourceSchool,
  LearningResourcesSearchResponse,
} from "api"
import {
  useLearningResourcesSearch,
  useSchoolsList,
} from "api/hooks/learningResources"
import {
  RiPaletteLine,
  RiSeedlingLine,
  RiBriefcaseLine,
  RiMacbookLine,
  RiBarChartBoxLine,
  RiUserSearchLine,
  RiArrowRightSLine,
} from "@remixicon/react"
import { HOME } from "@/common/urls"

const SCHOOL_ICONS: Record<string, React.ReactNode> = {
  "https://sap.mit.edu/": <RiPaletteLine />,
  "https://engineering.mit.edu/": <RiBriefcaseLine />,
  "https://shass.mit.edu/": <RiMacbookLine />,
  "https://science.mit.edu/": <RiBarChartBoxLine />,
  "http://mitsloan.mit.edu/": <RiSeedlingLine />,
  "https://computing.mit.edu/": <RiUserSearchLine />,
}

const Page = styled.div(({ theme }) => ({
  backgroundColor: theme.custom.colors.white,
}))

const SchoolTitle = styled.h2(({ theme }) => {
  return {
    marginBottom: "10px",
    display: "flex",
    alignItems: "center",
    ...theme.typography.h5,
    [theme.breakpoints.down("sm")]: {
      ...theme.typography.subtitle1,
    },
  }
})

const SchoolIcon = styled.span(({ theme }) => ({
  paddingRight: "10px",
  verticalAlign: "text-top",
  display: "inline-flex",
  fontSize: theme.typography.pxToRem(20),
  [theme.breakpoints.down("sm")]: {
    fontSize: theme.typography.pxToRem(16),
  },
  "& svg": {
    width: "1em",
    height: "1em",
  },
}))

const DepartmentLink = styled(ListItemLink)(({ theme }) => ({
  color: theme.custom.colors.darkGray2,
  borderBottom: `1px solid ${theme.custom.colors.lightGray2}`,
  paddingTop: "16px",
  paddingBottom: "16px",
  paddingLeft: `calc(${theme.typography.pxToRem(20)} + 10px)`,
  [theme.breakpoints.down("sm")]: {
    paddingBottom: "12px",
    paddingTop: "12px",
    paddingLeft: `calc(${theme.typography.pxToRem(16)} + 10px)`,
  },
  display: "flex",
  columnGap: "16px",
  "& svg": {
    color: theme.custom.colors.silverGray,
  },
  "& .MuiListItemText-primary": {
    ...theme.typography.subtitle1,
    [theme.breakpoints.down("sm")]: {
      ...theme.typography.subtitle2,
    },
  },
  "& .MuiListItemText-secondary": {
    ...theme.typography.body2,
    color: theme.custom.colors.silverGrayDark,
    marginTop: "4px",
    "& > *": {
      marginRight: "12px",
    },
  },
  "&:hover": {
    backgroundColor: theme.custom.colors.lightGray1,
    ".hover-dark, .MuiListItemText-secondary": {
      color: theme.custom.colors.darkGray1,
    },
    ".hover-highlight": {
      color: theme.custom.colors.lightRed,
      textDecoration: "underline",
    },
  },
  "& .view-link": {
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },
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
      <SchoolTitle>
        <SchoolIcon aria-hidden>
          {SCHOOL_ICONS[school.url] ?? <RiPaletteLine />}
        </SchoolIcon>
        {school.name}
      </SchoolTitle>
      <List disablePadding>
        {school.departments.map((department) => {
          const courses = courseCounts[department.department_id] ?? 0
          const programs = programCounts[department.department_id] ?? 0
          const counts = [
            { count: courses, label: pluralize("Course", courses) },
            { count: programs, label: pluralize("Program", programs) },
          ]
          return (
            <ListItem disablePadding key={department.department_id}>
              <DepartmentLink href={department.channel_url ?? ""}>
                <ListItemText
                  primary={department.name}
                  secondary={counts
                    .filter(({ count }) => count > 0)
                    .map(({ count, label }) => (
                      <span key={label}>{`${count} ${label}`}</span>
                    ))}
                />
                <Typography
                  variant="body2"
                  className="view-link hover-highlight"
                  aria-hidden // This is a visual affordance only. Screenreaders will announce the link ancestor role.
                >
                  View
                </Typography>
                <RiArrowRightSLine className="hover-dark" />
              </DepartmentLink>
            </ListItem>
          )
        })}
      </List>
    </Component>
  )
}

const SchoolList = styled(PlainList)(({ theme }) => ({
  "> li": {
    marginTop: "40px",
    [theme.breakpoints.down("sm")]: {
      marginTop: "30px",
    },
  },
}))

const aggregateByDepartment = (
  data: LearningResourcesSearchResponse,
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
      <MetaTags title="Departments" />
      <Banner
        backgroundUrl="/static/images/background_steps.jpeg"
        title="Browse by Academic Department"
        description="At MIT, academic departments span a wide range of disciplines, from science and engineering to humanities. Select a department below to explore all of its online course offerings."
        navText={
          <Breadcrumbs
            variant="dark"
            ancestors={[{ href: HOME, label: "Home" }]}
            current="Departments"
          />
        }
      />
      <Container>
        <Grid container>
          <Grid item xs={0} sm={1}></Grid>
          <Grid item xs={12} sm={10}>
            <SchoolList>
              {schoolsQuery.data?.results?.map((school) => (
                <SchoolDepartments
                  as="li"
                  key={school.id}
                  school={school}
                  courseCounts={courseCounts}
                  programCounts={programCounts}
                />
              ))}
            </SchoolList>
          </Grid>
        </Grid>
      </Container>
    </Page>
  )
}

export default DepartmentListingPage
