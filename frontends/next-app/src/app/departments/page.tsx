import Link from "next/link"

type Props = {
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata({ searchParams }: Props) {
  console.log(searchParams)
  return {
    title: `Departments: ${searchParams.a}`,
    description: "Departments page",
  }
}

export default function Departments() {
  return (
    <main>
      Departments Page, Rendered at: {new Date().toString()}
      <Link href="?a=456">456</Link>
    </main>
  )
}
