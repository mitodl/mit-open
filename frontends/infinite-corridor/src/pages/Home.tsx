import React from "react"
import { useLearningResourcesList } from "api/hooks/learningResources"

const HomePage: React.FC = () => {
  const listQuery = useLearningResourcesList()
  return (
    <ul>
      {listQuery.data?.results?.map(resource => {
        return <li key={resource.id}>{resource.title}</li>
      })}
    </ul>
  )
}

export default HomePage
