// import React from "react"
// import { Container } from "ol-components"
// import ResourceCarousel, {
//   ResourceCarouselProps,
// } from "@/page-components/ResourceCarousel/ResourceCarousel"

// const UPCOMING_COURSES_CAROUSEL: ResourceCarouselProps["config"] = [
//   {
//     label: "All",
//     cardProps: { size: "medium" },
//     data: {
//       type: "resources",
//       params: { resource_type: ["course"], limit: 12, sortby: "upcoming" },
//     },
//   },
//   {
//     label: "Professional",
//     cardProps: { size: "medium" },
//     data: {
//       type: "resources",
//       params: {
//         professional: true,
//         resource_type: ["course"],
//         limit: 12,
//         sortby: "upcoming",
//       },
//     },
//   },
// ]

// /**
//  * Display upcoming courses.
//  *
//  * This is currently unused but we are keeping around for the moment.
//  */
// const UpcomingCoursesSection: React.FC = () => {
//   return (
//     <Container>
//       <ResourceCarousel
//         title="Upcoming Courses"
//         config={UPCOMING_COURSES_CAROUSEL}
//       />
//     </Container>
//   )
// }

// export default UpcomingCoursesSection
